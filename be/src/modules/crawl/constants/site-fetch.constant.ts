/** Per-kind body caps. A page bigger than these is not one this crawler should read. */
export const SITE_FETCH_LIMITS = {
  /** Google's robots.txt limit: 500 KiB, after which it ignores the rest. */
  robotsBytes: 500 * 1024,
  htmlBytes: 5 * 1024 * 1024,
  /** A probe needs the status, not the page. */
  probeBytes: 64 * 1024,
  feedBytes: 5 * 1024 * 1024,
  /** As downloaded; a `.gz` sitemap is then inflated up to `sitemapBytes`. */
  sitemapDownloadBytes: 10 * 1024 * 1024,
  /** The sitemaps protocol's own limit for one file. */
  sitemapBytes: 50 * 1024 * 1024,
} as const;
