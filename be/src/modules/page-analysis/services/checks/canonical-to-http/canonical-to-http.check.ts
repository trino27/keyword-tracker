import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A page served over HTTPS whose canonical — the first it declares, `<head>` before
 * header — names a plain-HTTP address. A page served over HTTP is NOT_HTTPS's to report:
 * there an http canonical only agrees with the page.
 *
 * It fires beside CANONICAL_MISMATCH on the same tag, and both statements are true: one
 * says the canonical names another address, this one that the address is insecure (plan
 * O4).
 */
export const CANONICAL_TO_HTTP_CHECK = defineCheck(
  'CANONICAL_TO_HTTP',
  (page) => {
    const [first] = declaredCanonicals(page);
    if (!first || new URL(page.finalUrl).protocol !== 'https:')
      return NOT_APPLICABLE;
    let protocol: string;
    try {
      protocol = new URL(first.url).protocol;
    } catch {
      return NOT_APPLICABLE;
    }
    return protocol !== 'http:'
      ? PASS
      : fails({
          canonical: first.url,
          source: first.source,
          evidence: evidence([
            quoteCanonical(first),
            `Served at: ${page.finalUrl}`,
          ]),
        });
  },
);
