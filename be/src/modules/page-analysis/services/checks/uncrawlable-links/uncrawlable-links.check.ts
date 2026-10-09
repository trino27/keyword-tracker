import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Links in the main content that a crawler cannot follow: an `<a>` that navigates by
 * `onclick` with no href, or whose href is a `javascript:` call. Google documents both
 * as links it will not extract. The extractor has already left out `<a name>` targets
 * and `<a role="button">` controls, which are not links at all.
 *
 * Always applicable: a page whose links are all real has passed, not escaped.
 */
export const UNCRAWLABLE_LINKS_CHECK = defineCheck(
  'UNCRAWLABLE_LINKS',
  ({ parsed }) =>
    parsed.uncrawlableLinks.length === 0
      ? PASS
      : fails({
          count: parsed.uncrawlableLinks.length,
          evidence: evidence(parsed.uncrawlableLinks),
        }),
);
