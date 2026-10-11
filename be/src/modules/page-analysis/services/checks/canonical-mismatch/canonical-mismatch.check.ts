import { canonicalTargetOf } from '../_shared/canonical-target';
import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { isHttpTwin } from '../_shared/http-twin';
import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The canonical the page means — the first it declares, `<head>` before header — against
 * the URL it was served at. Without a canonical there is no claim to disagree with, only
 * CANONICAL_MISSING; with several that disagree, CANONICAL_CONFLICT says so as well.
 * The page's own http:// twin is CANONICAL_TO_HTTP's, more specific, finding, and a
 * target the crawl read and found broken is CANONICAL_TARGET_BROKEN's.
 */
export const CANONICAL_MISMATCH_CHECK = defineCheck(
  'CANONICAL_MISMATCH',
  (page) => {
    const [first] = declaredCanonicals(page);
    // The page's own http:// twin is CANONICAL_TO_HTTP's finding (plan D32).
    if (!first || isHttpTwin(first.url, page.finalUrl)) return NOT_APPLICABLE;
    // A target read and found broken is CANONICAL_TARGET_BROKEN's finding (plan D34).
    if (canonicalTargetOf(page).verdict === 'problem') return NOT_APPLICABLE;
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
