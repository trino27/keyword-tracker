import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';
import type { IPageScore } from './page-score/page-score.util.js';
import type { IPageSpeedSummary } from '../page-speed/page-speed-summary.interface.js';

export interface IPageIssueCounts {
  total: number;
  error: number;
  warning: number;
  notice: number;
  /**
   * Of this page's findings, how many also appear on at least one other current page of
   * the same client. A number that shows on every row of a client is the signal that the
   * fix belongs in a template, not on a page. Derived at read time, never stored.
   */
  siteWide: number;
}

/** One row of the pages list: a page of the client's current crawl. */
export interface IPageListItem {
  id: number;
  url: string;
  title: string | null;
  client: { id: number; name: string };
  /** By relevance, strongest first. */
  keywords: IKeywordPosition[];
  bestPosition: IBestPosition | null;
  /** The share of the checks that could apply to THIS page and passed. Always present. */
  score: IPageScore;
  /** Speed findings included: a failing Core Web Vital is an issue like any other. */
  issues: IPageIssueCounts;
  /**
   * The page's Core Web Vitals and its place in the PageSpeed queue. Null: the page has
   * never been queued — crawled before PageSpeed existed and not re-crawled or seeded since.
   * Never part of `score`.
   */
  pageSpeed: IPageSpeedSummary | null;
  /** The latest snapshot of any of the page's keywords; ISO-8601 UTC. */
  lastCapturedAt: string | null;
}
