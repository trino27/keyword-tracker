import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Google indexes the mobile rendering, so the absence of a viewport is a fact about what
 * is indexed, not about how the desktop page looks. The tag's CONTENT is not judged: the
 * values that matter are a rendering judgement this system cannot make from the HTML.
 */
export const VIEWPORT_MISSING_CHECK = defineCheck(
  'VIEWPORT_MISSING',
  ({ parsed }) =>
    parsed.viewport === null
      ? fails({
          evidence: evidence(['No <meta name="viewport"> in the document']),
        })
      : PASS,
);
