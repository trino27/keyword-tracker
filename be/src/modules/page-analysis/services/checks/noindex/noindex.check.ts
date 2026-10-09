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
  const directives = robotsDirectivesForGoogle(page);
  const found = directives.find(({ rules }) =>
    rules.some((rule) => DROPS_FROM_INDEX.has(rule)),
  );
  if (found)
    return fails({
      source: found.source,
      ...(found.name ? { name: found.name } : {}),
      value: found.value,
      evidence: evidence([found.quote]),
    });
  // An unavailable_after date that had passed when the page was fetched drops it the same
  // way. Judged against the fetch, not a clock, so the analysis stays a function of input.
  const expired = directives.find(
    ({ unavailableAfter }) =>
      unavailableAfter !== null && unavailableAfter <= page.fetchedAt,
  );
  if (!expired) return PASS;
  return fails({
    source: expired.source,
    ...(expired.name ? { name: expired.name } : {}),
    value: expired.value,
    unavailableAfter: expired.unavailableAfter!.toISOString(),
    evidence: evidence([
      expired.quote,
      `The page was fetched on ${page.fetchedAt.toISOString().slice(0, 10)}, after that date`,
    ]),
  });
});
