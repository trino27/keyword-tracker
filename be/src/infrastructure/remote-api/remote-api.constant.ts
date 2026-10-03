/** Identifies the crawler to the sites it reads; robots.txt rules are matched on the token. */
export const CRAWLER_USER_AGENT_TOKEN = 'SeoKeywordTrackerBot';
export const CRAWLER_USER_AGENT = `${CRAWLER_USER_AGENT_TOKEN}/1.0 (+https://github.com/trino27/keyword-tracker)`;

export const REMOTE_API_LIMITS = {
  /** Per hop, from sending the request to the last body byte. */
  timeoutMs: 10_000,
  maxRedirects: 5,
  /** Retries after the first attempt — three attempts in all. */
  maxRetries: 2,
  backoffBaseMs: 500,
  /** A Retry-After longer than this is not worth holding a crawl slot for. */
  retryAfterCapMs: 10_000,
} as const;

/** 408/429 and the gateway family say "try again"; every other status is an answer. */
export const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([
  408, 429, 500, 502, 503, 504,
]);

export const REMOTE_API_TIMING = Symbol('REMOTE_API_TIMING');
