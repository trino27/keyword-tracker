/**
 * How the SIMULATED walk behaves. These are the knobs of one provider, not facts about
 * rank captures — those are in `modules/pages/constants/rank-capture.constant.ts`.
 */

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
