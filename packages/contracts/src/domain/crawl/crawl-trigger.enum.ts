/** Who asked for a run: the seed script or a user (add client, re-crawl). */
export const CRAWL_TRIGGERS = ['seed', 'user'] as const;

export type TCrawlTrigger = (typeof CRAWL_TRIGGERS)[number];
