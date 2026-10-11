import type { ICheckInput } from '../check.interface';
import { isOwnDevelopmentHost } from './development-host';
import { sameDocument } from './same-document';

/**
 * The content links a link check judges: each fragment-free URL once, without the page
 * itself and without links to this site's own development host, which
 * DEVELOPMENT_HOST_REFERENCES reports (plan D36). Keyed as the outbound stage keys its
 * outcomes, so a link and its outcome meet.
 */
export function contentLinksOf(page: ICheckInput): string[] {
  const pageHost = new URL(page.finalUrl).hostname;
  const links = new Set<string>();
  for (const href of page.parsed.links) {
    try {
      const url = new URL(href);
      url.hash = '';
      if (sameDocument(url.href, page.finalUrl)) continue;
      if (isOwnDevelopmentHost(url.hostname, pageHost)) continue;
      links.add(url.href);
    } catch {
      // A link that does not parse is UNCRAWLABLE_LINKS' concern.
    }
  }
  return [...links];
}

/** "Checked 12 of 40 links." when some could not be asked, so silence never reads as fine. */
export function coverageNote(checked: number, total: number): string[] {
  return checked < total
    ? [
        `Checked ${checked} of ${total} links; the rest could not be asked within the crawl's budget, robots.txt or deadline.`,
      ]
    : [];
}
