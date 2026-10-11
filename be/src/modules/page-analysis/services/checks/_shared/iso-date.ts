/**
 * A calendar date, optionally a time of day, optionally a zone — the ISO 8601 forms a page
 * writes in datePublished: `2026-10-03`, `2026-10-03T10:00Z`, `2026-10-03T10:00:00,5+05`.
 */
const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|([+-])(\d{2})(?::?(\d{2}))?)?)?$/i;

export interface IIsoDate {
  /** The instant; a time with no zone is read as UTC. */
  epochMs: number;
  hasTime: boolean;
  hasZone: boolean;
}

const daysIn = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * The date a value names, or null when it is not an ISO 8601 date that exists — a month
 * 13, a February 30th, an hour 25. `Date.parse` is no judge of either: V8 rolls
 * 2026-02-30 over to March 2nd, and refuses the valid `,5` fraction and `+05` offset.
 */
export function readIsoDate(value: string): IIsoDate | null {
  const m = ISO_DATE.exec(value);
  if (!m) return null;
  const [year, month, day] = [m[1], m[2], m[3]].map(Number);
  const [hour, minute, second] = [m[4], m[5], m[6]].map((v) => Number(v ?? 0));
  const [offsetHours, offsetMinutes] = [m[10], m[11]].map((v) =>
    Number(v ?? 0),
  );
  if (month < 1 || month > 12 || day < 1 || day > daysIn(year, month))
    return null;
  if (hour > 23 || minute > 59 || second > 59) return null;
  if (offsetHours > 23 || offsetMinutes > 59) return null;
  const millis = Number((m[7] ?? '').padEnd(3, '0').slice(0, 3));
  const offsetMs =
    (m[9] === '-' ? -1 : 1) * (offsetHours * 60 + offsetMinutes) * 60_000;
  return {
    epochMs:
      Date.UTC(year, month - 1, day, hour, minute, second, millis) - offsetMs,
    hasTime: m[4] !== undefined,
    hasZone: m[8] !== undefined,
  };
}

/**
 * The instant a declared date names, NaN when it names none. An ISO-shaped value is read
 * by `readIsoDate` alone, so a date that does not exist is no instant; any other text a
 * page may write (`October 3, 2026`) is left to `Date.parse`.
 */
export function instantOf(value: string): number {
  if (/^\d{4}-\d{2}-\d{2}/.test(value))
    return readIsoDate(value)?.epochMs ?? NaN;
  return Date.parse(value);
}
