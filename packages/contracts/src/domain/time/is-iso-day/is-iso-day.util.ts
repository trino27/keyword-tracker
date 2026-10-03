import type { TIsoDay } from '../iso-day.type.js';

const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` naming a day that exists — `2026-02-30` does not. */
export function isIsoDay(value: string): value is TIsoDay {
  const match = SHAPE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
