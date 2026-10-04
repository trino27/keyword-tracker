import { MAX_KEYWORDS } from '../../../constants/keyword-scoring.constant';
import { selectKeywords, subsume } from './select-keywords';

const scored = (pairs: [string, number][]) =>
  pairs.map(([term, score]) => ({ term, score }));

describe('subsume', () => {
  it('drops a word when a phrase containing it scores at least half of it', () => {
    expect(
      subsume(
        scored([
          ['seo', 10],
          ['seo audit', 5],
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
          ['seo audit', 4],
          ['seasonal', 5],
          ['season', 5],
        ]),
      ).map((c) => c.term),
    ).toEqual(['seo', 'seo audit', 'seasonal', 'season']);
  });
});

describe('selectKeywords', () => {
  it('keeps at most MAX_KEYWORDS above the floor, the top at relevance 1', () => {
    const selected = selectKeywords(
      scored(Array.from({ length: 12 }, (_, i) => [`k${i}`, 100 - i])),
      10_000,
    );

    expect(selected).toHaveLength(MAX_KEYWORDS);
    expect(selected[0]).toEqual({ term: 'k0', relevance: 1 });
  });

  it('spends a budget the page earned in words, not a flat ceiling', () => {
    const candidates = scored(
      Array.from({ length: 12 }, (_, i) => [`k${i}`, 100 - i]),
    );

    // A 267-word post about one thing cannot honestly name eight.
    expect(selectKeywords(candidates, 267)).toHaveLength(2);
    expect(selectKeywords(candidates, 850)).toHaveLength(4);
    expect(selectKeywords(candidates, 10_000)).toHaveLength(MAX_KEYWORDS);
  });

  it('never lets a whole sentence swallow the word that is the subject', () => {
    // `yoastcon` names the event; `reasons to come to yoastcon` is the headline
    // around it, and subsumption used to hand it the page.
    const selected = selectKeywords(
      subsume(
        scored([
          ['yoastcon', 100],
          ['reasons to come to yoastcon', 95],
        ]),
      ),
      10_000,
    );

    expect(selected.map((k) => k.term)).toEqual(['yoastcon']);
  });

  it('still lets a phrase one word longer replace the one it completes', () => {
    const selected = selectKeywords(
      subsume(
        scored([
          ['email performance in google', 100],
          ['email performance in google analytics', 81],
        ]),
      ),
      10_000,
    );

    expect(selected.map((k) => k.term)).toEqual([
      'email performance in google analytics',
    ]);
  });

  it('adds nothing from below the floor, however few clear it', () => {
    const selected = selectKeywords(
      scored([
        ['a', 100],
        ['b', 30],
        ['c', 10],
        ['d', 5],
        ['e', 1],
      ]),
    );

    expect(selected.map((k) => k.term)).toEqual(['a', 'b']);
  });

  it('drops a candidate that covers the words of one already chosen', () => {
    const selected = selectKeywords(
      scored([
        ['южна африка', 100],
        ['африка без виза', 90],
        ['пътуват до южна', 85],
        ['българският паспорт', 60],
      ]),
    );

    expect(selected.map((k) => k.term)).toEqual([
      'южна африка',
      'българският паспорт',
    ]);
  });

  it('keeps two phrases that share one word out of three', () => {
    const selected = selectKeywords(
      scored([
        ['flights to rome', 100],
        ['hotels in rome', 95],
      ]),
    );

    // A third of each is shared, under the limit: two different queries, both kept.
    expect(selected.map((k) => k.term)).toEqual([
      'flights to rome',
      'hotels in rome',
    ]);
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
