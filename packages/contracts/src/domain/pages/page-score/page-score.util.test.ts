import { describe, expect, it } from 'vitest';
import { SEVERITY_WEIGHT } from '../../seo/severity-weight.constant';
import { pageScoreOf } from './page-score.util';

/** Points equal to counts: every check weighs 1, as an Improvement does. */
const unweighted = (applicable: number, failed: number) =>
  pageScoreOf({
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
        pageScoreOf({ applicable: 18, failed: 1, pointsPossible, pointsLost })
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
      pageScoreOf({ applicable: 3, failed: 1, pointsPossible, pointsLost })
        .value;

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
    expect(
      pageScoreOf({
        applicable: 16,
        failed: 2,
        pointsPossible: 60,
        pointsLost: 13,
      }),
    ).toEqual({
      value: 78,
      applicable: 16,
      failed: 2,
      pointsPossible: 60,
      pointsLost: 13,
    });
  });

  it('two pages with different denominators do not compare as equals', () => {
    // Both passed every check they could be judged on, and they are not the same page.
    expect(unweighted(18, 0).value).toBe(unweighted(13, 0).value);
    expect(unweighted(18, 0).applicable).not.toBe(unweighted(13, 0).applicable);
  });
});
