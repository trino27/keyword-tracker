import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The canonical the page means — the first it declares, `<head>` before header — against
 * the URL it was served at. Without a canonical there is no claim to disagree with, only
 * CANONICAL_MISSING; with several that disagree, CANONICAL_CONFLICT says so as well.
 */
export const CANONICAL_MISMATCH_CHECK = defineCheck(
  'CANONICAL_MISMATCH',
  (page) => {
    const [first] = declaredCanonicals(page);
    if (!first) return NOT_APPLICABLE;
    return sameDocument(first.url, page.finalUrl)
      ? PASS
      : fails({
          canonical: first.url,
          url: page.finalUrl,
          source: first.source,
          evidence: evidence([
            quoteCanonical(first),
            `Served at: ${page.finalUrl}`,
          ]),
        });
  },
);
