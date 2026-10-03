import { addDays } from '../add-days/add-days.util.js';
import type { TIsoDay } from '../iso-day.type.js';

export interface IUtcRange {
  fromUtc: string;
  /** Exclusive: the first instant of the day after `to`. */
  toUtcExclusive: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** How far the zone's wall clock is ahead of UTC at this instant, in ms. */
function offsetAt(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(new Date(instant))
      .map(({ type, value }) => [type, Number(value)]),
  );
  const wallClock = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return wallClock - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant a day starts in a zone. Two passes: the first guesses with the offset at
 * the wrong instant, the second corrects it — enough across a DST change, since no
 * zone in use changes its offset twice within hours.
 */
export function startOfDayInZone(day: TIsoDay, timeZone: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  const wallMidnight = Date.UTC(year, month - 1, date);
  const guess = wallMidnight - offsetAt(wallMidnight, timeZone);
  return new Date(wallMidnight - offsetAt(guess, timeZone));
}

/**
 * A user's calendar range as UTC bounds: `[from 00:00, to + 1 day 00:00)` in their
 * zone. The only place the backend turns a date into instants — a day across a DST
 * change is 23 or 25 hours long, and this is where that is right.
 */
export function dayRangeToUtc(
  from: TIsoDay,
  to: TIsoDay,
  timeZone: string,
): IUtcRange {
  return {
    fromUtc: startOfDayInZone(from, timeZone).toISOString(),
    toUtcExclusive: startOfDayInZone(addDays(to, 1), timeZone).toISOString(),
  };
}
