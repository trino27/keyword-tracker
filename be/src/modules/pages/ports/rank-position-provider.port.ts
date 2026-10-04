/**
 * Where a page's position for a keyword COMES FROM. The simulation is one
 * implementation; a real rank API is another, and nothing outside this port knows
 * which one is wired in.
 *
 * The asymmetry the port exists to absorb: an inventing provider can answer for a year
 * of past days in one call, while a live SERP engine can only see today. So a request
 * names a WINDOW of daily captures and the provider returns what it can cover — all
 * 366 days, or just the last one. The caller treats a short answer as normal, never as
 * a failure.
 */

/** One page–keyword pair as a rank provider is asked about it. */
export interface IRankTarget {
  pageId: number;
  keywordId: number;
  url: string;
  term: string;
  /** How much the page is about the term, 0–1. The simulation ranks by it; a live engine ignores it. */
  relevance: number;
  /** The last capture already stored for this pair, so a walk can continue from it. */
  lastCapturedAt: Date | null;
  lastPosition: number | null;
}

/** One pair's missing span: daily captures from `from` to `to`, both ends included. */
export interface IRankRequest {
  target: IRankTarget;
  from: Date;
  to: Date;
}

/** A position the provider stands behind, at a daily capture instant. */
export interface IRankObservation {
  pageId: number;
  keywordId: number;
  capturedAt: Date;
  position: number;
}

export interface IRankPositionProvider {
  /** The value of RANK_PROVIDER that selects this one. */
  readonly id: string;

  /**
   * Positions for a batch of requests. A provider MAY return fewer days than asked —
   * a live engine returns only the latest instant — but never a day outside a
   * request's window, a pair it was not given, or a position outside 1–100.
   *
   * It must not write to the database: the caller owns the transaction and the
   * idempotent insert, so a provider stays replaceable without touching persistence.
   */
  capture(requests: IRankRequest[]): Promise<IRankObservation[]>;
}

export const RANK_POSITION_PROVIDER = Symbol('RANK_POSITION_PROVIDER');
