import { XMLParser } from 'fast-xml-parser';

export type TParsedSitemap =
  /** `news`: a Google News sitemap — its entries carry <news:news>. */
  | { kind: 'urlset'; urls: string[]; news: boolean }
  | { kind: 'index'; sitemaps: string[] }
  | { kind: 'invalid' };

/**
 * Entity expansion is off: a sitemap is untrusted input, and a DOCTYPE with nested
 * entities is the classic way to make an XML parser allocate gigabytes. The five
 * predefined entities, which real sitemaps do use inside URLs, are decoded by hand.
 */
const parser = new XMLParser({
  removeNSPrefix: true,
  processEntities: false,
  ignoreAttributes: true,
  parseTagValue: false,
  isArray: (name) => name === 'url' || name === 'sitemap',
});

const PREDEFINED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

export function decodeXmlText(text: string): string {
  return text
    .trim()
    .replace(
      /&(?:amp|lt|gt|quot|apos);/g,
      (entity) => PREDEFINED_ENTITIES[entity],
    );
}

interface ILocEntry {
  loc?: unknown;
  news?: unknown;
}

/** `urlset` → page URLs in document order; `sitemapindex` → child sitemaps in order. */
export function parseSitemap(xml: string): TParsedSitemap {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return { kind: 'invalid' };
  }
  const urlset = document.urlset as { url?: ILocEntry[] } | undefined;
  if (urlset !== undefined) {
    return {
      kind: 'urlset',
      urls: locsOf(urlset?.url),
      news: (urlset?.url ?? []).some((entry) => entry.news !== undefined),
    };
  }
  const index = document.sitemapindex as { sitemap?: ILocEntry[] } | undefined;
  if (index !== undefined) {
    return { kind: 'index', sitemaps: locsOf(index?.sitemap) };
  }
  return { kind: 'invalid' };
}

function locsOf(entries: ILocEntry[] | undefined): string[] {
  return (entries ?? [])
    .map(({ loc }) => (typeof loc === 'string' ? decodeXmlText(loc) : ''))
    .filter((loc) => loc.length > 0);
}
