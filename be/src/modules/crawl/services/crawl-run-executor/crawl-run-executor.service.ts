import { Injectable } from '@nestjs/common';
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
import type {
  ICrawledPage,
  IPostSelection,
  ISelectedItem,
} from '../../interfaces/crawled-page.interface';
import type { ICrawlRunExecutor } from '../../ports/crawl-run-executor.port';
import { PostSelectionService } from '../post-selection/post-selection.service';
import { SitemapDiscoveryService } from '../sitemap-discovery/sitemap-discovery.service';

const failed = (code: TCrawlRunErrorCode): IRunOutcome => ({
  status: 'failed',
  pagesDone: 0,
  errorCode: code,
  errorMessage: CRAWL_RUN_ERRORS[code].message,
});

const REFUSED = new Set([401, 403, 429]);
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
 * One run, start to end: discovery → selection and fetching (progress recorded under
 * the attempt fence) → one finalize transaction. All network work happens before the
 * transaction opens, so a slow site never holds a database connection or a lock.
 */
@Injectable()
export class CrawlRunExecutorService implements ICrawlRunExecutor {
  constructor(
    private readonly runs: ClientCrawlRunsService,
    private readonly discovery: SitemapDiscoveryService,
    private readonly selection: PostSelectionService,
    private readonly analysis: PageAnalysisService,
    private readonly results: CrawlResultsService,
    private readonly transactions: TransactionRunner,
    @InjectPinoLogger(CrawlRunExecutorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(run: IClaimedRun, signal: AbortSignal): Promise<void> {
    try {
      await this.executeOrThrow(run, signal);
    } catch (err: unknown) {
      // Lease lost or shutting down: the attempt that owns the run now finishes it.
      if (signal.aborted) {
        this.logger.warn(
          { runId: run.id, attempt: run.attempts },
          'Crawl run aborted',
        );
        return;
      }
      this.logger.error(
        { err, runId: run.id },
        'Crawl run failed unexpectedly',
      );
      await this.finalize(run, failed('CRAWL_INTERNAL_ERROR'), null);
    }
  }

  private async executeOrThrow(
    run: IClaimedRun,
    signal: AbortSignal,
  ): Promise<void> {
    const target = await this.runs.getRunTargetForWorker(run.id);
    if (!target) return;

    const discovery = await this.discovery.discover(target, signal);
    if (!discovery.ok) {
      this.logger.info(
        {
          runId: run.id,
          errorCode: discovery.errorCode,
          detail: discovery.detail,
        },
        'Crawl run found no blog',
      );
      await this.finalize(run, failed(discovery.errorCode), null);
      return;
    }

    await this.runs.recordDiscoveryForWorker(run.id, run.attempts, {
      sitemapUrl: discovery.sitemapUrls[0],
      selectionReason: discovery.reason,
      pagesFound: discovery.urls.length,
    });

    const selection = await this.selection.select({
      urls: discovery.urls,
      siteKey: target.siteKey,
      robots: discovery.robots,
      signal,
      articlesOnly: discovery.articlesOnly,
      onProgress: (crawled) =>
        this.runs.recordProgressForWorker(run.id, run.attempts, crawled),
    });

    // Pure and outside any transaction: the whole run is judged at once (IDF).
    const analysis = this.analysis.analyseRun(selection.pages, target.siteKey);
    await this.finalize(
      run,
      outcomeOf(
        selection.pages.length,
        selection.items,
        discovery.articlesOnly,
      ),
      {
        clientId: target.clientId,
        selection,
        pages: selection.pages.map((page, i) => toRunPage(page, analysis[i])),
      },
    );
  }

  /** Writes everything or nothing; false when a newer attempt owns the run. */
  private finalize(
    run: IClaimedRun,
    outcome: IRunOutcome,
    result: {
      clientId: number;
      selection: IPostSelection;
      pages: IRunPage[];
    } | null,
  ): Promise<boolean> {
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
      const pageIds = result
        ? await this.results.applyRunResultsForWorker(tx, {
            clientId: result.clientId,
            runId: run.id,
            crawledAt: new Date(),
            pages: result.pages,
          })
        : new Map<string, number>();
      const items: ICrawlRunItemRecord[] = (result?.selection.items ?? []).map(
        (item) => ({
          sitemapPosition: item.sitemapPosition,
          url: item.url.slice(0, MAX_PAGE_URL_LENGTH),
          status: item.status,
          reason: item.reason,
          httpStatus: item.httpStatus,
          pageId: item.page ? (pageIds.get(item.url) ?? null) : null,
        }),
      );
      await this.runs.finalizeForWorker(tx, run.id, outcome, items);
      this.logger.info(
        { runId: run.id, status: outcome.status, pagesDone: outcome.pagesDone },
        'Crawl run finished',
      );
      return true;
    });
  }
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
  };
}
