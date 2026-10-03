/** A crawl run's lifecycle. `partial` = fewer than CRAWL_POST_LIMIT posts but at least one. */
export const CRAWL_RUN_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'partial',
  'failed',
] as const;

export type TCrawlRunStatus = (typeof CRAWL_RUN_STATUSES)[number];

/** At most one run per client may be in these states (a partial unique index). */
export const ACTIVE_CRAWL_RUN_STATUSES = ['queued', 'running'] as const;

/** Runs whose pages the user sees — the latest of them is the client's "current" run. */
export const CURRENT_CRAWL_RUN_STATUSES = ['succeeded', 'partial'] as const;
