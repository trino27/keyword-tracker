import {
  addDays,
  DEFAULT_HISTORY_DAYS,
  daysBetweenInclusive,
  MAX_HISTORY_DAYS,
  todayInZone,
  type TIsoDay,
} from '@app/contracts';
import { InvalidDateRangeException } from '../../exceptions/pages.exceptions';

/**
 * The history range in the user's calendar (§10.6): no `to` is today, no `from` is
 * 30 days back from `to`, a `to` in the future is today. A range that ends before it
 * starts, starts in the future, or spans more than MAX_HISTORY_DAYS is refused.
 */
export function resolveHistoryRange(
  requested: { from?: TIsoDay; to?: TIsoDay },
  timeZone: string,
  now: Date,
): { from: TIsoDay; to: TIsoDay } {
  const today = todayInZone(now, timeZone);
  const to =
    requested.to === undefined || requested.to > today ? today : requested.to;
  const from = requested.from ?? addDays(to, -(DEFAULT_HISTORY_DAYS - 1));
  if (from > to || daysBetweenInclusive(from, to) > MAX_HISTORY_DAYS) {
    throw new InvalidDateRangeException({ from, to });
  }
  return { from, to };
}
