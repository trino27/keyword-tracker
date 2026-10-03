/** Posts fetched at once; results are still applied in sitemap order. */
export const CRAWL_FETCH_CONCURRENCY = 3;

/** Extensions that are never an HTML post — skipped without a request. */
export const NON_HTML_EXTENSIONS: ReadonlySet<string> = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'avif',
  'ico',
  'zip',
  'gz',
  'xml',
  'rss',
  'json',
  'csv',
  'txt',
  'mp4',
  'mp3',
  'mov',
  'avi',
  'webm',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
]);

/**
 * Main-content words a page needs before it is worth tracking.
 *
 * An index, an author card or a tag page has a title and a list of links, and the
 * keyword extraction has nothing to read but the site's own furniture — blog.google's
 * author pages returned the names of its navigation sections, and a different set on
 * each crawl, so a page's tracked keywords changed under its recorded history.
 * Measured over the pages this repository has seen: real posts run 256 words and up
 * (the shortest a club blog post), author and index pages 30 to 87. Well below the
 * catalogue's 300-word THIN_CONTENT warning, which judges a post that IS one.
 */
export const MIN_POST_WORD_COUNT = 120;

/** A page whose JSON-LD declares one of these is a listing, not a post. */
export const LISTING_SCHEMA_TYPES: ReadonlySet<string> = new Set([
  'CollectionPage',
  'ItemList',
]);

export const HTML_CONTENT_TYPES: ReadonlySet<string> = new Set([
  'text/html',
  'application/xhtml+xml',
]);

/** The width of a stored page URL; a longer sitemap entry cannot become a page. */
export const MAX_PAGE_URL_LENGTH = 2048;

/** JSON-LD types that make a page an article when the source does not say so. */
/** A same-site entry whose page now lives on another site — a moved post or blog. */
export const REDIRECTED_OFF_SITE_REASON = 'Redirects to another site';

/** A page answered with a Cloudflare challenge (`cf-mitigated: challenge`) — a bot wall. */
export const BOT_CHALLENGE_REASON = 'Bot challenge (Cloudflare)';

export const ARTICLE_SCHEMA_TYPES: ReadonlySet<string> = new Set([
  'Article',
  'BlogPosting',
  'NewsArticle',
  'TechArticle',
  'Report',
  'ScholarlyArticle',
  'AnalysisNewsArticle',
  'OpinionNewsArticle',
  'ReportageNewsArticle',
  'LiveBlogPosting',
]);
