/**
 * Records the two real sites the seed crawls into `sites/` and `manifest.json`, so crawl
 * tests run against what those sites really serve without touching the network.
 *
 *   node be/test/fixtures/record-fixtures.ts
 *
 * Re-run it only to refresh the recordings; the result is committed. Synthetic sites in
 * the manifest (any origin not listed below) are kept as they are.
 *
 * What is trimmed, and why it does not change what the tests exercise:
 * - scripts other than JSON-LD, styles and SVG path data are removed from HTML — the
 *   extractor reads none of them, and they are most of the bytes;
 * - inline SVG keeps only its <title>, and class/style/data attributes are dropped;
 * - every sitemap except the blog ones is cut to its first 20 entries — discovery reads
 *   names and URL paths, which the first entries already show; image and hreflang
 *   annotations are dropped everywhere;
 * - feed items keep their link and title; the full post body they carry is dropped.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

interface IEntry {
  status: number;
  headers?: Record<string, string>;
  file?: string;
  body?: string;
  ttfbMs?: number;
}

interface IManifest {
  entries: Record<string, IEntry>;
  patterns: { pattern: string; synthesize: 'article' }[];
}

interface ISite {
  origin: string;
  dir: string;
  feeds: string[];
  /** The blog sitemaps, kept whole; the first entries of the first one become the posts. */
  blogSitemaps: string[];
  posts: number;
}

const SITES: ISite[] = [
  {
    origin: 'https://www.semrush.com',
    dir: 'semrush',
    feeds: ['/blog/feed/'],
    blogSitemaps: ['https://www.semrush.com/blog/sitemap/'],
    posts: 20,
  },
  {
    origin: 'https://yoast.com',
    dir: 'yoast',
    feeds: ['/feed/'],
    blogSitemaps: [
      'https://yoast.com/post-sitemap.xml',
      'https://yoast.com/post-sitemap2.xml',
    ],
    posts: 22,
  },
];

const ROOT = dirname(resolve(process.argv[1]));
const USER_AGENT =
  'SeoKeywordTrackerBot/1.0 (+https://github.com/trino27/keyword-tracker)';
const KEPT_HEADERS = [
  'content-type',
  'location',
  'x-robots-tag',
  'retry-after',
];
const MAX_SITEMAP_FETCHES = 50;
const TRIMMED_SITEMAP_ENTRIES = 20;

const siteKey = (url: string) =>
  new URL(url).hostname.toLowerCase().replace(/^www\./, '');

async function main(): Promise<void> {
  const manifestPath = join(ROOT, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as IManifest;
  const recordedKeys = new Set(SITES.map((site) => siteKey(site.origin)));
  for (const url of Object.keys(manifest.entries)) {
    if (recordedKeys.has(siteKey(url))) delete manifest.entries[url];
  }

  for (const site of SITES) {
    console.log(`recording ${site.origin}`);
    const record = (url: string, transform?: (text: string) => string) =>
      recordUrl(manifest, site, url, transform);

    const robots = await record(`${site.origin}/robots.txt`);
    const home = await record(`${site.origin}/`, stripHtml);
    for (const feed of site.feeds)
      await record(`${site.origin}${feed}`, slimFeed);
    for (const href of alternateFeeds(home, site.origin))
      await record(href, slimFeed);

    const queue = sitemapLines(robots).filter(
      (url) => siteKey(url) === siteKey(site.origin),
    );
    let fetches = 0;
    let blogUrls: string[] = [];
    while (queue.length > 0 && fetches < MAX_SITEMAP_FETCHES) {
      const url = queue.shift()!;
      fetches += 1;
      const isBlog = site.blogSitemaps.includes(url);
      const text = await record(url, isBlog ? slimSitemap : trimSitemap);
      const locs = locsOf(text);
      if (/<sitemapindex/i.test(text)) {
        queue.push(
          ...locs.filter((loc) => siteKey(loc) === siteKey(site.origin)),
        );
      } else if (url === site.blogSitemaps[0]) {
        blogUrls = locs;
      }
    }

    for (const url of blogUrls.slice(0, site.posts))
      await record(url, stripHtml);
  }

  manifest.entries = Object.fromEntries(
    Object.entries(manifest.entries).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('manifest written');
}

/** Records the URL and every redirect hop after it; returns the final body as text. */
async function recordUrl(
  manifest: IManifest,
  site: ISite,
  start: string,
  transform?: (text: string) => string,
): Promise<string> {
  let url = start;
  for (let hop = 0; hop <= 5; hop += 1) {
    if (manifest.entries[url]?.status === 200 && manifest.entries[url].file) {
      return readFileSync(
        join(ROOT, 'sites', manifest.entries[url].file!),
        'utf8',
      );
    }
    const startedAt = performance.now();
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': USER_AGENT },
    });
    const ttfbMs = Math.round(performance.now() - startedAt);
    const headers: Record<string, string> = {};
    for (const name of KEPT_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers[name] = value;
    }
    const raw = await response.text();
    console.log(`  ${response.status} ${url}`);
    const location = headers.location;
    if (response.status >= 300 && response.status < 400 && location) {
      manifest.entries[url] = { status: response.status, headers, ttfbMs };
      url = new URL(location, url).href;
      continue;
    }
    if (response.status !== 200) {
      manifest.entries[url] = { status: response.status, headers, ttfbMs };
      return '';
    }
    const text = transform ? transform(raw) : raw;
    const file = `${site.dir}/${fileNameOf(url, headers['content-type'] ?? '')}`;
    mkdirSync(dirname(join(ROOT, 'sites', file)), { recursive: true });
    writeFileSync(join(ROOT, 'sites', file), text);
    manifest.entries[url] = { status: 200, headers, ttfbMs, file };
    return text;
  }
  throw new Error(`Too many redirects from ${start}`);
}

