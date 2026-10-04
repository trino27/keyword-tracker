import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const EXAMPLES = 3;

/**
 * An empty alt marks a decorative image on purpose; only an absent alt is a miss. A page
 * with no images at all is not judged: it would otherwise be rewarded for having none.
 */
export const IMAGES_MISSING_ALT_CHECK = defineCheck(
  'IMAGES_MISSING_ALT',
  ({ parsed }) => {
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
);
