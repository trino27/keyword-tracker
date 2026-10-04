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
  runs: new Set([1]),
});

describe('pageScore', () => {
  it('sums presence weights with the multi-field bonus', () => {
    // (5 + 4) × (1 + 0.25 × 1) × 0.6, the single-word factor
    expect(pageScore(stats(['title', 'h1']))).toBeCloseTo(6.75);
  });

  it('scores the body by log frequency, without a strong-field bonus', () => {
    expect(pageScore(stats(['body'], { bodyTf: 3 }))).toBeCloseTo(
      2.5 * Math.log(4) * 0.6,
    );
  });

  it('applies the declared-keyword bonus and the n-gram preference', () => {
    const base = (4 + 2.5 * Math.log(2)) * 1.15;
    expect(
      pageScore(stats(['h1', 'body'], { bodyTf: 1, declared: true })),
    ).toBeCloseTo(base * 0.6);
    expect(
      pageScore(stats(['h1', 'body'], { bodyTf: 1, tokens: 2 })),
    ).toBeCloseTo(base);
    expect(
      pageScore(stats(['h1', 'body'], { bodyTf: 1, tokens: 4 })),
    ).toBeCloseTo(4 + 2.5 * Math.log(2));
    // A five-word candidate exists so a title is not stored one word short, not
    // because a page is about a sentence; it is damped below every shorter phrase.
    expect(
      pageScore(stats(['h1', 'body'], { bodyTf: 1, tokens: 5 })),
    ).toBeCloseTo((4 + 2.5 * Math.log(2)) * 0.85);
  });

  it('is zero for a term no anchor names and the body says once', () => {
    expect(
      pageScore(
        stats(['meta', 'firstParagraph', 'body'], { tokens: 3, bodyTf: 1 }),
      ),
    ).toBe(0);
    // A subheading is not an anchor: the h2s of a how-to listicle are its
    // instructions, and each is said once.
    expect(pageScore(stats(['subheading', 'body'], { tokens: 3 }))).toBe(0);
    // A title, an h1 or the slug anchors it; so does a second occurrence.
    expect(
      pageScore(stats(['h1', 'body'], { tokens: 3, bodyTf: 1 })),
    ).toBeGreaterThan(0);
    expect(
      pageScore(stats(['subheading', 'body'], { tokens: 3, bodyTf: 2 })),
    ).toBeGreaterThan(0);
  });

  it('lets a word the body repeats outweigh one named once in a heading', () => {
    expect(pageScore(stats(['body'], { bodyTf: 40 }))).toBeGreaterThan(
      pageScore(stats(['subheading', 'body'], { bodyTf: 1 })),
    );
  });

  it('still ranks a title-and-slug phrase above a body-only word', () => {
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

describe('idfFactor, for a term the page itself names', () => {
  it('halves the corpus penalty on a term few other pages carry', () => {
    const shared = idfFactor(22, 3);
    expect(idfFactor(22, 3, true)).toBeCloseTo(1 - 0.5 * (1 - shared));
    // Yoast has three posts about Facebook traffic, and the penalty for that was
    // enough to file "Facebook traffic: What's the current status?" under
    // `current status`.
    expect(idfFactor(22, 3, true)).toBeGreaterThan(shared);
  });

  it('gives no relief to a term that is the whole site’s vocabulary', () => {
    // Half of Yoast's titles say "Google Analytics"; a title saying it again is
    // telling us where on the site the page lives.
    expect(idfFactor(22, 12, true)).toBe(idfFactor(22, 12));
  });
});
