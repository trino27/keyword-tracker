import { siteKeyOf } from '@app/contracts';
import { attribute, evidence } from '../_shared/evidence';
import { isLongText } from '../_shared/long-text';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Second-level labels under a country code that a registrant cannot own: co.uk, com.ua. */
const PUBLIC_SECOND_LEVELS = new Set([
  'co',
  'com',
  'org',
  'net',
  'gov',
  'ac',
  'edu',
]);

/**
 * The domain an organisation registers — example.com, example.co.uk — approximated
 * without the Public Suffix List: the last two labels, or three under a country code's
 * public second level. Close enough for "is this the same company", which is all it
 * answers, and wrong only towards counting a link as the site's own.
 */
function organisationOf(hostname: string): string {
  const labels = siteKeyOf(hostname).split('.');
  const publicSecondLevel =
    labels.length >= 3 &&
    labels[labels.length - 1].length === 2 &&
    PUBLIC_SECOND_LEVELS.has(labels[labels.length - 2]);
  return labels.slice(publicSecondLevel ? -3 : -2).join('.');
}

/**
 * Whether a link leaves the site's own organisation. blog.example.com linking to
 * example.com/pricing, or to its own cta-redirect.example.com, cites nothing — though
 * `sameSite`, which the internal-link checks rightly use since the crawler admits only
 * one site key, would call both another site. On blog.hubspot.com every post "cited"
 * HubSpot's own CTA redirect until the organisation was compared instead.
 */
function outsideSource(href: string, pageUrl: string): boolean {
  try {
    return (
      organisationOf(new URL(href).hostname) !==
      organisationOf(new URL(pageUrl).hostname)
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
