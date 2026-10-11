import type { TScoredIssueOwner } from '../../seo/catalogue/issue-catalogues.constant.js';

/** What one owner's checks came to on a page. */
export interface IOwnerCounts {
  /** Checks that could be judged on this page. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
}

/**
 * Each scored owner's counts, or null where that owner has judged nothing on the page —
 * Lighthouse before its first measurement, or without a PageSpeed key.
 */
export type TScoreByOwner = Record<TScoredIssueOwner, IOwnerCounts | null>;

/** A page's health score, with the denominator it was computed from. */
export interface IPageScore {
  /** 0–100: the share of applicable checks that passed. */
  value: number;
  /** Checks that could be judged on this page, every scored owner's together. Always > 0. */
  applicable: number;
  /** Of those, how many the page failed. */
  failed: number;
  /** Whose checks the numbers above are made of, so the screen can say. */
  byOwner: TScoreByOwner;
}

/**
 * One formula, both sides of the wire.
 *
 * Every check counts the same. Weighting by severity would invent a model of search
 * ranking that nobody can justify; Lighthouse's own SEO category weights its audits
 * equally and says so. Severity is how the screen reads, not arithmetic.
 *
 * The scored owners' checks are summed — the crawl's and Lighthouse's alike, a check both
 * judge counted on each side (lighthouse-checks D9, D11). An owner that has judged nothing
 * adds nothing, and `byOwner` says so: a page scored on the crawl alone and one scored on
 * both are different claims even at the same value.
 *
 * The `applicable` count travels with the value because two pages with different
 * denominators must not silently compare as equals: 100 out of 13 applicable checks and
 * 100 out of 18 are not the same claim.
 *
 * What the number is allowed to mean: this page has no obvious technical defects. Not a
 * traffic prediction, not a comparison with a competitor, not a judgement of the writing.
 */
export function pageScoreOf(byOwner: TScoreByOwner): IPageScore {
  const owners = Object.values(byOwner).filter(
    (counts): counts is IOwnerCounts => counts !== null,
  );
  const applicable = owners.reduce((sum, { applicable: n }) => sum + n, 0);
  const failed = owners.reduce((sum, { failed: n }) => sum + n, 0);
  // The crawl's count is stored NOT NULL and > 0, so this is a bug, not a page.
  if (applicable <= 0)
    throw new RangeError('A score needs at least one applicable check');
  // Half-up, so a page is never quietly marked down by the rounding.
  const value = Math.round((100 * (applicable - failed)) / applicable);
  return { value, applicable, failed, byOwner };
}
