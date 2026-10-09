import { attribute, evidence } from '../_shared/evidence';
import { sameDocument } from '../_shared/same-document';
import { internalLinks, sameSite } from '../_shared/same-site';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * `parsed.links` holds only what the author wrote: the nav, the related-posts rail and
 * the share bar are gone before this reads them. That is the whole reason the check can
 * mean anything — a theme that links every post from every sidebar would otherwise make
 * "this page links somewhere" true of every page on the site.
 *
 * A link back into this page — the table of contents, `#comments` — is not a link to
 * another page and does not pass the check: a post whose only on-site links were its
 * own headings used to read as well linked.
 *
 * Always applicable. A post with nothing to link to is a post that should say so by
 * failing; there is no condition under which the question cannot be asked.
 */
export const NO_INTERNAL_LINKS_CHECK = defineCheck(
  'NO_INTERNAL_LINKS',
  (page) => {
    if (internalLinks(page).length > 0) return PASS;
    const { links } = page.parsed;
    const external = links.filter((href) => !sameSite(href, page.finalUrl));
    const toThisPage = links.filter((href) =>
      sameDocument(href, page.finalUrl),
    );
    return fails({
      external: external.length,
      toThisPage: toThisPage.length,
      evidence: evidence([
        ...(toThisPage.length > 0
          ? [
              `${toThisPage.length} link${toThisPage.length === 1 ? '' : 's'} back into this page, e.g. <a href="${attribute(toThisPage[0])}">`,
            ]
          : []),
        ...external.map(
          (href) => `<a href="${attribute(href)}"> — another site`,
        ),
        ...(links.length === 0 ? ['No <a href> in the main content'] : []),
      ]),
    });
  },
);
