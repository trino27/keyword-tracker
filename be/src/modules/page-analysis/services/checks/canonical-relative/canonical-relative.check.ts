import { attribute, evidence } from '../_shared/evidence';
import { declaredCanonicals } from '../_shared/declared-canonicals';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A canonical in `<head>` written as a path. It works where it is served and moves with
 * every copy of the page — a staging host, an http mirror — which is why Google asks for
 * absolute URLs. Not applicable without any canonical: CANONICAL_MISSING says that.
 */
export const CANONICAL_RELATIVE_CHECK = defineCheck(
  'CANONICAL_RELATIVE',
  (page) => {
    if (declaredCanonicals(page).length === 0) return NOT_APPLICABLE;
    const relative = page.parsed.relativeCanonicals;
    return relative.length === 0
      ? PASS
      : fails({
          hrefs: relative,
          evidence: evidence(
            relative.map(
              (href) =>
                `<link rel="canonical" href="${attribute(href)}"> — resolves against whatever host serves the page`,
            ),
          ),
        });
  },
);
