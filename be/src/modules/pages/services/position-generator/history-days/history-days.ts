import {
  CAPTURE_HOUR_UTC,
  MIN_HISTORY_DAYS,
  MIN_SNAPSHOTS,
} from '../position-generator.constant';

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The SEED's span: enough days that every pair in the WHOLE database together reaches
 * the brief's snapshot minimum. It is a property of the database, not of one account —
 * a user's own fill spans `MAX_HISTORY_DAYS`, the most the UI can ask to see.
 */
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
