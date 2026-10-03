/** Runs executed at once per process. */
export const CRAWL_WORKER_SLOTS = 2;

/** An idle slot looks for work this often; a NOTIFY wakes it sooner. */
export const CRAWL_POLL_INTERVAL_MS = 2_000;

/** How long a claim is valid without a heartbeat; after it the run is reclaimable. */
export const CRAWL_LEASE_MS = 60_000;

/** The heartbeat renews the lease this often — well inside CRAWL_LEASE_MS. */
export const CRAWL_HEARTBEAT_MS = 10_000;
