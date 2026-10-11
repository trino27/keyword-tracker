import { Inject, Injectable, Optional } from '@nestjs/common';
import { remoteFailureKind } from '@infrastructure/remote-api/remote-failure-kind/remote-failure-kind';
import type {
  IDocumentFacts,
  IOutboundFacts,
  TOutboundOutcome,
} from '@modules/page-analysis/interfaces/outbound-facts.interface';
import { contentLinksOf } from '@modules/page-analysis/services/checks/_shared/content-links';
import { sameDocument } from '@modules/page-analysis/services/checks/_shared/same-document';
import { documentFactsOf } from '@modules/page-analysis/services/checks/_shared/document-facts';
import { extractPage } from '@modules/page-analysis/services/html-extraction/extract-page';
import { OUTBOUND_CHECK_LIMITS } from '../../constants/outbound-checks.constant';
import type { ICrawledPage } from '../../interfaces/crawled-page.interface';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import type { RobotsPolicy } from '../robots-policy/robots-policy';
import { HostRobotsCache } from './host-robots-cache';

/** The budget, injectable so a test can shrink it; production uses the constant. */
export const OUTBOUND_LIMITS = Symbol('OUTBOUND_LIMITS');
export type IOutboundLimits = {
  [K in keyof typeof OUTBOUND_CHECK_LIMITS]: number;
};

export interface IOutboundInput {
  /** The run's posts, as fetched: their links, canonicals and hreflang are what is asked. */
  pages: readonly ICrawledPage[];
  /** The run's robots.txt; a host it does not govern has its own fetched once. */
  robots: RobotsPolicy;
  /** The origin the run's robots.txt was requested for — the client's website. */
  robotsOrigin: string;
  /** The run's signal: a lost lease or a shutdown aborts the stage, and the run. */
  signal: AbortSignal;
}

interface ITask {
  url: string;
  kind: 'link' | 'document';
}

const UNCHECKED = (
  reason: 'budget' | 'deadline' | 'robots',
): TOutboundOutcome => ({ kind: 'unchecked', reason });

const withoutFragment = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
};

const hostOf = (url: string) => new URL(url).host;

/** The run's own posts by every address they answered at, fragment-free. */
function ownPagesOf(pages: readonly ICrawledPage[]): Map<string, ICrawledPage> {
  const own = new Map<string, ICrawledPage>();
  for (const page of pages)
    for (const url of [page.finalUrl, page.url]) {
      const key = withoutFragment(url);
      if (key && !own.has(key)) own.set(key, page);
    }
  return own;
}

/**
 * What a run's own post answered, read from its fetch instead of a second request. Only
 * the exact address it settled at answered without a redirect: `/post` that 301s to
 * `/post/` is a redirect, though the two name one document.
 */
function fromOwnFetch(page: ICrawledPage, url: string): TOutboundOutcome {
  return {
    kind: 'answered',
    status: page.httpStatus,
    redirects: url === withoutFragment(page.finalUrl) ? [] : page.redirects,
    finalUrl: page.finalUrl,
  };
}

/**
 * The content links of the run, in sitemap order and then document order, each
 * fragment-free URL once (plan §10.2) — exactly the links the link checks judge
 * (`contentLinksOf`), so no request is spent on a link nobody reads: the page itself,
 * the site's development host, Cloudflare's `/cdn-cgi/`. The order is fixed, so two
 * crawls of an unchanged site check the same links.
 */
function linkOrder(pages: readonly ICrawledPage[]): string[] {
  const seen = new Set<string>();
  for (const page of [...pages].sort(
    (a, b) => a.sitemapPosition - b.sitemapPosition,
  ))
    for (const url of contentLinksOf(page)) seen.add(url);
  return [...seen];
}

/**
 * The documents other checks need read, in priority order (plan §10.5): every page's
 * canonical when it names another URL, then every hreflang alternate other than the page
 * itself and `x-default`.
 */
function documentOrder(pages: readonly ICrawledPage[]): string[] {
  const ordered = [...pages].sort(
    (a, b) => a.sitemapPosition - b.sitemapPosition,
  );
  const seen = new Set<string>();
  for (const page of ordered) {
    const { canonical } = documentFactsOf(page);
    const url = canonical && withoutFragment(canonical);
    if (url && !sameDocument(url, page.finalUrl)) seen.add(url);
  }
  for (const page of ordered)
    for (const { lang, href } of page.parsed.alternates) {
      const url = withoutFragment(href);
      if (
        url &&
        lang.toLowerCase() !== 'x-default' &&
        !sameDocument(url, page.finalUrl)
      )
        seen.add(url);
    }
  return [...seen];
}

/** Resolves when the signal aborts, so a wait for a free slot also hears the deadline. */
const abortOf = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) resolve();
    else signal.addEventListener('abort', () => resolve(), { once: true });
  });

/**
 * The crawl's outbound stage (plan D4–D6, D11): the status of every content link and
 * what each canonical target and hreflang alternate declares, under a budget of URLs, a
 * bound on requests in flight overall and per host, robots.txt per host, and one deadline.
 *
 * It never fails the run for what a site answers: a refusal, a timeout or a dead host is
 * an outcome the checks weigh. Only the run's own signal — a lost lease, a shutdown —
 * ends it with an error. The deadline only ends the stage: what it did not reach reads
 * "unchecked: deadline", and the analysis goes on.
 */
