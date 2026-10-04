import {
  ARTICLE_TYPES,
  RECOMMENDED_ARTICLE_FIELDS,
} from '../../../constants/article-types.constant';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Which of Google's recommended article properties the article node does not carry.
 *
 * Google's Article type states no REQUIRED property at all — "include what applies" — so
 * every one of these is eligibility for part of a rich result and never a rule the page
 * breaks. The severity and the wording follow STRUCTURED_DATA_MISSING for that reason.
 *
 * Not applicable without an article node: that page is already failing the check above,
 * and saying it twice tells the reader nothing the first finding did not.
 */
export const STRUCTURED_DATA_INCOMPLETE_CHECK = defineCheck(
  'STRUCTURED_DATA_INCOMPLETE',
  ({ parsed }) => {
    if (!parsed.jsonLd.types.some((type) => ARTICLE_TYPES.has(type)))
      return NOT_APPLICABLE;

    const present = new Set(parsed.jsonLd.articleFields);
    const missing = RECOMMENDED_ARTICLE_FIELDS.filter(
      (field) => !present.has(field),
    );
    return missing.length === 0 ? PASS : fails({ missing });
  },
);
