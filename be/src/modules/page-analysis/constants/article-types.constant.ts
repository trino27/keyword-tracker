/**
 * The JSON-LD types that make a document an article in Google's eyes — its documented
 * `Article` type and the subtypes a blog realistically emits.
 *
 * Shared because two things now ask the same question of one page: the check that reports
 * a post with no article markup, and the extractor, which can only collect an article
 * node's PROPERTIES once it knows which node is the article. Held apart from
 * `ARTICLE_SCHEMA_TYPES` in the crawl module on purpose: that set answers "is this URL
 * worth crawling as a post", a looser question that may admit types this one should not.
 */
export const ARTICLE_TYPES: ReadonlySet<string> = new Set([
  'Article',
  'NewsArticle',
  'BlogPosting',
  'TechArticle',
  'ScholarlyArticle',
  'Report',
  'LiveBlogPosting',
]);

/**
 * What Google's Article documentation lists as recommended. It states no REQUIRED
 * property at all — "include what applies" — so every one of these is eligibility for a
 * part of the rich result, never a rule the page is breaking.
 *
 * `dateModified` is here beside `datePublished` deliberately: it is the one generative
 * engines are reported to read for freshness, and it is the field a CMS most often omits.
 */
export const RECOMMENDED_ARTICLE_FIELDS = [
  'headline',
  'image',
  'datePublished',
  'dateModified',
  'author',
  'publisher',
] as const;
