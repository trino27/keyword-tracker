import type { TIsoDay } from '../iso-day.type.js';

/** The calendar day it is at `now` for someone in `timeZone`. */
export function todayInZone(now: Date, timeZone: string): TIsoDay {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now) as TIsoDay;
}
