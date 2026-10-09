import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * `head > title` only, so an SVG's `<title>` in the body does not count. The page's
 * `og:title`, when it has one, is quoted beside the absence: it is the title the author
 * already wrote, and the fastest fix.
 */
export const TITLE_MISSING_CHECK = defineCheck(
  'TITLE_MISSING',
  ({ parsed }) => {
    if (parsed.title !== null) return PASS;
    const ogTitle = parsed.openGraph['og:title'];
    return fails({
      evidence: evidence([
        'No <title> element in <head>',
        ...(ogTitle
          ? [
              `<meta property="og:title" content="${attribute(ogTitle)}"> — written for sharing, not read as the page title`,
            ]
          : []),
      ]),
    });
  },
);
