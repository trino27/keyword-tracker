import type { TIsoDay } from '../time/iso-day.type.js';

export interface IPositionPoint {
  /** ISO-8601 UTC instant; the frontend places it on a day in `timeZone`. */
  capturedAt: string;
  position: number;
}

export interface IPositionSeries {
  keywordId: number;
  term: string;
  /** Oldest first; empty when the keyword has no position in the range. */
  points: IPositionPoint[];
}

/** A page's positions over the user's calendar range, both ends included. */
export interface IPositionHistory {
  from: TIsoDay;
  to: TIsoDay;
  /** The zone the range was read in — the user's, never the browser's. */
  timeZone: string;
  /** One per current keyword, by relevance. */
  series: IPositionSeries[];
}

/** `GET /pages/:id/positions` query; both optional (default: the last 30 days). */
export interface IPositionsQuery {
  from?: TIsoDay;
  to?: TIsoDay;
}
