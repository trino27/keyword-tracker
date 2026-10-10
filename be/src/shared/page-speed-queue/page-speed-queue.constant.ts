/**
 * The Postgres NOTIFY channel a queued PageSpeed measurement is announced on. Delivered
 * when the enqueuing transaction commits, so a woken slot always finds its row.
 */
export const PAGE_SPEED_QUEUED_CHANNEL = 'page_speed_queued';

/**
 * A measurement younger than this is not re-queued by a crawl. Chrome's field data is a
 * 28-day window refreshed about daily, so measuring more often buys nothing (plan D5).
 */
export const PAGE_SPEED_FRESH_FOR_MS = 24 * 60 * 60 * 1000;

/** A row is given up on after this many attempts; the table's CHECK holds the same 5. */
export const PAGE_SPEED_MAX_ATTEMPTS = 5;
