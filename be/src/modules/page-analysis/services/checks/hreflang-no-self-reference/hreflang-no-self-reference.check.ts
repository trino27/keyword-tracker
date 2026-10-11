import { declaredCanonicals } from '../_shared/declared-canonicals';
import { sameDocument } from '../_shared/same-document';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A hreflang set that never names the page carrying it. Google requires every page of a
 * set to list itself as well as the others, and may ignore a set that does not. A page
 * with no hreflang at all is not judged — most want none. The arm was HREFLANG_INVALID's
 * until plan D14 gave it a code of its own, so one fact is reported once.
 */
export const HREFLANG_NO_SELF_REFERENCE_CHECK = defineCheck(
  'HREFLANG_NO_SELF_REFERENCE',
  (page) => {
    const {
      parsed: { alternates },
      finalUrl,
    } = page;
    if (alternates.length === 0) return NOT_APPLICABLE;
    // A canonical naming another URL takes the page out of its own set: HREFLANG_INVALID
    // says so, and asking it to list itself here would advise the opposite.
    const [canonical] = declaredCanonicals(page);
    if (canonical && !sameDocument(canonical.url, finalUrl))
      return NOT_APPLICABLE;
    return alternates.some(({ href }) => sameDocument(href, finalUrl))
      ? PASS
      : fails({
          alternates: alternates.length,
          evidence: evidence([
            `None of the ${alternates.length} alternates names this page (${finalUrl})`,
          ]),
        });
  },
);
