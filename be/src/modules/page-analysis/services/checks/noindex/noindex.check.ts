import { evidence } from '../_shared/evidence';
import { robotsDirectivesForGoogle } from '../_shared/robots-directives';
import { defineCheck, fails, PASS } from '../check.interface';

/** The two rules that drop a page from the index; `none` is `noindex, nofollow`. */
const DROPS_FROM_INDEX = new Set(['noindex', 'none']);

/**
 * `noindex` or `none` for Google: in `<meta name="robots">`, in `<meta name="googlebot">`,
 * or in an X-Robots-Tag header addressed to everyone or to Googlebot. A header scoped to
 * another crawler (`bingbot: noindex`) is that crawler's business, not Google's.
 */
export const NOINDEX_CHECK = defineCheck('NOINDEX', (page) => {
  const found = robotsDirectivesForGoogle(page).find(({ rules }) =>
    rules.some((rule) => DROPS_FROM_INDEX.has(rule)),
  );
  if (!found) return PASS;
  return fails({
    source: found.source,
    ...(found.name ? { name: found.name } : {}),
    value: found.value,
    evidence: evidence([found.quote]),
  });
});
