/** What happened to one sitemap entry a run considered. Every considered entry is logged. */
export const CRAWL_ITEM_STATUSES = [
  'crawled',
  'skipped_listing',
  'skipped_robots',
  'skipped_not_html',
  'skipped_other_site',
  'failed',
] as const;

export type TCrawlItemStatus = (typeof CRAWL_ITEM_STATUSES)[number];
