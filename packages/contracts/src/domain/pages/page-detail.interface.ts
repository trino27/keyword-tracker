import type { ICrawlRunSummary } from '../crawl/crawl-run.interface.js';
import type { TSeoIssue } from '../seo/seo-issue.interface.js';
import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';
import type { TChecksByOwner } from './page-check.interface.js';
import type { IPageScore } from './page-score/page-score.util.js';
import type { IPageSpeedAvailability } from '../page-speed/page-speed-availability.interface.js';
import type { IPageSpeedSummary } from '../page-speed/page-speed-summary.interface.js';

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
   * Every check of every scored owner with its outcome, each owner's list in its
   * catalogue's order — what the score's denominator is made of, enumerated rather than
   * summarised. The screen puts counterparts on one row (`ISSUE_COUNTERPARTS`).
   *
   * Composed here rather than on the screen because only this side holds the stored
   * lists, and without them a check the catalogue gained after the owner last judged the
   * page is indistinguishable from one that passed.
   *
   * The crawl's is null while the page's last crawl predates per-check recording: a
   * re-crawl is the only honest way to learn which checks were skipped. Lighthouse's is
   * null until the page is measured with its categories.
   */
  checksByOwner: TChecksByOwner;
  /**
   * Catalogue order: errors, then warnings, then notices. `pagesAffected` is how many of
   * the client's current pages carry this code, including this one — so 1 means it is
   * this page's problem and anything more points at the template.
   */
  issues: (TSeoIssue & { pagesAffected: number })[];
  /** The client's latest run, whatever its status. */
  lastCrawl: ICrawlRunSummary | null;
  /** Null: never queued for PageSpeed. Never part of `score`. */
  pageSpeed: IPageSpeedSummary | null;
  pageSpeedAvailability: IPageSpeedAvailability;
}
