import type { ICrawlRunSummary } from '../crawl/crawl-run.interface.js';
import type { TSeoIssue } from '../seo/seo-issue.interface.js';
import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';
import type { IPageCheck } from './page-check.interface.js';
import type { IPageScore } from './page-score/page-score.util.js';

export interface IPageDetail {
  page: {
    id: number;
    url: string;
    finalUrl: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    lang: string | null;
    wordCount: number;
    httpStatus: number;
    /**
     * Time to first byte of the crawler's single fetch. A fact of the crawl, never a
     * verdict, and never a field measurement of the page's visitors.
     */
    responseMs: number;
    /** ISO-8601 UTC instant of the last fetch. */
    crawledAt: string;
  };
  client: {
    id: number;
    name: string;
    websiteUrl: string;
    /** Pages on the client's current crawl — the denominator of "on 5 of 15 pages". */
    currentPages: number;
  };
  /** By relevance, strongest first. */
  keywords: IKeywordPosition[];
  bestPosition: IBestPosition | null;
  /** The share of the checks that could apply to THIS page and passed. Always present. */
  score: IPageScore;
  /**
   * Every catalogue check with its outcome, in catalogue order — what the score's
   * denominator is made of, enumerated rather than summarised.
   *
   * Composed here rather than on the screen because only this side holds
   * `checksApplicable`, and without it a check the catalogue gained after this page's
   * crawl is indistinguishable from one that passed.
   *
   * Null while the page's last crawl predates per-check recording: the stored row holds
   * no canonical, no images and no headings, so which checks were skipped cannot be
   * recovered from it, and a re-crawl is the only honest way to learn. Phase 2 drops
   * the null once every client has been re-crawled.
   */
  checks: IPageCheck[] | null;
  /**
   * Catalogue order: errors, then warnings, then notices. `pagesAffected` is how many of
   * the client's current pages carry this code, including this one — so 1 means it is
   * this page's problem and anything more points at the template.
   */
  issues: (TSeoIssue & { pagesAffected: number })[];
  /** The client's latest run, whatever its status. */
  lastCrawl: ICrawlRunSummary | null;
}
