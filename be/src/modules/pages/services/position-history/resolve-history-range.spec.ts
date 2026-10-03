import { InvalidDateRangeException } from '../../exceptions/pages.exceptions';
import { resolveHistoryRange } from './resolve-history-range';

const TORONTO = 'America/Toronto';
// 03:30 UTC on Nov 2 is still Nov 1 in Toronto.
const NOW = new Date('2026-11-02T03:30:00Z');

describe('resolveHistoryRange', () => {
  it('defaults to the 30 days ending today in the user’s zone', () => {
    expect(resolveHistoryRange({}, TORONTO, NOW)).toEqual({
      from: '2026-10-03',
      to: '2026-11-01',
    });
  });

  it('defaults `from` to 30 days before a given `to`', () => {
    expect(resolveHistoryRange({ to: '2026-06-30' }, TORONTO, NOW)).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    });
  });

  it('clamps a future `to` to today', () => {
    expect(
      resolveHistoryRange(
        { from: '2026-10-25', to: '2026-12-31' },
        TORONTO,
        NOW,
      ),
    ).toEqual({ from: '2026-10-25', to: '2026-11-01' });
  });

  it.each([
    [{ from: '2026-10-10', to: '2026-10-01' }],
    [{ from: '2026-11-05' }],
    [{ from: '2025-10-31', to: '2026-11-01' }],
  ] as const)('refuses %j with INVALID_DATE_RANGE', (requested) => {
    expect(() => resolveHistoryRange(requested, TORONTO, NOW)).toThrow(
      InvalidDateRangeException,
    );
  });

  it('accepts exactly 366 days', () => {
    expect(
      resolveHistoryRange(
        { from: '2025-11-01', to: '2026-11-01' },
        TORONTO,
        NOW,
      ),
    ).toEqual({ from: '2025-11-01', to: '2026-11-01' });
  });
});
