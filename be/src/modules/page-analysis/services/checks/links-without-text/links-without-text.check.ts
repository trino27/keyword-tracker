import { evidence } from '../_shared/evidence';
import { sameSite } from '../_shared/same-site';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Links to this site's own pages with no accessible name, as the extractor read them:
 * text, alt on a linked image, aria-label, aria-labelledby or title, with
 * screen-reader-only text counted. Only the empty case — a vague name ("read more") is a
 * judgement on wording, which the field study found fires on effectively every page.
 *
 * Links to other sites are left out. The anchor describes the page it points to, and
 * another site's page is that site's concern; on the recorded corpus the only nameless
 * links were icon-only share buttons to social networks, on every semrush post — a
 * template's accessibility defect, reported here it would have been a house style.
 *
 * Always applicable: a page whose links all have words has passed.
 */
export const LINKS_WITHOUT_TEXT_CHECK = defineCheck(
  'LINKS_WITHOUT_TEXT',
  ({ parsed, finalUrl }) => {
    const unnamed = parsed.unnamedLinks.filter(({ href }) =>
      sameSite(href, finalUrl),
    );
    return unnamed.length === 0
      ? PASS
      : fails({
          count: unnamed.length,
          evidence: evidence(unnamed.map(({ markup }) => markup)),
        });
  },
);
