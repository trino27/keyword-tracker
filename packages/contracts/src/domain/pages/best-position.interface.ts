/** A page's best current position across its keywords — computed at read time. */
export interface IBestPosition {
  position: number;
  keywordId: number;
  term: string;
  /** ISO-8601 UTC instant. */
  capturedAt: string;
}
