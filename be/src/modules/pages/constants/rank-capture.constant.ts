/**
 * What is true of a rank capture whatever produced it — the simulation today, a real
 * rank provider tomorrow. Nothing here describes HOW a position is arrived at; the
 * simulation's own numbers live in
 * `services/position-generator/position-generator.constant.ts`.
 */

/** Snapshots are captured once a day at this UTC hour (D2). */
export const CAPTURE_HOUR_UTC = 12;

/** The range the `rank_snapshots` CHECK enforces; no provider may return outside it. */
export const MIN_POSITION = 1;
export const MAX_POSITION = 100;

/** The brief: "at least 50,000 rank snapshots". */
export const MIN_SNAPSHOTS = 50_000;
/** A year of history at least, so every range the UI offers has data. */
export const MIN_HISTORY_DAYS = 365;
