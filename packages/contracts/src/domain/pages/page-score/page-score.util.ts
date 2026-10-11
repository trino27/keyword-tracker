/** A page's health score, with the counts and the points it was computed from. */
export interface IPageScore {
  /** 0–100: the share of the applicable checks' points that the page kept. */
  value: number;
  /** Checks that could be judged on this page. Always > 0. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
  /** What the applicable checks were worth together, each by its severity. Always > 0. */
  pointsPossible: number;
  /** What the failed ones cost. Never more than `pointsPossible`. */
  pointsLost: number;
}

/**
 * One formula, both sides of the wire.
 *
 * Each check weighs what its severity says (`SEVERITY_WEIGHT`): a Critical failure costs
 * a page more than an Important one, and an Important one more than an Improvement. The
 * denominator is weighed the same way, so a page that passes every check that applied
 * still scores 100, however few Critical checks could apply to it.
 *
 * The counts travel with the value because two pages with different denominators must
 * not silently compare as equals: 100 out of 13 applicable checks and 100 out of 18 are
 * not the same claim.
 *
 * What the number is allowed to mean: this page has no obvious technical defects. Not a
 * traffic prediction, not a comparison with a competitor, not a judgement of the writing.
 */
export function pageScoreOf(counts: Omit<IPageScore, 'value'>): IPageScore {
  const { pointsPossible, pointsLost } = counts;
  // Half-up, so a page is never quietly marked down by the rounding.
  const value = Math.round(
    (100 * (pointsPossible - pointsLost)) / pointsPossible,
  );
  return { value, ...counts };
}
