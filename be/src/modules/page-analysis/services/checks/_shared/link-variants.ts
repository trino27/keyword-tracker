/**
 * Query parameters that identify a visit, not a page; each one turns a link into a new
 * URL with the same content. Only names that mean nothing else are listed: `ref`, `id`
 * and `sid` are too often real parameters to accuse.
 */
const TRACKING_PARAMETER =
  /^(utm_[a-z_]+|gclid|fbclid|msclkid|yclid|dclid|mc_cid|mc_eid|_ga|_gl|sessionid|phpsessid|jsessionid)$/i;

/**
 * Why one internal link is not the URL the site serves, or nothing when it is. Read by
 * INTERNAL_LINK_VARIANTS, and by LINKS_TO_REDIRECTS to step aside for such a link (plan
 * D29): it redirects because of the variant, which that check already reports.
 */
export function variantsOf(href: string, served: URL): string[] {
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
