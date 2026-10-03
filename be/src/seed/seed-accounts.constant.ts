/**
 * The two demo accounts the brief asks for. Data, not logic: the crawler never sees a
 * site name — it discovers both blogs the way it discovers any site.
 */
export const SEED_TIME_ZONE = 'America/Toronto';

export const SEED_ACCOUNTS = [
  {
    email: 'semrush.manager@example.com',
    client: { name: 'Semrush', websiteUrl: 'https://www.semrush.com' },
  },
  {
    email: 'yoast.manager@example.com',
    client: { name: 'Yoast', websiteUrl: 'https://yoast.com' },
  },
] as const;

/** How often the seed looks at a crawl it is waiting for, and for how long at most. */
export const SEED_POLL_MS = 2_000;
export const SEED_CRAWL_TIMEOUT_MS = 10 * 60 * 1_000;
