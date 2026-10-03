import { historyDays, latestCapture } from './history-days';

describe('historyDays', () => {
  it.each([
    [180, 365],
    [100, 500],
    [1, 50_000],
    [0, 365],
  ])('%d pairs → %d days', (pairs, days) => {
    expect(historyDays(pairs)).toBe(days);
  });
});

describe('latestCapture', () => {
  it.each([
    ['2026-10-03T11:59:00Z', '2026-10-02T12:00:00.000Z'],
    ['2026-10-03T12:00:00Z', '2026-10-03T12:00:00.000Z'],
    ['2026-10-03T23:30:00Z', '2026-10-03T12:00:00.000Z'],
    ['2026-01-01T00:00:00Z', '2025-12-31T12:00:00.000Z'],
  ])('at %s → %s', (now, expected) => {
    expect(latestCapture(new Date(now)).toISOString()).toBe(expected);
  });
});
