/**
 * The one rate limit: 10 requests a minute. Each throttler guard applies it with its
 * own key — login per IP + email (so one attacker cannot lock a user out from every
 * network), adding a client and re-crawling per user — and per route.
 */
export const PER_MINUTE_THROTTLE = {
  name: 'per-minute',
  ttl: 60_000,
  limit: 10,
} as const;
