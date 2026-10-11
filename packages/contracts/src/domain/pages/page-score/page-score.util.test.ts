import { describe, expect, it } from 'vitest';
import { pageScoreOf } from './page-score.util';

/** The formula's arithmetic, on a page only the crawl has judged. */
const crawlOnly = (applicable: number, failed: number) =>
  pageScoreOf({ crawl: { applicable, failed }, lighthouse: null });

describe('pageScoreOf', () => {
  it.each([
    [18, 0, 100],
    [18, 3, 83],
    [16, 2, 88],
    [16, 16, 0],
    [3, 3, 0],
    [13, 1, 92],
  ])('%d applicable, %d failed is %d', (applicable, failed, value) => {
    expect(crawlOnly(applicable, failed).value).toBe(value);
  });

  it('rounds half up, so a page is never quietly marked down', () => {
    // 7 of 8 passed is 87.5 exactly.
    expect(crawlOnly(8, 1).value).toBe(88);
    // 3 of 8 passed is 37.5 exactly.
    expect(crawlOnly(8, 5).value).toBe(38);
  });

  it('carries the denominator it was computed from', () => {
    expect(crawlOnly(16, 2)).toMatchObject({
      value: 88,
      applicable: 16,
      failed: 2,
    });
  });

  it('two pages with different denominators do not compare as equals', () => {
    // Both passed every check they could be judged on, and they are not the same page.
    expect(crawlOnly(18, 0).value).toBe(crawlOnly(13, 0).value);
    expect(crawlOnly(18, 0).applicable).not.toBe(crawlOnly(13, 0).applicable);
  });
});

describe('pageScoreOf over every scored owner', () => {
  it('sums the crawl and Lighthouse: 16/2 and 20/3 score 86 out of 36', () => {
    expect(
      pageScoreOf({
        crawl: { applicable: 16, failed: 2 },
        lighthouse: { applicable: 20, failed: 3 },
      }),
    ).toEqual({
      value: 86,
      applicable: 36,
      failed: 5,
      byOwner: {
        crawl: { applicable: 16, failed: 2 },
        lighthouse: { applicable: 20, failed: 3 },
      },
    });
  });

  /** A page Lighthouse has not measured is scored on the crawl, and says so. */
  it('lets an absent owner contribute nothing, and reports it absent', () => {
    expect(
      pageScoreOf({ crawl: { applicable: 16, failed: 2 }, lighthouse: null }),
    ).toEqual({
      value: 88,
      applicable: 16,
      failed: 2,
      byOwner: { crawl: { applicable: 16, failed: 2 }, lighthouse: null },
    });
  });

  it('refuses to score a page nothing could be judged on', () => {
    expect(() =>
      pageScoreOf({ crawl: { applicable: 0, failed: 0 }, lighthouse: null }),
    ).toThrow(RangeError);
  });
});
