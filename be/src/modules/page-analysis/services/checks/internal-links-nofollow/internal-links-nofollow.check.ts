import { attribute, evidence } from '../_shared/evidence';
import { internalLinks } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The first path segments under which a site keeps redirects to someone else's site —
 * its affiliate links, `/refer/bluehost/` on wpbeginner.com. The URL is the site's, the
 * page it leads to is not, and Google asks for exactly such links to be marked.
 */
const OUTBOUND_REDIRECT_SECTIONS = new Set([
  'refer',
  'go',
  'goto',
  'out',
  'recommends',
  'visit',
  'aff',
  'affiliate',
]);

/** A print version of a post — `/wprm_print/<slug>`, `/print/` — is the post again. */
const PRINT_SEGMENT = /(?:^|[-_])print(?:$|[-_])/i;

/**
 * Whether the link leads to a page of this site that the site would vouch for: not an
 * outbound redirect dressed as an internal URL, not a print copy kept out on purpose.
 */
function isOwnPage(href: string): boolean {
  const segments = new URL(href).pathname.split('/').filter(Boolean);
  return !(
    OUTBOUND_REDIRECT_SECTIONS.has(segments[0]?.toLowerCase() ?? '') ||
    segments.some((segment) => PRINT_SEGMENT.test(segment))
  );
}

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
