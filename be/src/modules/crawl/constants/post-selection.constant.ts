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
