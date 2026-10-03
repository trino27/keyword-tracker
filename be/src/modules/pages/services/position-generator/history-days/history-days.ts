import {
  CAPTURE_HOUR_UTC,
  MIN_HISTORY_DAYS,
  MIN_SNAPSHOTS,
} from '../position-generator.constant';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Enough days that every pair's history together reaches the snapshot minimum. */
export function historyDays(pairCount: number): number {
  if (pairCount <= 0) return MIN_HISTORY_DAYS;
  return Math.max(MIN_HISTORY_DAYS, Math.ceil(MIN_SNAPSHOTS / pairCount));
}

/** The latest daily capture instant not in the future: today's 12:00 UTC or yesterday's. */
export function latestCapture(now: Date): Date {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    CAPTURE_HOUR_UTC,
  );
  return new Date(today <= now.getTime() ? today : today - DAY_MS);
}
