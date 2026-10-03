import type { TKeywordField } from '../../../constants/keyword-scoring.constant';
import { idfFactor, pageScore } from './score-candidates';

const stats = (
  fields: TKeywordField[],
  overrides: { tokens?: number; bodyTf?: number; declared?: boolean } = {},
) => ({
  tokens: overrides.tokens ?? 1,
  fields: new Set(fields),
  bodyTf: overrides.bodyTf ?? 0,
  declared: overrides.declared ?? false,
});

describe('pageScore', () => {
  it('sums presence weights with the multi-field bonus', () => {
    // (5 + 4) × (1 + 0.25 × 1)
    expect(pageScore(stats(['title', 'h1']))).toBeCloseTo(11.25);
  });

  it('scores the body by log frequency, without a strong-field bonus', () => {
    expect(pageScore(stats(['body'], { bodyTf: 3 }))).toBeCloseTo(Math.log(4));
  });

  it('applies the declared-keyword bonus and the n-gram preference', () => {
    expect(pageScore(stats(['meta'], { declared: true }))).toBeCloseTo(
      2 * 1.15,
    );
    expect(pageScore(stats(['meta'], { tokens: 2 }))).toBeCloseTo(2 * 1.15);
    expect(pageScore(stats(['meta'], { tokens: 3 }))).toBeCloseTo(2 * 1.1);
  });

  it('ranks a title-and-slug phrase above a body-only word used often', () => {
    expect(pageScore(stats(['title', 'slug'], { tokens: 2 }))).toBeGreaterThan(
      pageScore(stats(['body'], { bodyTf: 40 })),
    );
  });
});

describe('idfFactor', () => {
  it('is 1 for a single page', () => {
    expect(idfFactor(1, 1)).toBe(1);
  });

  it('is below 0.3 for a term on every page of 15, and 1 for a term on one of them', () => {
    expect(idfFactor(15, 15)).toBeLessThan(0.3);
    expect(idfFactor(15, 1)).toBe(1);
  });
});
