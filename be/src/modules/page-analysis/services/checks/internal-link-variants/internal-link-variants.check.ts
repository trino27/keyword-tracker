import { evidence } from '../_shared/evidence';
import { variantsOf } from '../_shared/link-variants';
import { internalLinks } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Internal links that reach a page through a URL the site does not serve it at: the
 * other scheme, the other www-variant of the host, or a tracking parameter. The host is
 * compared with THIS page's, because that is the variant the site was found serving;
 * which one it should serve is the canonical's business, not this check's.
 *
 * Trailing slashes are not judged: `/post` and `/post/` are both common as the served
 * form, and which one a site uses cannot be read from one page.
 *
 * Not applicable without internal links, as INTERNAL_LINKS_NOFOLLOW is.
 */
export const INTERNAL_LINK_VARIANTS_CHECK = defineCheck(
  'INTERNAL_LINK_VARIANTS',
  (page) => {
    const internal = [...new Set(internalLinks(page))];
    if (internal.length === 0) return NOT_APPLICABLE;
    const served = new URL(page.finalUrl);
    const variants = internal
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
