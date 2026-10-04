import { ARTICLE_TYPES } from '../../../constants/article-types.constant';
import { defineCheck, fails, PASS } from '../check.interface';

/** Eligibility for a rich result, never a violation: Google requires no structured data. */
export const STRUCTURED_DATA_MISSING_CHECK = defineCheck(
  'STRUCTURED_DATA_MISSING',
  ({ parsed }) =>
    parsed.jsonLd.types.some((type) => ARTICLE_TYPES.has(type))
      ? PASS
      : fails({ types: parsed.jsonLd.types }),
);
