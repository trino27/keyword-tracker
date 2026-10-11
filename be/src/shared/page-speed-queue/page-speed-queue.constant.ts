import type { TPsiStrategy } from '@app/contracts';

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

/**
 * The devices the crawl and the seed queue. Mobile alone until Google is asked for
 * desktop: before then a queued desktop row would be measured as mobile and stored as
 * the desktop measurement, with wrong desktop findings (plan D45).
 */
export const PAGE_SPEED_QUEUED_STRATEGIES: readonly TPsiStrategy[] = ['mobile'];
