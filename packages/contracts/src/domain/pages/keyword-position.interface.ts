/** A keyword a page targets, with the latest position recorded for it. */
export interface IKeywordPosition {
  keywordId: number;
  term: string;
  /** In (0, 1]: the page's top keyword is 1. */
  relevance: number;
  /** null until the first snapshot exists (a page crawled after the last seed). */
  latestPosition: number | null;
  /** ISO-8601 UTC instant of that position. */
  latestCapturedAt: string | null;
}