function fileNameOf(url: string, contentType: string): string {
  const path = new URL(url).pathname.replace(/^\/+/, '');
  const extension = contentType.includes('html')
    ? '.html'
    : contentType.includes('xml')
      ? '.xml'
      : '.txt';
  if (path === '' || path.endsWith('/')) return `${path}index${extension}`;
  return /\.[a-z0-9]+$/i.test(path) ? path : `${path}${extension}`;
}

function sitemapLines(robots: string): string[] {
  return robots
    .split(/\r?\n/)
    .map((line) => /^\s*sitemap:\s*(\S+)/i.exec(line)?.[1])
    .filter((url): url is string => Boolean(url));
}

function locsOf(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) =>
    match[1].replace(/&amp;/g, '&'),
  );
}

function alternateFeeds(html: string, origin: string): string[] {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => /rel=["']?alternate/i.test(tag))
    .filter((tag) => /type=["']?application\/(rss|atom)\+xml/i.test(tag))
    .map((tag) => /href=["']([^"']+)["']/i.exec(tag)?.[1])
    .filter((href): href is string => Boolean(href))
    .map((href) => new URL(href, origin).href)
    .filter((href) => siteKey(href) === siteKey(origin));
}

function slimSitemap(xml: string): string {
  return xml
    .replace(/<image:image>[\s\S]*?<\/image:image>/gi, '')
    .replace(/<xhtml:link\b[^>]*\/>/gi, '')
    .replace(/\n\s*\n+/g, '\n');
}

function slimFeed(xml: string): string {
  return xml
    .replace(/<content:encoded>[\s\S]*?<\/content:encoded>/gi, '')
    .replace(/<description>[\s\S]*?<\/description>/gi, '')
    .replace(/\n\s*\n+/g, '\n');
}

function trimSitemap(raw: string): string {
  const xml = slimSitemap(raw);
  const entries = [...xml.matchAll(/<url>[\s\S]*?<\/url>/gi)];
  if (entries.length <= TRIMMED_SITEMAP_ENTRIES) return xml;
  const cut = entries[TRIMMED_SITEMAP_ENTRIES].index;
  const close = xml.lastIndexOf('</urlset>');
  return `${xml.slice(0, cut)}${xml.slice(close)}`;
}

function stripHtml(html: string): string {
  return html
    .replace(
      /<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi,
      '',
    )
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(
      /<link\b[^>]*rel=["']?(?:preload|prefetch|modulepreload)[^>]*>/gi,
      '',
    )
    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi, (_svg, inner: string) => {
      const title = /<title>[\s\S]*?<\/title>/i.exec(inner)?.[0] ?? '';
      return `<svg>${title}</svg>`;
    })
    .replace(/\s(?:class|style|data-[\w-]+)="[^"]*"/g, '')
    .replace(/\n\s*\n+/g, '\n');
}

void main();
