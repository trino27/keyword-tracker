import type { ISiteCheckResult } from '../site/site-check-catalogue.constant.js';
import type { TCrawlItemStatus } from './crawl-item-status.enum.js';
import type { TCrawlRunStatus } from './crawl-run-status.enum.js';
import type { TCrawlTrigger } from './crawl-trigger.enum.js';

/** A run as lists show it — the clients table and the crawl banner. */
export interface ICrawlRunSummary {
  id: number;
  status: TCrawlRunStatus;
  trigger: TCrawlTrigger;
  /** URLs in the selected blog sitemap; 0 until discovery ends. */
  pagesFound: number;
  /** Posts crawled so far — the banner's "6 of 15". */
  pagesDone: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** One sitemap entry the run considered, in sitemap order. */
export interface ICrawlRunItem {
  sitemapPosition: number;
  url: string;
  status: TCrawlItemStatus;
  reason: string | null;
  httpStatus: number | null;
  pageId: number | null;
}

/** A run with its log — `GET /crawl-runs/:id`. */
export interface ICrawlRunDetail extends ICrawlRunSummary {
  clientId: number;
  sitemapUrl: string | null;
  selectionReason: string | null;
  items: ICrawlRunItem[];
  /**
   * The site checks this run judged, in catalogue order; empty for a run that read no
   * site — failed before discovery finished, or crawled before site checks existed.
   */
  siteChecks: ISiteCheckResult[];
}
