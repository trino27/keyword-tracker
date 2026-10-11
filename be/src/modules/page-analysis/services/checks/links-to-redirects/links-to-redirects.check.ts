import { contentLinksOf } from '../_shared/content-links';
import { evidence } from '../_shared/evidence';
import { linkVerdictOf } from '../_shared/link-verdict';
import { variantsOf } from '../_shared/link-variants';
import { sameSite } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Links to this site that reach their page through a redirect. Google asks a site to
 * link to the canonical URL rather than a duplicate; a redirecting link sends every
 * reader and crawler one hop around. External redirects are the other site's
 * arrangement and are not judged (plan D19); a link that redirects only because it is
 * the http or other-www variant, or carries a tracking parameter, is
 * INTERNAL_LINK_VARIANTS' finding (plan D29).
 */
export const LINKS_TO_REDIRECTS_CHECK = defineCheck(
  'LINKS_TO_REDIRECTS',
  (page) => {
    const served = new URL(page.finalUrl);
    const judged = contentLinksOf(page)
      .filter(
        (url) =>
          sameSite(url, page.finalUrl) && variantsOf(url, served).length === 0,
      )
      .flatMap((url) => {
        const outcome = page.linkStatuses.links.get(url);
        return outcome && outcome.kind === 'answered'
          ? [{ url, outcome, verdict: linkVerdictOf(outcome, true) }]
          : [];
      });
    if (judged.length === 0) return NOT_APPLICABLE;
    const redirecting = judged.filter(({ verdict }) => verdict === 'redirects');
    if (redirecting.length === 0) return PASS;
    return fails({
      count: redirecting.length,
      checked: judged.length,
      links: redirecting.map(({ url }) => url),
      evidence: evidence(
        redirecting.map(
          ({ url, outcome }) =>
            `${url} → ${outcome.finalUrl} (${outcome.redirects.map(({ status }) => status).join(' → ')})`,
        ),
      ),
    });
  },
);
