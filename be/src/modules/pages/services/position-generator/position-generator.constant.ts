/** The brief: "at least 50,000 rank snapshots". */
export const MIN_SNAPSHOTS = 50_000;
/** A year of history at least, so every range the UI offers has data. */
export const MIN_HISTORY_DAYS = 365;

/** Snapshots are captured once a day at this UTC hour (D2). */
export const CAPTURE_HOUR_UTC = 12;

/** Share of the distance to the baseline a position closes each day. */
export const REVERT = 0.15;
/** Daily noise, uniform in ±NOISE positions. */
export const NOISE = 2;
/** A rare jump — an algorithm update, a competitor's new page. */
export const JUMP_PROBABILITY = 0.02;
export const JUMP_MIN = 5;
export const JUMP_MAX = 15;

/** Baseline = 3 + (1 − relevance)^1.5 × SPREAD + u × JITTER: strong ≈ 3–15, weak ≈ 30–90. */
export const BASELINE_BEST = 3;
export const BASELINE_SPREAD = 85;
export const BASELINE_JITTER = 12;

export const MIN_POSITION = 1;
export const MAX_POSITION = 100;
