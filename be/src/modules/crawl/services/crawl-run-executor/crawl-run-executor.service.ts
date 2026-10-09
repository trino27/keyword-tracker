import { Injectable } from '@nestjs/common';
import { evaluateSite } from '@modules/page-analysis/services/site-checks/site-checks.registry';
import { SiteProbeService } from '../site-probe/site-probe.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CRAWL_POST_LIMIT,
  CRAWL_RUN_ERRORS,
  type TCrawlRunErrorCode,
} from '@app/contracts';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type {
  IClaimedRun,
  ICrawlRunItemRecord,
  IRunOutcome,
} from '@modules/clients/interfaces/client-record.interface';
import { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import {
  PageAnalysisService,
  type IPageAnalysis,
} from '@modules/page-analysis/services/page-analysis/page-analysis.service';
import {
  CrawlResultsService,
  type IRunPage,
} from '@modules/pages/services/crawl-results/crawl-results.service';
import {
  BOT_CHALLENGE_REASON,
  MAX_PAGE_URL_LENGTH,
  REDIRECTED_OFF_SITE_REASON,
} from '../../constants/post-selection.constant';
import { REFUSAL_STATUSES } from '../../constants/site-fetch.constant';
import type {
  ICrawledPage,
  ISelectedItem,
} from '../../interfaces/crawled-page.interface';
import {
  assertRunPipeline,
  emptyRunContext,
  runCrawlPipeline,
} from '../../pipelines/run-pipeline/run-pipeline';
import { RunStages } from '../../pipelines/run-pipeline/run-stages';
import type {
  IRunContext,
  IRunStep,
} from '../../pipelines/run-pipeline/run-step.interface';
import type { ICrawlRunExecutor } from '../../ports/crawl-run-executor.port';
import { PostSelectionService } from '../post-selection/post-selection.service';
import { SitemapDiscoveryService } from '../sitemap-discovery/sitemap-discovery.service';

const failed = (code: TCrawlRunErrorCode): IRunOutcome => ({
  status: 'failed',
  pagesDone: 0,
  errorCode: code,
  errorMessage: CRAWL_RUN_ERRORS[code].message,
});

const REFUSED = REFUSAL_STATUSES;
const UNANSWERED = new Set([
  'Timed out',
  'Could not connect',
  BOT_CHALLENGE_REASON,
]);

/**
 * 15 posts: succeeded; fewer: partial; none: failed — and the failure says why: no page
 * was an article (the source was a guess), robots.txt forbids every post, every post
 * has moved to another site, or the site turned the crawler away.
 */
export function outcomeOf(
  crawled: number,
  items: ISelectedItem[] = [],
  articlesOnly = false,
): IRunOutcome {
  if (crawled === 0) {
    if (
      items.length > 0 &&
      items.every((item) => item.reason === REDIRECTED_OFF_SITE_REASON)
    )
      return failed('SITE_REDIRECTS_ELSEWHERE');
    const onSite = items.filter((item) => item.status !== 'skipped_other_site');
    if (
      onSite.length > 0 &&
      onSite.every((item) => item.status === 'skipped_robots')
    )
      return failed('ROBOTS_DISALLOWED');
    const fetched = items.filter((item) => item.status === 'failed');
    const allRefused =
      fetched.length > 0 &&
      fetched.length === onSite.length &&
      fetched.every(
        (item) =>
          (item.httpStatus !== null && REFUSED.has(item.httpStatus)) ||
          UNANSWERED.has(item.reason ?? ''),
      );
    if (allRefused) return failed('SITE_BLOCKED');
    return failed(articlesOnly ? 'BLOG_SITEMAP_NOT_FOUND' : 'NO_POSTS_CRAWLED');
  }
  return {
    status: crawled >= CRAWL_POST_LIMIT ? 'succeeded' : 'partial',
    pagesDone: crawled,
    errorCode: null,
    errorMessage: null,
  };
}

/**
 * One run, start to end, as the stages it is made of: discovery → fetching (progress
 * recorded under the attempt fence) → analysis → one transaction that writes it all.
 *
 * The stages are a list, so the next one this needs — external signals, the position
 * fill that still runs inside a request — is an entry and a method rather than another
 * limb on a procedure. What the list may not do is reorder itself past the last step:
 * every stage before `persist` may take as long as a slow site takes, and none of them
 * may do so holding a database connection. `assertRunPipeline` refuses a pipeline that
 * breaks that, at construction, before a run exists.
 */
@Injectable()
export class CrawlRunExecutorService implements ICrawlRunExecutor {
  private readonly pipeline: readonly IRunStep[] = assertRunPipeline([
    { name: 'discovery', run: (context) => this.discover(context) },
    { name: 'fetch', run: (context) => this.fetch(context) },
    { name: 'analysis', run: (context) => this.analyse(context) },
    {
      name: 'persist',
      opensTransaction: true,
      run: (context) => this.persist(context),
    },
  ]);

  constructor(
    private readonly runs: ClientCrawlRunsService,
    private readonly discovery: SitemapDiscoveryService,
    private readonly selection: PostSelectionService,
    private readonly siteProbe: SiteProbeService,
    private readonly analysis: PageAnalysisService,
    private readonly results: CrawlResultsService,
    private readonly transactions: TransactionRunner,
    @InjectPinoLogger(CrawlRunExecutorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(run: IClaimedRun, signal: AbortSignal): Promise<void> {
    const stages = new RunStages();
    const context = emptyRunContext(run, signal);
    try {
      await runCrawlPipeline(this.pipeline, context, stages);
    } catch (err: unknown) {
      // Lease lost or shutting down: the attempt that owns the run now finishes it.
      if (signal.aborted) {
        this.logger.warn(
          { runId: run.id, attempt: run.attempts, stage: stages.current },
          'Crawl run aborted',
        );
        return;
      }
      this.logger.error(
        { err, runId: run.id, stage: stages.current },
        'Crawl run failed unexpectedly',
      );
      // Whatever the failed stage had gathered is not written; the verdict is.
      context.selection = null;
      context.pages = null;
      context.outcome = failed('CRAWL_INTERNAL_ERROR');
      await stages.run('persist', () => this.persist(context));
    } finally {
      // Where the run spent itself — what a slow client's log has to answer.
      this.logger.info(
        { runId: run.id, timings: stages.timings },
        'Crawl run stages',
      );
    }
  }

  /** The run's client, then its blog. A run whose client is gone stops here. */
  private async discover(context: IRunContext): Promise<void> {
    const target = await this.runs.getRunTargetForWorker(context.run.id);
    if (!target) return;
    context.target = target;

    const discovery = await this.discovery.discover(target, context.signal);
    if (!discovery.ok) {
      this.logger.info(
        {
          runId: context.run.id,
          errorCode: discovery.errorCode,
          detail: discovery.detail,
        },
        'Crawl run found no blog',
      );
      context.outcome = failed(discovery.errorCode);
      return;
    }

    await this.runs.recordDiscoveryForWorker(
      context.run.id,
      context.run.attempts,
      {
        sitemapUrl: discovery.sitemapUrls[0],
        selectionReason: discovery.reason,
        pagesFound: discovery.urls.length,
      },
    );
    context.discovery = discovery;
  }

  /** The posts themselves, with progress recorded under the attempt fence. */
  private async fetch(context: IRunContext): Promise<void> {
    const { discovery, target, run, signal } = context;
    if (!discovery || !target) return;

    context.selection = await this.selection.select({
      urls: discovery.urls,
      siteKey: target.siteKey,
      robots: discovery.robots,
      signal,
      articlesOnly: discovery.articlesOnly,
      onProgress: (crawled) =>
        this.runs.recordProgressForWorker(run.id, run.attempts, crawled),
    });

    // The site checks' own requests, still before the transaction. The host to compare
    // against is the one the posts were actually served from, so a run that crawled
    // nothing has nothing to compare with and asks nothing.
    const servedOrigin = servedOriginOf(context.selection.pages);
    if (servedOrigin)
      context.siteProbes = await this.siteProbe.probe(
        servedOrigin,
        discovery.robots,
        run.id,
        signal,
      );
  }

  /**
   * Outside any transaction: the whole run is judged at once (IDF). The one read it makes
   * is what the client's previous crawl kept about these URLs, so a check can compare —
   * done here, before the transaction, like every other input the analysis is handed.
   */
  private async analyse(context: IRunContext): Promise<void> {
    const { selection, discovery, target } = context;
    if (!selection || !discovery || !target) return;

    const previous = await this.results.previousCrawlsForWorker(
      target.clientId,
      selection.pages.map(({ url }) => url),
    );
    const analysis = await this.analysis.analyseRun(
      selection.pages.map((page) => ({
        ...page,
        previous: previous.get(page.url) ?? null,
      })),
      target.siteKey,
    );
    context.pages = selection.pages.map((page, index) =>
      toRunPage(page, analysis[index]),
    );
    context.siteChecks = evaluateSite({
      servedOrigin: context.siteProbes?.servedOrigin ?? null,
      crawledAt: new Date(),
      robotsTxt: discovery.facts.robotsTxt,
      sitemapUrls: discovery.urls,
      lastmods: discovery.facts.lastmods,
      fetched: selection.items.map((item) => ({
        url: item.url,
        status: item.status,
        httpStatus: item.httpStatus,
        reason: item.reason,
        page: item.page
          ? {
              finalUrl: item.page.finalUrl,
              dateModified: item.page.parsed.dateModified,
              issues:
                analysis[selection.pages.indexOf(item.page)]?.issues.map(
                  ({ code, details }) => ({
                    code,
                    details: details as Record<string, unknown>,
                  }),
                ) ?? [],
            }
          : null,
      })),
      hostVariants: context.siteProbes?.hostVariants ?? null,
      missingPage: context.siteProbes?.missingPage ?? null,
    });
    context.outcome = outcomeOf(
      selection.pages.length,
      selection.items,
      discovery.articlesOnly,
    );
    return Promise.resolve();
  }

  /** Nothing to write when no stage reached a verdict: the run has no client. */
  private async persist(context: IRunContext): Promise<void> {
    if (context.outcome) await this.finalize(context, context.outcome);
  }

  /** Writes everything or nothing; false when a newer attempt owns the run. */
  private finalize(
    context: IRunContext,
    outcome: IRunOutcome,
  ): Promise<boolean> {
    const { run, target, selection, pages } = context;
    return this.transactions.run(async (tx) => {
      const owned = await this.runs.lockForFinalizeForWorker(
        tx,
        run.id,
        run.attempts,
      );
      if (!owned) {
        this.logger.warn(
          { runId: run.id, attempt: run.attempts },
          'A newer attempt owns the run; dropping these results',
        );
        return false;
      }
      const pageIds =
        pages && target
          ? await this.results.applyRunResultsForWorker(tx, {
              clientId: target.clientId,
              runId: run.id,
              crawledAt: new Date(),
              pages,
            })
          : new Map<string, number>();
      const items: ICrawlRunItemRecord[] = (selection?.items ?? []).map(
        (item) => ({
          sitemapPosition: item.sitemapPosition,
          url: item.url.slice(0, MAX_PAGE_URL_LENGTH),
          status: item.status,
          reason: item.reason,
          httpStatus: item.httpStatus,
          pageId: item.page ? (pageIds.get(item.url) ?? null) : null,
        }),
      );
      await this.runs.finalizeForWorker(
        tx,
        run.id,
        outcome,
        items,
        context.siteChecks ?? [],
      );
      this.logger.info(
        {
          runId: run.id,
          status: outcome.status,
          pagesDone: outcome.pagesDone,
        },
        'Crawl run finished',
      );
      return true;
    });
  }
}

/**
 * The scheme and host most crawled posts ended up at — what the site serves, as opposed
 * to what the client typed or the sitemap says. Null when nothing was crawled.
 */
function servedOriginOf(pages: readonly { finalUrl: string }[]): string | null {
  const counts = new Map<string, number>();
  for (const { finalUrl } of pages) {
    const origin = new URL(finalUrl).origin;
    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function toRunPage(page: ICrawledPage, analysis: IPageAnalysis): IRunPage {
  return {
    url: page.url,
    finalUrl: page.finalUrl,
    title: page.parsed.title,
    metaDescription: page.parsed.metaDescription,
    h1: page.parsed.h1s[0] ?? null,
    lang: page.parsed.lang,
    wordCount: page.parsed.wordCount,
    httpStatus: page.httpStatus,
    responseMs: page.responseMs,
    htmlBytes: page.htmlBytes,
    sitemapPosition: page.sitemapPosition,
    keywords: analysis.keywords,
    issues: analysis.issues,
    checksApplicable: analysis.checksApplicable,
    checksFailed: analysis.checksFailed,
    checksJudged: analysis.checksJudged,
    checksNotApplicable: analysis.checksNotApplicable,
    contentHash: page.parsed.contentHash,
    dateModified: page.parsed.dateModified,
  };
}
