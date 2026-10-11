import { describe, expect, it } from 'vitest';
import { SEVERITY_WEIGHT } from '../../seo/severity-weight.constant';
import { pageScoreOf, type IOwnerCounts } from './page-score.util';

/** A page only the crawl has judged. */
const crawlOnly = (counts: IOwnerCounts) =>
  pageScoreOf({ crawl: counts, lighthouse: null });

/** Points equal to counts: every check weighs 1, as an Improvement does. */
const unweighted = (applicable: number, failed: number) =>
  crawlOnly({
    applicable,
    failed,
    pointsPossible: applicable,
    pointsLost: failed,
  });

describe('pageScoreOf', () => {
  it.each([
    [120, 0, 100],
    [120, 13, 89],
    [100, 50, 50],
    [40, 40, 0],
    [7, 1, 86],
  ])(
    '%d points possible, %d lost is %d',
    (pointsPossible, pointsLost, value) => {
      expect(
        crawlOnly({ applicable: 18, failed: 1, pointsPossible, pointsLost })
          .value,
      ).toBe(value);
    },
  );

  it('weighs a Critical failure above an Important one, and that above an Improvement', () => {
    expect(SEVERITY_WEIGHT.error).toBeGreaterThan(SEVERITY_WEIGHT.warning);
    expect(SEVERITY_WEIGHT.warning).toBeGreaterThan(SEVERITY_WEIGHT.notice);

    // One applicable check of each severity; the page fails exactly one of them.
    const pointsPossible =
      SEVERITY_WEIGHT.error + SEVERITY_WEIGHT.warning + SEVERITY_WEIGHT.notice;
    const failing = (pointsLost: number) =>
      crawlOnly({ applicable: 3, failed: 1, pointsPossible, pointsLost }).value;

    expect(failing(SEVERITY_WEIGHT.error)).toBeLessThan(
      failing(SEVERITY_WEIGHT.warning),
    );
    expect(failing(SEVERITY_WEIGHT.warning)).toBeLessThan(
      failing(SEVERITY_WEIGHT.notice),
    );
  });

  it('rounds half up, so a page is never quietly marked down', () => {
    // 7 of 8 points kept is 87.5 exactly.
    expect(unweighted(8, 1).value).toBe(88);
    // 3 of 8 points kept is 37.5 exactly.
    expect(unweighted(8, 5).value).toBe(38);
  });

  it('carries the counts and the points it was computed from', () => {
    const crawl = {
      applicable: 16,
      failed: 2,
      pointsPossible: 60,
      pointsLost: 13,
    };
    expect(crawlOnly(crawl)).toEqual({
      value: 78,
      applicable: 16,
      failed: 2,
      pointsPossible: 60,
      pointsLost: 13,
      byOwner: { crawl, lighthouse: null },
    });
  });

  it('two pages with different denominators do not compare as equals', () => {
    // Both passed every check they could be judged on, and they are not the same page.
    expect(unweighted(18, 0).value).toBe(unweighted(13, 0).value);
    expect(unweighted(18, 0).applicable).not.toBe(unweighted(13, 0).applicable);
  });
});

describe('pageScoreOf over every scored owner', () => {
  /** Both owners' points are summed, each check weighed by its own severity. */
  it('sums the crawl and Lighthouse, counts and points alike', () => {
    const crawl = {
      applicable: 16,
      failed: 2,
      pointsPossible: 60,
      pointsLost: 13,
    };
    const lighthouse = {
      applicable: 20,
      failed: 3,
      pointsPossible: 100,
      pointsLost: 7,
    };

    expect(pageScoreOf({ crawl, lighthouse })).toEqual({
      // 100 × (160 − 20) ÷ 160 = 87.5
      value: 88,
      applicable: 36,
      failed: 5,
      pointsPossible: 160,
      pointsLost: 20,
      byOwner: { crawl, lighthouse },
    });
  });

  /** A page Lighthouse has not measured is scored on the crawl, and says so. */
  it('lets an absent owner contribute nothing, and reports it absent', () => {
    expect(unweighted(16, 2)).toMatchObject({
      value: 88,
      applicable: 16,
      failed: 2,
      byOwner: { lighthouse: null },
    });
  });

  it('refuses to score a page nothing could be judged on', () => {
    expect(() => unweighted(0, 0)).toThrow(RangeError);
  });
});
