import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { isHttpTwin } from '../_shared/http-twin';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A page served over HTTPS whose canonical — the first it declares, `<head>` before
 * header — is its own address over plain HTTP. One fact, one finding (plan D32): for that
 * twin CANONICAL_MISMATCH steps aside, and an http canonical naming ANOTHER page is
 * CANONICAL_MISMATCH's alone. A page served over HTTP is NOT_HTTPS's to report.
 */
export const CANONICAL_TO_HTTP_CHECK = defineCheck(
  'CANONICAL_TO_HTTP',
  (page) => {
    const [first] = declaredCanonicals(page);
    if (!first || new URL(page.finalUrl).protocol !== 'https:')
      return NOT_APPLICABLE;
    if (!first.url.toLowerCase().startsWith('http:')) return PASS;
    return !isHttpTwin(first.url, page.finalUrl)
      ? NOT_APPLICABLE
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