@Injectable()
export class OutboundChecksService {
  constructor(
    private readonly http: SiteHttpClient,
    @Optional()
    @Inject(OUTBOUND_LIMITS)
    private readonly limits: IOutboundLimits = OUTBOUND_CHECK_LIMITS,
  ) {}

  async check(input: IOutboundInput): Promise<IOutboundFacts> {
    const stage = AbortSignal.any([
      input.signal,
      AbortSignal.timeout(this.limits.deadlineMs),
    ]);
    // Another host's robots.txt is one request within the stage's per-request timeout:
    // the default retries would hold a slot for half a minute on a host that never answers.
    const robots = new HostRobotsCache(
      input.robotsOrigin,
      input.robots,
      (origin, signal) =>
        this.http.getRobots(origin, signal, {
          maxRetries: 0,
          timeoutMs: this.limits.timeoutMs,
        }),
    );
    const own = ownPagesOf(input.pages);
    const links = new Map<string, TOutboundOutcome>();
    const documents = new Map<string, IDocumentFacts>();
    const tasks: ITask[] = [];

    let linkBudget = this.limits.maxLinkUrls;
    for (const url of linkOrder(input.pages)) {
      const page = own.get(url);
      if (page) links.set(url, fromOwnFetch(page, url));
      else if (linkBudget-- > 0) tasks.push({ url, kind: 'link' });
      else links.set(url, UNCHECKED('budget'));
    }
    let documentBudget = this.limits.maxDocuments;
    for (const url of documentOrder(input.pages)) {
      const page = own.get(url);
      if (page)
        documents.set(url, {
          url,
          outcome: fromOwnFetch(page, url),
          page: documentFactsOf(page),
        });
      else if (documentBudget-- > 0) tasks.push({ url, kind: 'document' });
      else
        documents.set(url, { url, outcome: UNCHECKED('budget'), page: null });
    }

    const record = (task: ITask, facts: IDocumentFacts) => {
      if (task.kind === 'link') links.set(task.url, facts.outcome);
      else documents.set(task.url, facts);
    };
    await this.schedule(tasks, stage, async (task) =>
      record(task, await this.ask(task, robots, stage, input.signal)),
    );
    for (const task of tasks)
      if (!(task.kind === 'link' ? links : documents).has(task.url))
        record(task, {
          url: task.url,
          outcome: UNCHECKED('deadline'),
          page: null,
        });

    input.signal.throwIfAborted();
    return { links, documents };
  }

  /**
   * One shared queue: at most `concurrency` requests in flight and `perHost` to one host.
   * A saturated host does not stall the queue — the next task for another host goes
   * first. When the stage's signal aborts, nothing more starts.
   */
  private async schedule(
    tasks: readonly ITask[],
    stage: AbortSignal,
    work: (task: ITask) => Promise<void>,
  ): Promise<void> {
    const pending = [...tasks];
    const perHost = new Map<string, number>();
    const running = new Set<Promise<void>>();
    const aborted = abortOf(stage);
    while (pending.length > 0 && !stage.aborted) {
      const index =
        running.size < this.limits.concurrency
          ? pending.findIndex(
              ({ url }) =>
                (perHost.get(hostOf(url)) ?? 0) < this.limits.perHost,
            )
          : -1;
      if (index === -1) {
        await Promise.race([...running, aborted]);
        continue;
      }
      const [task] = pending.splice(index, 1);
      const host = hostOf(task.url);
      perHost.set(host, (perHost.get(host) ?? 0) + 1);
      const job: Promise<void> = work(task).finally(() => {
        perHost.set(host, (perHost.get(host) ?? 1) - 1);
        running.delete(job);
      });
      running.add(job);
    }
    await Promise.allSettled(running);
  }

  /** One URL: its host's robots.txt first, then the request, and what it answered. */
  private async ask(
    { url, kind }: ITask,
    robots: HostRobotsCache,
    stage: AbortSignal,
    run: AbortSignal,
  ): Promise<IDocumentFacts> {
    const allowance = await robots.policyFor(new URL(url).origin, stage);
    // The deadline cut the robots.txt read short: the host never said no.
    if (stage.aborted && !run.aborted)
      return { url, outcome: UNCHECKED('deadline'), page: null };
    if (!allowance?.isAllowed(url))
      return { url, outcome: UNCHECKED('robots'), page: null };
    try {
      if (kind === 'link') {
        const response = await this.http.checkLink(
          url,
          stage,
          this.limits.timeoutMs,
        );
        return {
          url,
          outcome: {
            kind: 'answered',
            status: response.status,
            redirects: response.redirects,
            finalUrl: response.finalUrl,
          },
          page: null,
        };
      }
      const response = await this.http.readDocument(
        url,
        stage,
        this.limits.timeoutMs,
      );
      const html =
        response.status === 200 &&
        (response.headers['content-type'] ?? '').includes('html');
      return {
        url,
        outcome: {
          kind: 'answered',
          status: response.status,
          redirects: response.redirects,
          finalUrl: response.finalUrl,
        },
        page: html
          ? documentFactsOf({
              parsed: extractPage(response.text, response.finalUrl),
              headers: response.headers,
              finalUrl: response.finalUrl,
            })
          : null,
      };
    } catch (error) {
      // The stage's deadline, not the site: what it cut short is "not checked".
      if (stage.aborted && !run.aborted)
        return { url, outcome: UNCHECKED('deadline'), page: null };
      return {
        url,
        outcome: { kind: 'failed', failure: remoteFailureKind(error) },
        page: null,
      };
    }
  }
}
