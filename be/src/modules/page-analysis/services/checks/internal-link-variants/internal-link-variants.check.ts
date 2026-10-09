import { evidence } from '../_shared/evidence';
import { internalLinks } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Query parameters that identify a visit, not a page; each one turns a link into a new
 * URL with the same content. Only names that mean nothing else are listed: `ref`, `id`
 * and `sid` are too often real parameters to accuse.
 */
const TRACKING_PARAMETER =
  /^(utm_[a-z_]+|gclid|fbclid|msclkid|yclid|dclid|mc_cid|mc_eid|_ga|_gl|sessionid|phpsessid|jsessionid)$/i;

/** Why one internal link is not the URL the site serves, or nothing when it is. */
function variantsOf(href: string, served: URL): string[] {
  const link = new URL(href);
  const reasons: string[] = [];
  if (served.protocol === 'https:' && link.protocol === 'http:')
    reasons.push('plain HTTP on an HTTPS site');
  if (link.hostname !== served.hostname)
    reasons.push(
      `host ${link.hostname}, while this page is served from ${served.hostname}`,
    );
  const tracking = [...link.searchParams.keys()].filter((name) =>
    TRACKING_PARAMETER.test(name),
  );
  if (tracking.length > 0)
    reasons.push(
      `tracking parameter${tracking.length === 1 ? '' : 's'} ${tracking.join(', ')}`,
    );
  return reasons;
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
