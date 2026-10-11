/** Google PageSpeed Insights v5. The only Google endpoint this app calls. */
export const PSI_ENDPOINT =
  'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * One request runs a whole Lighthouse load in Google's data centre: 10–60 s is normal,
 * so the hop timeout is far above the crawler's 10 s.
 */
export const PAGE_SPEED_REQUEST_TIMEOUT_MS = 90_000;

/**
 * Bounds one whole answer — mobile asks for three categories, desktop for performance
 * alone — with room to spare. An answer past it fails the page PSI_REJECTED: it is no
 * answer this app can read.
 */
export const PAGE_SPEED_MAX_BYTES = 8 * 1024 * 1024;

/** Longer than the timeout plus one transaction, so a live attempt is never reclaimed. */
export const PAGE_SPEED_LEASE_MS = 180_000;

/** Two measurements in flight per process. */
export const PAGE_SPEED_WORKER_SLOTS = 2;

/** At least this long between two requests to Google, across both slots. */
export const PAGE_SPEED_MIN_INTERVAL_MS = 1_000;

/** How long an idle slot sleeps before looking again, unless a NOTIFY wakes it sooner. */
export const PAGE_SPEED_POLL_INTERVAL_MS = 5_000;

/** The n-th transient failure waits BASE × FACTOR^(n−1): 1, 4, 16, 64 minutes. */
export const PAGE_SPEED_BACKOFF_BASE_MS = 60_000;
export const PAGE_SPEED_BACKOFF_FACTOR = 4;

/** How long every slot pauses after a 429 that names no Retry-After. */
export const PAGE_SPEED_DEFAULT_PAUSE_MS = 60_000;

/** How often a slot sweeps rows whose lease expired on their last attempt. */
export const PAGE_SPEED_ABANDON_SWEEP_MS = 60_000;
