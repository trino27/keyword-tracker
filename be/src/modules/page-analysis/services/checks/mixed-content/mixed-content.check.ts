import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const EXAMPLES = 3;

/** The CSP directive that has the browser fetch every http: subresource over https:. */
const UPGRADES = /(?:^|[;,\s])upgrade-insecure-requests(?:$|[;,\s])/i;

/**
 * Subresources fetched over plain HTTP by a page served over HTTPS. The browser blocks
 * the script and the stylesheet outright and flags the image, so this is about what the
 * reader actually receives, not about a preference.
 *
 * A Content-Security-Policy with upgrade-insecure-requests, sent as a header or a meta
 * tag, makes the browser fetch every one of them over HTTPS instead (MDN: it "upgrades all
 * requests to HTTPS, including blockable mixed content"), so nothing is mixed — a
 * resource with no HTTPS copy then fails to load, which is a broken resource, not this.
 *
 * Not applicable on an http page: nothing is mixed there, and passing it would reward the
 * page for the very thing NOT_HTTPS is failing it for.
 */
export const MIXED_CONTENT_CHECK = defineCheck(
  'MIXED_CONTENT',
  ({ parsed, finalUrl, headers }) => {
    if (!finalUrl.startsWith('https:')) return NOT_APPLICABLE;
    if (
      [
        headers['content-security-policy'],
        parsed.metaContentSecurityPolicy,
      ].some((policy) => policy && UPGRADES.test(policy))
    )
      return PASS;

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
