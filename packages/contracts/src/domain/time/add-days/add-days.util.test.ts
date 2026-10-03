import { describe, expect, it } from 'vitest';
import { addDays, daysBetweenInclusive } from './add-days.util';

describe('addDays', () => {
  it.each([
    ['2026-03-08', 1, '2026-03-09'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2024-03-01', -1, '2024-02-29'],
    ['2026-10-03', -29, '2026-09-04'],
  ] as const)('%s %+d → %s', (day, days, expected) => {
    expect(addDays(day, days)).toBe(expected);
  });
});

describe('daysBetweenInclusive', () => {
  it('counts both ends', () => {
    expect(daysBetweenInclusive('2026-10-03', '2026-10-03')).toBe(1);
    expect(daysBetweenInclusive('2025-10-03', '2026-10-03')).toBe(366);
  });
});
