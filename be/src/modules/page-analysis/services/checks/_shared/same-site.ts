import { siteKeyOf } from '@app/contracts';
import type { ICheckInput } from '../check.interface';
import { sameDocument } from './same-document';

/**
 * Same site by the product's own `siteKey` — the host without a leading `www.` — so a
 * link counts as internal here exactly when the crawler would have admitted it as this
 * client's. Comparing hosts as served does not do that: a theme that writes its own
 * links with the prefix, on a site reached without it, would have every one of them
 * counted as outbound and the page reported as linking nowhere.
 *
 * Every other subdomain is still another site, which is the product's definition too.
 */
export function sameSite(href: string, pageUrl: string): boolean {
  try {
    return (
      siteKeyOf(new URL(href).hostname) === siteKeyOf(new URL(pageUrl).hostname)
    );
  } catch {
    return false;
  }
}

/**
 * The content's links to OTHER pages of this site. A link back into this same page —
 * a table of contents, a "back to top" — is on the site but leads nowhere new, and
 * counting it let a post whose only links were its own headings pass as well linked.
 */
export function internalLinks(page: ICheckInput): string[] {
  return page.parsed.links.filter(
    (href) =>
      sameSite(href, page.finalUrl) && !sameDocument(href, page.finalUrl),
  );
}
