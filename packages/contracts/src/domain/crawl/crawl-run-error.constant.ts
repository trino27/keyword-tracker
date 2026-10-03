/**
 * Why a run failed. These are data on the run, shown verbatim in the crawl banner and
 * the run log — not HTTP answers.
 */
export const CRAWL_RUN_ERRORS = {
  SITEMAP_NOT_FOUND: {
    message:
      'No sitemap found — checked robots.txt and the usual sitemap addresses.',
  },
  BLOG_SITEMAP_NOT_FOUND: {
    message:
      "Sitemaps were found, but none of them looks like the site's blog.",
  },
  SITE_UNREACHABLE: {
    message: 'The website could not be reached.',
  },
  SITE_BLOCKED: {
    message:
      'The website refuses automated requests (it answered 403 or not at all), so it cannot be crawled.',
  },
  NO_POSTS_CRAWLED: {
    message:
      'The blog sitemap was found, but none of its posts could be crawled.',
  },
  CRAWL_ABANDONED: {
    message: 'The crawl was interrupted three times and has been given up.',
  },
  CRAWL_INTERNAL_ERROR: {
    message: 'The crawl failed unexpectedly.',
  },
} as const;

export type TCrawlRunErrorCode = keyof typeof CRAWL_RUN_ERRORS;
