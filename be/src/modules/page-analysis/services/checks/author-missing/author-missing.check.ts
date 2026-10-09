import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Whether the page names who wrote it in any way the markup identifies: the article's
 * JSON-LD author, `<meta name="author">`, a `rel="author"` link, `itemprop="author"` or a
 * byline linking to the author's archive on this site (`/author/<slug>/`).
 * A byline that only a class name hints at is not counted, and is the cheapest fix.
 *
 * Always applicable: every post was written by someone.
 */
export const AUTHOR_MISSING_CHECK = defineCheck(
  'AUTHOR_MISSING',
  ({ parsed }) =>
    parsed.authors.length > 0
      ? PASS
      : fails({
          evidence: evidence([
            'No author in the article markup, no <meta name="author">, no rel="author" link, no itemprop="author", no byline linking to an author page',
          ]),
        }),
);
