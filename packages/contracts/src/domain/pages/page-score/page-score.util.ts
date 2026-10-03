/** A page's health score, with the denominator it was computed from. */
export interface IPageScore {
  /** 0–100: the share of applicable checks that passed. */
  value: number;
  /** Checks that could be judged on this page. Always > 0. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
}

/**
 * One formula, both sides of the wire.
 *
 * Every check counts the same. Weighting by severity would invent a model of search
 * ranking that nobody can justify; Lighthouse's own SEO category weights its audits
 * equally and says so. Severity is how the screen reads, not arithmetic.
 *
 * The `applicable` count travels with the value because two pages with different
 * denominators must not silently compare as equals: 100 out of 13 applicable checks and
 * 100 out of 18 are not the same claim.
 *
 * What the number is allowed to mean: this page has no obvious technical defects. Not a
 * traffic prediction, not a comparison with a competitor, not a judgement of the writing.
 */
export function pageScoreOf(applicable: number, failed: number): IPageScore {
  // Half-up, so a page is never quietly marked down by the rounding.
  const value = Math.round((100 * (applicable - failed)) / applicable);
  return { value, applicable, failed };
}
