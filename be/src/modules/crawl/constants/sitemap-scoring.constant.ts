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
  '/rss/',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/blog/rss.xml',
  '/feed.json',
  // Shopify's default blog.
  '/blogs/news.atom',
] as const;

/**
 * A host whose first label says "blog" (blog.google, blog.canada.ca) is a blog as a
 * whole: every sitemap of it gets at least this name score.
 */
export const BLOG_HOST_LABELS: ReadonlySet<string> = new Set([
  'blog',
  'blogs',
  'news',
  'journal',
  'magazine',
]);
export const BLOG_HOST_NAME_SCORE = 3;

/** A Google News sitemap (`<news:news>` entries) lists articles by definition. */
export const NEWS_SITEMAP_SCORE = 2;

/**
 * When no sitemap scores as a blog, these index pages are read instead, in order; their
 * links one level below become the candidates, and only pages marked as articles count.
 */
export const WELL_KNOWN_LISTING_PATHS = [
  '/blog/',
  '/news/',
  '/articles/',
  '/insights/',
  '/stories/',
  // Shopify's default blog; its posts are /blogs/news/<handle>.
  '/blogs/news/',
] as const;

/** Links under a listing that lead to more listings, not to posts. */
export const LISTING_LINK_EXCLUDED_SEGMENTS: ReadonlySet<string> = new Set([
  'page',
  'tag',
  'tags',
  'category',
  'categories',
  'author',
  'authors',
  'topic',
  'topics',
  'feed',
  'rss',
  'search',
  // Shopify: /blogs/news/tagged/<tag>.
  'tagged',
]);

export const SITEMAP_MAX_DEPTH = 3;
export const SITEMAP_MAX_FETCHES = 50;

/** Name tokens that say "blog"; the best one counts. */
export const POSITIVE_NAME_TOKENS: Readonly<Record<string, number>> = {
  blog: 3,
  // Shopify: sitemap_blogs_1.xml.
  blogs: 3,
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
  'blogs',
  'news',
  'articles',
]);
export const PATH_SHARE_WEIGHT = 3;
export const FEED_SHARE_WEIGHT = 4;

/** Below this, no candidate looks like a blog and the run fails BLOG_SITEMAP_NOT_FOUND. */
export const BLOG_SITEMAP_MIN_SCORE = 2;
