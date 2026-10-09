import { XMLParser } from 'fast-xml-parser';

export type TParsedSitemap =
  /** `news`: a Google News sitemap — its entries carry <news:news>. */
  | {
      kind: 'urlset';
      urls: string[];
      news: boolean;
      /**
       * `<lastmod>` by URL, for the entries that carry one; absent when none does. The
       * site checks read it to judge whether the dates are real.
       */
      lastmods?: Record<string, string>;
    }
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
  lastmod?: unknown;
  news?: unknown;
}

/**
 * `urlset` → page URLs in document order; `sitemapindex` → child sitemaps in order. A
 * text sitemap (one absolute URL per line, sitemaps.org) reads as a urlset.
 */
export function parseSitemap(xml: string): TParsedSitemap {
  return parseXmlSitemap(xml) ?? parseTextSitemap(xml);
}

const ABSOLUTE_HTTP_URL = /^https?:\/\/\S+$/i;

/** Every non-blank line must be a URL: an HTML page with one link in it is not a sitemap. */
function parseTextSitemap(text: string): TParsedSitemap {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (
    lines.length === 0 ||
    !lines.every((line) => ABSOLUTE_HTTP_URL.test(line))
  )
    return { kind: 'invalid' };
  return { kind: 'urlset', urls: lines, news: false };
}

function parseXmlSitemap(xml: string): TParsedSitemap | null {
  let document: Record<string, unknown>;
  try {
    document = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return null;
  }
  const urlset = document.urlset as { url?: ILocEntry[] } | undefined;
  if (urlset !== undefined) {
    const lastmods = lastmodsOf(urlset?.url);
    return {
      kind: 'urlset',
      urls: locsOf(urlset?.url),
      news: (urlset?.url ?? []).some((entry) => entry.news !== undefined),
      ...(Object.keys(lastmods).length > 0 ? { lastmods } : {}),
    };
  }
  const index = document.sitemapindex as { sitemap?: ILocEntry[] } | undefined;
  if (index !== undefined) {
    return { kind: 'index', sitemaps: locsOf(index?.sitemap) };
  }
  return null;
}

function lastmodsOf(entries: ILocEntry[] | undefined): Record<string, string> {
  const lastmods: Record<string, string> = {};
  for (const { loc, lastmod } of entries ?? []) {
    if (typeof loc !== 'string' || typeof lastmod !== 'string') continue;
    const value = lastmod.trim();
    if (value) lastmods[decodeXmlText(loc)] = value;
  }
  return lastmods;
}

function locsOf(entries: ILocEntry[] | undefined): string[] {
  return (entries ?? [])
    .map(({ loc }) => (typeof loc === 'string' ? decodeXmlText(loc) : ''))
    .filter((loc) => loc.length > 0);
}
