import { evidence } from '../_shared/evidence';
import { robotsDirectivesForGoogle } from '../_shared/robots-directives';
import { defineCheck, fails, PASS } from '../check.interface';

const LARGE = 'max-image-preview:large';

/** The values that cap the preview below large. */
const RESTRICTING = new Set([
  'max-image-preview:none',
  'max-image-preview:standard',
]);

/**
 * Whether Google may show this page's image large — what Discover requires of a large
 * card. Read from the same declarations NOINDEX reads, scoped to Google the same way.
 * Google applies the more restrictive of two rules that disagree, so one declaration
 * capping the preview fails the page whatever another one allows.
 *
 * Always applicable: a page that says nothing has not escaped the check, it has not
 * allowed the large preview.
 */
export const IMAGE_PREVIEW_NOT_LARGE_CHECK = defineCheck(
  'IMAGE_PREVIEW_NOT_LARGE',
  (page) => {
    const declared = robotsDirectivesForGoogle(page);
    const restricting = declared.filter((found) =>
      found.rules.some((rule) => RESTRICTING.has(rule)),
    );
    if (restricting.length > 0)
      return fails({
        rule: restricting[0].rules.find((rule) => RESTRICTING.has(rule)),
        evidence: evidence(restricting.map((found) => found.quote)),
      });
    if (declared.some((found) => found.rules.includes(LARGE))) return PASS;
    return fails({
      rule: null,
      evidence: evidence(
        declared.length > 0
          ? declared.map((found) => `${found.quote} — no max-image-preview`)
          : ['No robots meta tag or X-Robots-Tag on the page'],
      ),
    });
  },
);
