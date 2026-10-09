import { declaredCanonicals } from '../_shared/declared-canonicals';
import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * A canonical in `<head>` or in a `Link` header passes. One written in `<body>` does
 * not: Google accepts the canonical only in the head, so the page has none, and the one
 * the author wrote is the evidence of why.
 */
export const CANONICAL_MISSING_CHECK = defineCheck(
  'CANONICAL_MISSING',
  (page) => {
    if (declaredCanonicals(page).length > 0) return PASS;
    const outsideHead = page.parsed.canonicalsOutsideHead;
    return fails({
      outsideHead,
      evidence: evidence(
        outsideHead.length > 0
          ? outsideHead.map(
              (url) =>
                `<link rel="canonical" href="${attribute(url)}"> — in <body>, where Google does not read it`,
            )
          : [
              'No <link rel="canonical"> in <head>, and no canonical Link header',
            ],
      ),
    });
  },
);
