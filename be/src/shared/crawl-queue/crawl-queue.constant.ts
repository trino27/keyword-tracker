/**
 * The Postgres NOTIFY channel a queued crawl run is announced on. NOTIFY is delivered
 * only when the enqueuing transaction commits, so a wake-up never precedes its row.
 */
export const CRAWL_QUEUED_CHANNEL = 'crawl_run_queued';
