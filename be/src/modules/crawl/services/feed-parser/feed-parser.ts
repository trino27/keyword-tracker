import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { decodeXmlText } from '../sitemap-parser/sitemap-parser';

const parser = new XMLParser({
  removeNSPrefix: true,
  processEntities: false,
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  parseTagValue: false,
  isArray: (name) => name === 'item' || name === 'entry' || name === 'link',
});

type TLink = string | { '@href'?: string; '@rel'?: string; '#text'?: string };
type TGuid = string | { '@isPermaLink'?: string; '#text'?: string };

interface IFeedItem {
  link?: TLink[];
  /** FeedBurner's `<feedburner:origLink>`: the post itself, not the proxy's redirect. */
  origLink?: string;
  guid?: TGuid;
}

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;

/**
 * The item links of an RSS 2.0, RSS 1.0 (RDF), Atom or JSON Feed, in feed order, with
 * `utm_*` parameters and the fragment removed; `null` when the document is not a feed at
 * all — a home page served at /feed/ is not an empty feed.
 */
export function parseFeedLinks(text: string): string[] | null {
  const links = text.trimStart().startsWith('{')
    ? jsonFeedLinks(text)
    : xmlFeedLinks(text);
  return links?.map(withoutTracking) ?? null;
}

function xmlFeedLinks(xml: string): string[] | null {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return null;
  }
  const rss = document.rss as { channel?: { item?: IFeedItem[] } };
  const rdf = document.RDF as { item?: IFeedItem[] } | undefined;
  const atom = document.feed as { entry?: IFeedItem[] } | undefined;
  const items = rss?.channel?.item ?? rdf?.item ?? atom?.entry;
  if (!rss && !rdf && !atom) return null;
  return (items ?? [])
    .map(itemLinkOf)
    .filter((link): link is string => link !== undefined);
}

function itemLinkOf(item: IFeedItem): string | undefined {
  if (typeof item.origLink === 'string' && item.origLink.trim())
    return decodeXmlText(item.origLink);
  return linkOf(item.link ?? []) ?? permalinkGuidOf(item.guid);
}

function linkOf(links: TLink[]): string | undefined {
  for (const link of links) {
    if (typeof link === 'string' && link.trim()) return decodeXmlText(link);
    if (typeof link === 'object') {
      if (link['@href'] && (!link['@rel'] || link['@rel'] === 'alternate'))
        return decodeXmlText(link['@href']);
      if (link['#text']?.trim()) return decodeXmlText(link['#text']);
    }
  }
  return undefined;
}

/** RSS 2.0: a guid is the item's permalink unless it says `isPermaLink="false"`. */
function permalinkGuidOf(guid: TGuid | undefined): string | undefined {
  if (guid === undefined) return undefined;
  const value = decodeXmlText(
    typeof guid === 'string' ? guid : (guid['#text'] ?? ''),
  );
  const permalink =
    typeof guid === 'string' || guid['@isPermaLink']?.toLowerCase() !== 'false';
  return permalink && ABSOLUTE_HTTP_URL.test(value) ? value : undefined;
}

/**
 * JSON Feed 1 and 1.1: `url` is the item's permalink. `external_url` points at what the
 * post is about, elsewhere, and `id` is only sometimes a URL — neither is a post.
 */
function jsonFeedLinks(text: string): string[] | null {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    return null;
  }
  const feed = document as { version?: unknown; items?: unknown };
  if (
    typeof feed?.version !== 'string' ||
    !feed.version.startsWith('https://jsonfeed.org/version/') ||
    !Array.isArray(feed.items)
  )
    return null;
  return (feed.items as { url?: unknown }[])
    .map(({ url }) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url) => ABSOLUTE_HTTP_URL.test(url));
}

/** Feeds tag their links for analytics; the post is the same page without the tags. */
function withoutTracking(link: string): string {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return link;
  }
  for (const name of [...url.searchParams.keys()])
    if (name.toLowerCase().startsWith('utm_')) url.searchParams.delete(name);
  url.hash = '';
  return url.href;
}

const FEED_TYPES = new Set([
  'application/rss+xml',
  'application/atom+xml',
  'application/feed+json',
]);

/** `<link rel="alternate">` targets of an RSS, Atom or JSON Feed type, resolved. */
export function findAlternateFeeds(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const hrefs: string[] = [];
  $('link[rel~="alternate"][href]').each((_, element) => {
    const type = ($(element).attr('type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (!FEED_TYPES.has(type)) return;
    try {
      hrefs.push(new URL($(element).attr('href')!, baseUrl).href);
    } catch {
      // An unparseable href is the page's mistake, not a feed.
    }
  });
  return hrefs;
}
