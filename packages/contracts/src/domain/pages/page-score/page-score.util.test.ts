import { describe, expect, it } from 'vitest';
import { pageScoreOf } from './page-score.util';

describe('pageScoreOf', () => {
  it.each([
    [18, 0, 100],
    [18, 3, 83],
    [16, 2, 88],
    [16, 16, 0],
    [3, 3, 0],
    [13, 1, 92],
  ])('%d applicable, %d failed is %d', (applicable, failed, value) => {
    expect(pageScoreOf(applicable, failed).value).toBe(value);
  });

  it('rounds half up, so a page is never quietly marked down', () => {
    // 7 of 8 passed is 87.5 exactly.
    expect(pageScoreOf(8, 1).value).toBe(88);
    // 3 of 8 passed is 37.5 exactly.
    expect(pageScoreOf(8, 5).value).toBe(38);
  });

  it('carries the denominator it was computed from', () => {
    expect(pageScoreOf(16, 2)).toEqual({
      value: 88,
      applicable: 16,
      failed: 2,
    });
  });

  it('two pages with different denominators do not compare as equals', () => {
    // Both passed every check they could be judged on, and they are not the same page.
    expect(pageScoreOf(18, 0).value).toBe(pageScoreOf(13, 0).value);
    expect(pageScoreOf(18, 0).applicable).not.toBe(
      pageScoreOf(13, 0).applicable,
    );
  });
});
