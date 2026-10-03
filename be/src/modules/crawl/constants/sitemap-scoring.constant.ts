/**
 * Every tunable of blog sitemap discovery. The weights were set against two real
 * WordPress-style sites and five synthetic edge cases (be/test/fixtures); changing one
 * changes which sitemap a client's crawl reads, so the scoring spec pins them all.
 */

/** Tried in order when robots.txt names no sitemap. */
export const WELL_KNOWN_SITEMAP_PATHS = [
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/wp-sitemap.xml',
  '/sitemap-index.xml',
  '/sitemap/',
] as const;

/** Tried in order after the home page's `<link rel="alternate">` feeds. */
export const WELL_KNOWN_FEED_PATHS = [
  '/feed/',
  '/blog/feed/',
  '/rss.xml',
] as const;

export const SITEMAP_MAX_DEPTH = 3;
export const SITEMAP_MAX_FETCHES = 50;

/** Name tokens that say "blog"; the best one counts. */
export const POSITIVE_NAME_TOKENS: Readonly<Record<string, number>> = {
  blog: 3,
  post: 2,
  posts: 2,
  article: 2,
  articles: 2,
  news: 1,
};

/** Name tokens that say "not a blog"; any of them costs this once. */
export const NEGATIVE_NAME_TOKENS: ReadonlySet<string> = new Set([
  'page',
  'pages',
  'product',
  'products',
  'category',
  'categories',
  'tag',
  'tags',
  'author',
  'authors',
  'video',
  'videos',
  'image',
  'images',
  'attachment',
  'media',
  'portfolio',
  'event',
  'events',
  'job',
  'jobs',
  'location',
  'locations',
  'shop',
  'store',
]);
export const NEGATIVE_NAME_SCORE = -3;

/** First path segments that mark a blog section of a site. */
export const BLOG_PATH_SECTIONS: ReadonlySet<string> = new Set([
  'blog',
  'news',
  'articles',
]);
export const PATH_SHARE_WEIGHT = 3;
export const FEED_SHARE_WEIGHT = 4;

/** Below this, no candidate looks like a blog and the run fails BLOG_SITEMAP_NOT_FOUND. */
export const BLOG_SITEMAP_MIN_SCORE = 2;
