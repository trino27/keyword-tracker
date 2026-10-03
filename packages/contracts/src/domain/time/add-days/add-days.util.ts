import type { TIsoDay } from '../iso-day.type.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar arithmetic on a day, with no zone involved: `2026-03-08` + 1 = `2026-03-09`. */
export function addDays(day: TIsoDay, days: number): TIsoDay {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date) + days * DAY_MS)
    .toISOString()
    .slice(0, 10) as TIsoDay;
}

/** Days from `from` to `to`, both included: the same day is 1. */
export function daysBetweenInclusive(from: TIsoDay, to: TIsoDay): number {
  const epoch = (day: TIsoDay) => {
    const [year, month, date] = day.split('-').map(Number);
    return Date.UTC(year, month - 1, date);
  };
  return Math.round((epoch(to) - epoch(from)) / DAY_MS) + 1;
}
