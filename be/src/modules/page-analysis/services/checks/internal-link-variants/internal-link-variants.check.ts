import { evidence } from '../_shared/evidence';
import { linkVerdictOf } from '../_shared/link-verdict';
import { variantsOf } from '../_shared/link-variants';
import { internalLinks } from '../_shared/same-site';
import {
  defineCheck,
  fails,
  NOT_APPLICABLE,
  PASS,
  type ICheckInput,
} from '../check.interface';

/** Whether the crawl found the link dead: then it is BROKEN_LINKS' finding alone. */
function isBroken(page: ICheckInput, href: string): boolean {
  try {
    const url = new URL(href);
    url.hash = '';
    const outcome = page.linkStatuses.links.get(url.href);
    return outcome !== undefined && linkVerdictOf(outcome, true) === 'broken';
  } catch {
    return false;
  }
}

/**
 * Internal links that reach a page through a URL the site does not serve it at: the
 * other scheme, the other www-variant of the host, or a tracking parameter. The host is
 * compared with THIS page's, because that is the variant the site was found serving;
 * which one it should serve is the canonical's business, not this check's.
 *
 * Trailing slashes are not judged: `/post` and `/post/` are both common as the served
 * form, and which one a site uses cannot be read from one page.
 *
 * Not applicable without internal links, as INTERNAL_LINKS_NOFOLLOW is. A link the crawl
 * found dead is BROKEN_LINKS' alone: how a dead link's address is written no longer
 * matters (field audit, 2026-10-11, cossa.ru).
 */
export const INTERNAL_LINK_VARIANTS_CHECK = defineCheck(
  'INTERNAL_LINK_VARIANTS',
  (page) => {
    const internal = [...new Set(internalLinks(page))];
    if (internal.length === 0) return NOT_APPLICABLE;
    const served = new URL(page.finalUrl);
    const variants = internal
      .filter((href) => !isBroken(page, href))
      .map((href) => ({ href, reasons: variantsOf(href, served) }))
      .filter(({ reasons }) => reasons.length > 0);
    return variants.length === 0
      ? PASS
      : fails({
          count: variants.length,
          total: internal.length,
          evidence: evidence(
            variants.map(
              ({ href, reasons }) => `${href} — ${reasons.join('; ')}`,
            ),
          ),
        });
  },
);
