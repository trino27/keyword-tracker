import { describe, expect, it } from 'vitest';
import { isIsoDay } from './is-iso-day.util';

describe('isIsoDay', () => {
  it.each(['2026-10-03', '2024-02-29', '2026-12-31'])('accepts %s', (day) => {
    expect(isIsoDay(day)).toBe(true);
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-1-3',
    '2026-10-03T00:00',
    '',
  ])('refuses %j', (value) => {
    expect(isIsoDay(value)).toBe(false);
  });
});
