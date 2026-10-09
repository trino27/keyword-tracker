import { ARTICLE_TYPES } from '../../../constants/article-types.constant';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** Eligibility for a rich result, never a violation: Google requires no structured data. */
export const STRUCTURED_DATA_MISSING_CHECK = defineCheck(
  'STRUCTURED_DATA_MISSING',
  ({ parsed }) =>
    parsed.jsonLd.types.some((type) => ARTICLE_TYPES.has(type))
      ? PASS
      : fails({
          types: parsed.jsonLd.types,
          evidence: evidence([
            parsed.jsonLd.types.length > 0
              ? `JSON-LD types on the page: ${parsed.jsonLd.types.join(', ')}`
              : 'No JSON-LD with a @type on the page',
          ]),
        }),
);
