import { siteKeyOf } from '@app/contracts';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Same site by the product's own `siteKey` — the host without a leading `www.` — so a
 * link counts as internal here exactly when the crawler would have admitted it as this
 * client's. Comparing hosts as served does not do that: a theme that writes its own
 * links with the prefix, on a site reached without it, would have every one of them
 * counted as outbound and the page reported as linking nowhere.
 *
 * Every other subdomain is still another site, which is the product's definition too.
 */
const sameSite = (href: string, pageUrl: string) => {
  try {
    return (
      siteKeyOf(new URL(href).hostname) === siteKeyOf(new URL(pageUrl).hostname)
    );
  } catch {
    return false;
  }
};

/**
 * `parsed.links` holds only what the author wrote: the nav, the related-posts rail and
 * the share bar are gone before this reads them. That is the whole reason the check can
 * mean anything — a theme that links every post from every sidebar would otherwise make
 * "this page links somewhere" true of every page on the site.
 *
 * Always applicable. A post with nothing to link to is a post that should say so by
 * failing; there is no condition under which the question cannot be asked.
 */
export const NO_INTERNAL_LINKS_CHECK = defineCheck(
  'NO_INTERNAL_LINKS',
  ({ parsed, finalUrl }) => {
    const internal = parsed.links.filter((href) => sameSite(href, finalUrl));
    return internal.length > 0
      ? PASS
      : fails({ external: parsed.links.length - internal.length });
  },
);
