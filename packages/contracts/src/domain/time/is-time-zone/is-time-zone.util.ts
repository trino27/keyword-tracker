/**
 * True when `Intl` knows the IANA zone name.
 *
 * The zone is stored per user (users.time_zone) and every calendar conversion is done
 * in it, so a name Intl cannot resolve must be refused when it is written — later it
 * would surface as a RangeError deep inside a date formatter.
 */
export function isTimeZone(value: string): boolean {
  if (value.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
