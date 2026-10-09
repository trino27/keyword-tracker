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

/**
 * Statuses that mean "not you": authentication, a ban, a rate limit — and 402, which
 * Cloudflare's pay-per-crawl answers to crawlers the site charges (allrecipes.com,
 * 2026-10, on every post).
 */
export const REFUSAL_STATUSES: ReadonlySet<number> = new Set([
  401, 402, 403, 429,
]);

/**
 * Whether the answer is a bot wall rather than the page, whatever its status: a
 * Cloudflare challenge (`cf-mitigated: challenge`, often a 503) or an AWS WAF one
 * (`x-amzn-waf-action: challenge` or `captcha`, a 202 with an empty body — what
 * blog.jetbrains.com answered every post with, 2026-10, read until then as a page
 * rendered by JavaScript).
 */
export function isBotChallenge(headers: Record<string, string>): boolean {
  return (
    headers['cf-mitigated']?.toLowerCase() === 'challenge' ||
    ['challenge', 'captcha'].includes(
      headers['x-amzn-waf-action']?.toLowerCase() ?? '',
    )
  );
}
