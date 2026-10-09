/** Google's Search Status Dashboard, where ranking updates are announced. */
export const SEARCH_STATUS_ORIGIN = 'https://status.search.google.com';

/** Its machine-readable list of incidents, ranking updates among them. */
export const SEARCH_STATUS_FEED = `${SEARCH_STATUS_ORIGIN}/incidents.json`;

export const SEARCH_UPDATES_LIMITS = {
  /** The feed is a few kilobytes; anything near this is not the feed. */
  feedBytes: 2 * 1024 * 1024,
  /** Updates are announced a few times a year; the dashboard need not be asked more. */
  freshForMs: 6 * 60 * 60 * 1000,
  /** After a failure, wait this long before asking again, rather than on every view. */
  retryAfterFailureMs: 5 * 60 * 1000,
} as const;
