import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { TSeoRuleGroup } from '../../seo-rule.interface';

const MIN_WORDS = SEO_ISSUE_CATALOGUE.THIN_CONTENT.min;
const EXAMPLES = 3;

export const CONTENT_RULES: TSeoRuleGroup<
  'IMAGES_MISSING_ALT' | 'THIN_CONTENT'
> = {
  /** `alt=""` marks a decorative image on purpose; only an absent alt is a miss. */
  IMAGES_MISSING_ALT: ({ parsed }) => {
    const missing = parsed.images.filter((image) => image.alt === null);
    return missing.length > 0
      ? {
          count: missing.length,
          total: parsed.images.length,
          examples: missing
            .slice(0, EXAMPLES)
            .map((image) => image.src)
            .filter(Boolean),
        }
      : null;
  },

  THIN_CONTENT: ({ parsed }) =>
    parsed.wordCount < MIN_WORDS
      ? { words: parsed.wordCount, min: MIN_WORDS }
      : null,
};
