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

/**
 * The item links of an RSS 2.0, RSS 1.0 (RDF) or Atom feed, in feed order; `null` when
 * the document is not a feed at all — a home page served at /feed/ is not an empty feed.
 */
export function parseFeedLinks(xml: string): string[] | null {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return null;
  }
  const rss = document.rss as { channel?: { item?: { link?: TLink[] }[] } };
  const rdf = document.RDF as { item?: { link?: TLink[] }[] } | undefined;
  const atom = document.feed as { entry?: { link?: TLink[] }[] } | undefined;
  const items = rss?.channel?.item ?? rdf?.item ?? atom?.entry;
  if (!rss && !rdf && !atom) return null;
  return (items ?? [])
    .map(({ link }) => linkOf(link ?? []))
    .filter((link): link is string => link !== undefined);
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

const FEED_TYPES = new Set(['application/rss+xml', 'application/atom+xml']);

/** `<link rel="alternate" type="application/rss+xml|atom+xml">` targets, resolved. */
export function findAlternateFeeds(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const hrefs: string[] = [];
  $('link[rel~="alternate"][href]').each((_, element) => {
    const type = ($(element).attr('type') ?? '').trim().toLowerCase();
    if (!FEED_TYPES.has(type)) return;
    try {
      hrefs.push(new URL($(element).attr('href')!, baseUrl).href);
    } catch {
      // An unparseable href is the page's mistake, not a feed.
    }
  });
  return hrefs;
}
