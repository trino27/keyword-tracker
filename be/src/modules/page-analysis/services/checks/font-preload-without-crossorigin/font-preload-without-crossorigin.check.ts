import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * A font preload the browser cannot reuse: fonts are fetched in CORS mode, so a preload
 * without crossorigin is a second download, not the first. Always applicable.
 */
export const FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK = defineCheck(
  'FONT_PRELOAD_WITHOUT_CROSSORIGIN',
  ({ parsed }) =>
    parsed.fontPreloadsWithoutCrossorigin.length === 0
      ? PASS
      : fails({
          count: parsed.fontPreloadsWithoutCrossorigin.length,
          evidence: evidence(parsed.fontPreloadsWithoutCrossorigin),
        }),
);
