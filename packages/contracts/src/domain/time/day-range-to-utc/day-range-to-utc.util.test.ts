import { describe, expect, it } from 'vitest';
import { dayRangeToUtc } from './day-range-to-utc.util';

const TORONTO = 'America/Toronto';

describe('dayRangeToUtc', () => {
  it('the spring-forward day in Toronto is 23 hours', () => {
    expect(dayRangeToUtc('2026-03-08', '2026-03-08', TORONTO)).toEqual({
      fromUtc: '2026-03-08T05:00:00.000Z',
      toUtcExclusive: '2026-03-09T04:00:00.000Z',
    });
  });

  it('the fall-back day in Toronto is 25 hours', () => {
    expect(dayRangeToUtc('2026-11-01', '2026-11-01', TORONTO)).toEqual({
      fromUtc: '2026-11-01T04:00:00.000Z',
      toUtcExclusive: '2026-11-02T05:00:00.000Z',
    });
  });

  it('a summer range in Toronto uses EDT', () => {
    expect(dayRangeToUtc('2026-07-15', '2026-07-16', TORONTO)).toEqual({
      fromUtc: '2026-07-15T04:00:00.000Z',
      toUtcExclusive: '2026-07-17T04:00:00.000Z',
    });
  });

  it('Tokyo starts its day the evening before in UTC', () => {
    expect(dayRangeToUtc('2026-10-03', '2026-10-03', 'Asia/Tokyo')).toEqual({
      fromUtc: '2026-10-02T15:00:00.000Z',
      toUtcExclusive: '2026-10-03T15:00:00.000Z',
    });
  });

  it('UTC is the identity', () => {
    expect(dayRangeToUtc('2026-10-01', '2026-10-03', 'UTC')).toEqual({
      fromUtc: '2026-10-01T00:00:00.000Z',
      toUtcExclusive: '2026-10-04T00:00:00.000Z',
    });
  });

  it('a seeded noon-UTC point falls on the same date in Toronto, all year', () => {
    for (const day of [
      '2026-01-15',
      '2026-03-08',
      '2026-07-01',
      '2026-11-01',
    ] as const) {
      const { fromUtc, toUtcExclusive } = dayRangeToUtc(day, day, TORONTO);
      const noon = `${day}T12:00:00.000Z`;
      expect(noon >= fromUtc && noon < toUtcExclusive).toBe(true);
    }
  });
});
