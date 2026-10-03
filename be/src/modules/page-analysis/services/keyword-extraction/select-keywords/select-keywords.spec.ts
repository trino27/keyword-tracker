import { selectKeywords, subsume } from './select-keywords';

const scored = (pairs: [string, number][]) =>
  pairs.map(([term, score]) => ({ term, score }));

describe('subsume', () => {
  it('drops a word when a phrase containing it scores at least 0.8 of it', () => {
    expect(
      subsume(
        scored([
          ['seo', 10],
          ['seo audit', 8],
          ['audit', 20],
        ]),
      ).map((c) => c.term),
    ).toEqual(['seo audit', 'audit']);
  });

  it('keeps the word when the phrase is much weaker, and matches whole words only', () => {
    expect(
      subsume(
        scored([
          ['seo', 10],
          ['seo audit', 7],
          ['seasonal', 5],
          ['season', 5],
        ]),
      ).map((c) => c.term),
    ).toEqual(['seo', 'seo audit', 'seasonal', 'season']);
  });
});

describe('selectKeywords', () => {
  it('keeps at most 8 above the floor, the top at relevance 1', () => {
    const selected = selectKeywords(
      scored(Array.from({ length: 12 }, (_, i) => [`k${i}`, 100 - i])),
    );

    expect(selected).toHaveLength(8);
    expect(selected[0]).toEqual({ term: 'k0', relevance: 1 });
  });

  it('fills up to 5 from below the floor when too few clear it', () => {
    const selected = selectKeywords(
      scored([
        ['a', 100],
        ['b', 30],
        ['c', 10],
        ['d', 5],
        ['e', 1],
        ['f', 0.5],
        ['zero', 0],
      ]),
    );

    expect(selected.map((k) => k.term)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(selected[4].relevance).toBeCloseTo(0.01);
  });

  it('never selects a zero score, and handles nothing at all', () => {
    expect(
      selectKeywords(
        scored([
          ['only', 2],
          ['none', 0],
        ]),
      ),
    ).toEqual([{ term: 'only', relevance: 1 }]);
    expect(selectKeywords([])).toEqual([]);
  });
});
