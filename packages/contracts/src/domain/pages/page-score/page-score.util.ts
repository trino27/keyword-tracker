import type { TScoredIssueOwner } from '../../seo/catalogue/issue-catalogues.constant.js';

/** What one owner's checks came to on a page, counted and weighed. */
export interface IOwnerCounts {
  /** Checks that could be judged on this page. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
  /** What the applicable checks were worth together, each by its severity. */
  pointsPossible: number;
  /** What the failed ones cost. */
  pointsLost: number;
}

/**
 * Each scored owner's counts, or null where that owner has judged nothing on the page —
 * Lighthouse before its first measurement, or without a PageSpeed key.
 */
export type TScoreByOwner = Record<TScoredIssueOwner, IOwnerCounts | null>;

/** A page's health score, with the counts and the points it was computed from. */
export interface IPageScore {
  /** 0–100: the share of the applicable checks' points that the page kept. */
  value: number;
  /** Checks that could be judged on this page, every scored owner's together. Always > 0. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
  /** What the applicable checks were worth together, each by its severity. Always > 0. */
  pointsPossible: number;
  /** What the failed ones cost. Never more than `pointsPossible`. */
  pointsLost: number;
  /** Whose checks the numbers above are made of, so the screen can say. */
  byOwner: TScoreByOwner;
}

/**
 * One formula, both sides of the wire.
 *
 * Each check weighs what its severity says (`SEVERITY_WEIGHT`): a Critical failure costs
 * a page more than an Important one, and an Important one more than an Improvement. The
 * denominator is weighed the same way, so a page that passes every check that applied
 * still scores 100, however few Critical checks could apply to it.
 *
 * The scored owners' checks are summed — the crawl's and Lighthouse's alike, each weighed
 * by its own severity, a check both judge counted on each side (lighthouse-checks D9,
 * D11). An owner that has judged nothing adds nothing, and `byOwner` says so: a page
 * scored on the crawl alone and one scored on both are different claims even at the same
 * value.
 *
 * The counts travel with the value because two pages with different denominators must
 * not silently compare as equals: 100 out of 13 applicable checks and 100 out of 18 are
 * not the same claim.
 *
 * What the number is allowed to mean: this page has no obvious technical defects. Not a
 * traffic prediction, not a comparison with a competitor, not a judgement of the writing.
 */
export function pageScoreOf(byOwner: TScoreByOwner): IPageScore {
  const owners = Object.values(byOwner).filter(
    (counts): counts is IOwnerCounts => counts !== null,
  );
  const sum = (key: keyof IOwnerCounts) =>
    owners.reduce((total, counts) => total + counts[key], 0);
  const pointsPossible = sum('pointsPossible');
  const pointsLost = sum('pointsLost');
  // The crawl's points are > 0 whenever its count is, and that is stored NOT NULL > 0,
  // so this is a bug, not a page.
  if (pointsPossible <= 0)
    throw new RangeError('A score needs at least one applicable check');
  // Half-up, so a page is never quietly marked down by the rounding.
  const value = Math.round(
    (100 * (pointsPossible - pointsLost)) / pointsPossible,
  );
  return {
    value,
    applicable: sum('applicable'),
    failed: sum('failed'),
    pointsPossible,
    pointsLost,
    byOwner,
  };
}
