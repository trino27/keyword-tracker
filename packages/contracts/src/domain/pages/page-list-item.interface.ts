import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';
import type { IPageScore } from './page-score/page-score.util.js';

export interface IPageIssueCounts {
  total: number;
  error: number;
  warning: number;
  notice: number;
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
  issues: IPageIssueCounts;
  /** The latest snapshot of any of the page's keywords; ISO-8601 UTC. */
  lastCapturedAt: string | null;
}
