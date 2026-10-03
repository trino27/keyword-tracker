import type { IKeywordPosition } from '@app/contracts';
import { pickBestPosition } from './pick-best-position';

const AT = '2026-10-03T12:00:00.000Z';
const keyword = (
  term: string,
  latestPosition: number | null,
  relevance = 0.5,
): IKeywordPosition => ({
  keywordId: term.length,
  term,
  relevance,
  latestPosition,
  latestCapturedAt: latestPosition === null ? null : AT,
});

describe('pickBestPosition', () => {
  it('picks the lowest position', () => {
    expect(
      pickBestPosition([
        keyword('alpha', 12),
        keyword('beta', 4),
        keyword('gamma', 30),
      ]),
    ).toEqual({ position: 4, keywordId: 4, term: 'beta', capturedAt: AT });
  });

  it('breaks a tie by relevance, then by term', () => {
    expect(
      pickBestPosition([keyword('weak', 5, 0.3), keyword('strong', 5, 0.9)])
        ?.term,
    ).toBe('strong');
    expect(
      pickBestPosition([keyword('zeta', 5, 0.5), keyword('beta', 5, 0.5)])
        ?.term,
    ).toBe('beta');
  });

  it('ignores keywords without a position, and is null when none has one', () => {
    expect(
      pickBestPosition([keyword('new', null), keyword('old', 40)])?.term,
    ).toBe('old');
    expect(pickBestPosition([keyword('new', null)])).toBeNull();
    expect(pickBestPosition([])).toBeNull();
  });
});
