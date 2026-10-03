import { Injectable } from '@nestjs/common';
import type { TSeoIssue } from '@app/contracts';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { KeywordsRepository } from '../../repositories/keywords/keywords.repository';
import {
  PageKeywordsRepository,
  type IUpsertPageKeyword,
} from '../../repositories/page-keywords/page-keywords.repository';
import {
  PagesRepository,
  type IUpsertPage,
} from '../../repositories/pages/pages.repository';
import {
  SeoIssuesRepository,
  type TNewSeoIssue,
} from '../../repositories/seo-issues/seo-issues.repository';

/** One crawled post as the pages module stores it. */
export interface IRunPage {
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  lang: string | null;
  wordCount: number;
  httpStatus: number;
  responseMs: number;
  htmlBytes: number;
  sitemapPosition: number;
  /** Normalized terms; relevance in (0, 1]. */
  keywords: { term: string; relevance: number }[];
  issues: TSeoIssue[];
  /** Written in the same statement as the page, in the same transaction as the issues. */
  checksApplicable: number;
  checksFailed: number;
}

export interface IRunResults {
  clientId: number;
  runId: number;
  crawledAt: Date;
  pages: IRunPage[];
}

/** Column widths; a crawled page is hostile input and may carry a 50 KB <title>. */
const WIDTHS = {
  url: 2048,
  title: 1000,
  metaDescription: 2000,
  h1: 1000,
  lang: 35,
} as const;

const clip = (value: string | null, width: number) =>
  value === null ? null : value.slice(0, width);

/**
 * Writes a finished run's results inside the crawl's finalize transaction. Pages and
 * keyword pairs are upserted, never deleted: what a re-crawl no longer finds keeps its
 * history and is only hidden, by its older last_seen_run_id. Issues describe the
 * latest fetch and are replaced.
 */
@Injectable()
export class CrawlResultsService {
  constructor(
    private readonly pages: PagesRepository,
    private readonly keywords: KeywordsRepository,
    private readonly pageKeywords: PageKeywordsRepository,
    private readonly seoIssues: SeoIssuesRepository,
  ) {}

  /** Returns each stored page's id by its sitemap URL. */
  async applyRunResultsForWorker(
    tx: Transaction,
    results: IRunResults,
  ): Promise<Map<string, number>> {
    const rows: IUpsertPage[] = results.pages.map((page) => ({
      clientId: results.clientId,
      url: page.url,
      finalUrl: page.finalUrl.slice(0, WIDTHS.url),
      title: clip(page.title, WIDTHS.title),
      metaDescription: clip(page.metaDescription, WIDTHS.metaDescription),
      h1: clip(page.h1, WIDTHS.h1),
      lang: clip(page.lang, WIDTHS.lang),
      wordCount: page.wordCount,
      httpStatus: page.httpStatus,
      responseMs: page.responseMs,
      htmlBytes: page.htmlBytes,
      sitemapPosition: page.sitemapPosition,
      checksApplicable: page.checksApplicable,
      checksFailed: page.checksFailed,
      lastSeenRunId: results.runId,
      crawledAt: results.crawledAt,
    }));
    const stored = await this.pages.upsertManyForWorker(tx, rows);
    const pageIds = new Map(stored.map(({ id, url }) => [url, id]));

    const termIds = await this.keywords.upsertTermsForWorker(
      tx,
      results.pages.flatMap((page) => page.keywords.map(({ term }) => term)),
    );
    const pairs: IUpsertPageKeyword[] = results.pages.flatMap((page) =>
      page.keywords.map(({ term, relevance }) => ({
        pageId: pageIds.get(page.url)!,
        keywordId: termIds.get(term)!,
        relevance,
        lastSeenRunId: results.runId,
      })),
    );
    await this.pageKeywords.upsertManyForWorker(tx, pairs);

    const issues: TNewSeoIssue[] = results.pages.flatMap((page) =>
      page.issues.map((issue) => ({
        pageId: pageIds.get(page.url)!,
        ...issue,
      })),
    );
    await this.seoIssues.replaceForPagesForWorker(
      tx,
      [...pageIds.values()],
      issues,
    );

    return pageIds;
  }
}
