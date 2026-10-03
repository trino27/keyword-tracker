import type { TSeoRuleGroup } from '../../seo-rule.interface';

/**
 * Google's documented article types and the subtypes a blog realistically emits. A page
 * declaring any of them is eligible for the article rich result; one declaring none is not.
 */
const ARTICLE_TYPES = new Set([
  'Article',
  'NewsArticle',
  'BlogPosting',
  'TechArticle',
  'ScholarlyArticle',
  'Report',
  'LiveBlogPosting',
]);

/** Eligibility for a rich result, never a violation: Google requires no structured data. */
export const STRUCTURED_DATA_RULES: TSeoRuleGroup<'STRUCTURED_DATA_MISSING'> = {
  STRUCTURED_DATA_MISSING: ({ parsed }) =>
    parsed.jsonLd.types.some((type) => ARTICLE_TYPES.has(type))
      ? null
      : { types: parsed.jsonLd.types },
};
