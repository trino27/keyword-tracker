import { load } from 'cheerio';
import { isSameSite } from '@app/contracts';
import { LISTING_LINK_EXCLUDED_SEGMENTS } from '../../constants/sitemap-scoring.constant';
import { pageKeyOf } from '../sitemap-scoring/sitemap-scoring';

const withSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);

/**
 * The posts a blog index links to, in the order it shows them: same-site links below the
 * index's own path (`/blog/` → `/blog/some-post/`), minus the links to more listings —
 * pagination, tags, categories, authors.
 */
export function extractListingLinks(
  html: string,
  listingUrl: string,
  siteKey: string,
): string[] {
  const listing = new URL(listingUrl);
  const prefix = withSlash(listing.pathname);
  const $ = load(html);
  const seen = new Set<string>();
  const links: string[] = [];

  $('a[href]').each((_, element) => {
    let url: URL;
    try {
      url = new URL($(element).attr('href')!, listing);
    } catch {
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (!isSameSite(url.href, siteKey)) return;
    if (!url.pathname.startsWith(prefix) || withSlash(url.pathname) === prefix)
      return;
    const segments = url.pathname
      .slice(prefix.length)
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.toLowerCase());
    if (segments.some((segment) => LISTING_LINK_EXCLUDED_SEGMENTS.has(segment)))
      return;
    url.hash = '';
    url.search = '';
    const key = pageKeyOf(url.href);
    if (key === null || seen.has(key)) return;
    seen.add(key);
    links.push(url.href);
  });
  return links;
}
