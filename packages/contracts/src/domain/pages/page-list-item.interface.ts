import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';

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
  issues: IPageIssueCounts;
  /** The latest snapshot of any of the page's keywords; ISO-8601 UTC. */
  lastCapturedAt: string | null;
}
