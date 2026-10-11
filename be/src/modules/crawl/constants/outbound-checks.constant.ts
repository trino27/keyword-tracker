/**
 * The outbound stage's budget (plan D6, D11): the requests a crawl makes beyond its own
 * posts, to check the links they carry and read the documents their canonicals and
 * hreflang name. Every number is a tunable; each says why it is what it is.
 */
export const OUTBOUND_CHECK_LIMITS = {
  /** Unique link URLs asked for their status in one crawl; the rest are "unchecked". */
  maxLinkUrls: 300,
  /** Documents read whole — canonical targets first, then hreflang alternates. */
  maxDocuments: 30,
  /** Requests in flight at once, the transport's own connection count. */
  concurrency: 8,
  /** Requests in flight to one host: a link check is not a crawl of someone's site. */
  perHost: 2,
  /** Per request. A link that takes longer reads as unknown, never as broken. */
  timeoutMs: 5_000,
  /** The whole stage. What is not done by then is "unchecked: deadline". */
  deadlineMs: 60_000,
} as const;
