import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const EXAMPLES = 3;

/**
 * Subresources fetched over plain HTTP by a page served over HTTPS. The browser blocks
 * the script and the stylesheet outright and flags the image, so this is about what the
 * reader actually receives, not about a preference.
 *
 * Not applicable on an http page: nothing is mixed there, and passing it would reward the
 * page for the very thing NOT_HTTPS is failing it for.
 */
export const MIXED_CONTENT_CHECK = defineCheck(
  'MIXED_CONTENT',
  ({ parsed, finalUrl }) => {
    if (!finalUrl.startsWith('https:')) return NOT_APPLICABLE;

    const insecure = parsed.resourceUrls.filter((url) =>
      url.startsWith('http:'),
    );
    return insecure.length === 0
      ? PASS
      : fails({
          count: insecure.length,
          total: parsed.resourceUrls.length,
          examples: insecure.slice(0, EXAMPLES),
          evidence: evidence(
            insecure.map((url) => `${url} — loaded over plain HTTP`),
          ),
        });
  },
);
