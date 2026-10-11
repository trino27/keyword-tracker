import { siteKeyOf } from '@app/contracts';
import { attribute, evidence } from '../_shared/evidence';
import { isLongText } from '../_shared/long-text';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Whether a link leaves the site's own organisation: the site key, its subdomains, and
 * the domain it is a subdomain of all count as the site. blog.example.com linking to
 * example.com/pricing cites nothing, though `sameSite` — which the internal-link checks
 * rightly use, since the crawler admits only one site key — would call it another site.
 */
function outsideSource(href: string, pageUrl: string): boolean {
  try {
    const site = siteKeyOf(new URL(pageUrl).hostname);
    const host = siteKeyOf(new URL(href).hostname);
    return !(
      host === site ||
      host.endsWith(`.${site}`) ||
      site.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * `parsed.links` holds only what the author wrote, http(s) only: the share buttons, the
 * nav and the related-posts rail are gone before this reads them, so a share-to-LinkedIn
 * button does not pass for a citation.
 *
 * Not applicable to a short post, which is rarely the place for a citation.
 */
export const NO_EXTERNAL_SOURCES_CHECK = defineCheck(
  'NO_EXTERNAL_SOURCES',
  ({ parsed, finalUrl }) => {
    if (!isLongText(parsed)) return NOT_APPLICABLE;
    const { links } = parsed;
    if (links.some((href) => outsideSource(href, finalUrl))) return PASS;
    return fails({
      words: parsed.wordCount,
      links: links.length,
      evidence: evidence(
        links.length === 0
          ? ['No <a href> in the main content']
          : [
              `${links.length} link${links.length === 1 ? '' : 's'} in the content, all to this site, e.g. <a href="${attribute(links[0])}">`,
            ],
      ),
    });
  },
);
