import {
  declaredCanonicals,
  quoteCanonical,
} from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * More than one distinct canonical, across the tags in `<head>` and the `Link` header.
 * Distinct means a different URL, not a different spelling of the same tag: a theme and
 * a plugin both writing the right canonical is redundant, not contradictory.
 *
 * Not applicable without any canonical — there is nothing to contradict — exactly as
 * CANONICAL_MISMATCH is.
 */
export const CANONICAL_CONFLICT_CHECK = defineCheck(
  'CANONICAL_CONFLICT',
  (page) => {
    const declared = declaredCanonicals(page);
    if (declared.length === 0) return NOT_APPLICABLE;
    const distinct = [...new Set(declared.map(({ url }) => url))];
    return distinct.length < 2
      ? PASS
      : fails({
          canonicals: distinct,
          evidence: evidence(declared.map(quoteCanonical)),
        });
  },
);
