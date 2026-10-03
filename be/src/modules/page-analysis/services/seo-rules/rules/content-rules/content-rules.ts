import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import {
  fails,
  NOT_APPLICABLE,
  PASS,
  type TSeoRuleGroup,
} from '../../seo-rule.interface';

const MIN_WORDS = SEO_ISSUE_CATALOGUE.THIN_CONTENT.min;
const EXAMPLES = 3;

export const CONTENT_RULES: TSeoRuleGroup<
  'IMAGES_MISSING_ALT' | 'THIN_CONTENT'
> = {
  /** `alt=""` marks a decorative image on purpose; only an absent alt is a miss. A page
   *  with no images at all is not judged: it would otherwise be rewarded for having none. */
  IMAGES_MISSING_ALT: ({ parsed }) => {
    if (parsed.images.length === 0) return NOT_APPLICABLE;
    const missing = parsed.images.filter((image) => image.alt === null);
    return missing.length > 0
      ? fails({
          count: missing.length,
          total: parsed.images.length,
          examples: missing
            .slice(0, EXAMPLES)
            .map((image) => image.src)
            .filter(Boolean),
        })
      : PASS;
  },

  THIN_CONTENT: ({ parsed }) =>
    parsed.wordCount < MIN_WORDS
      ? fails({ value: parsed.wordCount, min: MIN_WORDS })
      : PASS,
};
