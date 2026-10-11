import { attribute, evidence } from '../_shared/evidence';
import { isOwnPage } from '../_shared/own-page-link';
import { internalLinks } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Links to other pages of this site carrying `rel="nofollow"`. Google reserves nofollow
 * for links the site does not vouch for; a site vouches for its own pages by definition.
 * Its affiliate redirects and print copies are not such pages, and are left alone.
 *
 * Not applicable without internal links: NO_INTERNAL_LINKS already fails that page, and
 * passing here would reward it for having nothing to mark.
 */
export const INTERNAL_LINKS_NOFOLLOW_CHECK = defineCheck(
  'INTERNAL_LINKS_NOFOLLOW',
  (page) => {
    const internal = new Set(internalLinks(page));
    if (internal.size === 0) return NOT_APPLICABLE;
    const nofollow = [
      ...new Set(
        page.parsed.nofollowLinks.filter(
          (href) => internal.has(href) && isOwnPage(href),
        ),
      ),
    ];
    return nofollow.length === 0
      ? PASS
      : fails({
          count: nofollow.length,
          total: internal.size,
          evidence: evidence(
            nofollow.map(
              (href) => `<a href="${attribute(href)}" rel="nofollow">`,
            ),
          ),
        });
  },
);
