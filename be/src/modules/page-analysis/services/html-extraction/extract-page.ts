import { load, type CheerioAPI } from 'cheerio';
import { ARTICLE_TYPES } from '../../constants/article-types.constant';
import type {
  IAlternateLink,
  IHeading,
  IPageImage,
  IParsedPage,
} from '../../interfaces/parsed-page.interface';
import { parseJsonLd } from './parse-json-ld';

/**
 * Removed from the main content before anything is read from it.
 *
 * The element names are the easy half. The rest is the furniture a theme builds out
 * of plain `div`s inside the content container — related posts, "most popular", a
 * share bar, a newsletter box. Landmark ROLES catch what semantic elements would have
 * caught on a site that used them; the class fragments catch the rest, and every one
 * of them is here because a live page put it in a page's keywords: travelsmart.bg's
 * `ast-single-related-posts-container` put other destinations in every post, and
 * globalnews.ca's `c-infoBox` put other headlines in every story. Matching is
 * case-insensitive, so `infoBox` and `relatedPosts` are caught as written.
 */
const NEVER_CONTENT = 'script, style, noscript, svg, iframe, template';

const NON_CONTENT = [
  'nav, header, footer, aside, form',
  '[role="navigation"], [role="complementary"], [role="banner"]',
  '[role="contentinfo"], [role="search"], [role="dialog"]',
  '[class*="related" i], [class*="infobox" i], [class*="sidebar" i]',
  '[class*="widget" i], [class*="newsletter" i], [class*="subscribe" i]',
  '[class*="share" i], [class*="social" i], [class*="breadcrumb" i]',
  '[class*="pagination" i], [class*="recirc" i], [class*="read-more" i]',
  '[class*="popular" i], [class*="trending" i], [class*="recommend" i]',
  '[class*="comment" i], [id*="comment" i]',
].join(', ');

/**
 * Share of the main content a match above may take before it is read as the content
 * itself rather than the furniture around it.
 *
 * The fragments match anywhere in a class name, which is what lets them catch
 * `relatedPosts` and `c-infoBox` as written — and what made ratehub.ca's article
 * vanish. Its content container is `<div class="content-layout ... with-sidebar">`:
 * the modifier naming the LAYOUT contains the word for the thing beside it, and
 * removing it took 1,899 of the page's 1,999 words, leaving a 3,000-word guide
 * stored as empty and keywordless. Furniture is small next to the article it sits
 * beside; a node holding most of the page is the page.
 */
const FURNITURE_MAX_SHARE = 0.5;

/**
 * Share of the page an `<article>` must hold before it is read as the post rather
 * than as a card listing one. See `mainContent`.
 */
const ARTICLE_MIN_SHARE = 0.3;

/**
 * Text present only for assistive technology, or hidden from it; neither is page content.
 * A copy-link control inside a heading made "Copy link to headingAgentic infrastructure"
 * on vercel.com — practices/search-engines/references/field-study-2026-10.md, finding 7.
 */
const HIDDEN_TEXT =
  '[aria-hidden="true"], [hidden], .sr-only, .visually-hidden, .visuallyhidden, ' +
  '.screen-reader-text, .screen-reader-only, .a11y-hidden';

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

/** A control is chrome, not heading text. Scoped to headings: in body copy a button's
 *  label is sometimes the only word a paragraph has. */
const HEADING_CONTROLS = 'button, [role="button"]';

const BLOCK_ELEMENTS = `${HEADINGS}, p, li, td, th, blockquote, dd, dt, figcaption, pre`;
/** Headings are collected as headings; `blocks` is the prose around them. */
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

const LAYOUT_ELEMENTS =
  'div, section, ul, ol, table, tr, figure, br, hr, dl, details, summary';

/**
 * Every attribute by which a document fetches a subresource. `srcset` and `data-src` are
 * here because a lazy-loading theme puts the real image in one of them and a 1x1
 * placeholder in `src`; reading `src` alone would call a page clean whose every
 * illustration arrives over plain HTTP.
 */
const RESOURCE_ATTRIBUTES: readonly [string, string][] = [
  ['img[src]', 'src'],
  ['img[srcset], source[srcset]', 'srcset'],
  ['img[data-src]', 'data-src'],
  ['script[src]', 'src'],
  ['link[rel~="stylesheet"][href]', 'href'],
  ['iframe[src], frame[src], embed[src]', 'src'],
  ['video[src], audio[src], source[src], track[src]', 'src'],
  ['object[data]', 'data'],
];

const WORD = /[\p{L}\p{N}]/u;

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();
const orNull = (text: string | undefined) => {
  const collapsed = collapse(text ?? '');
  return collapsed.length > 0 ? collapsed : null;
};

/**
 * Reads the fields a page is judged by. A crawled page is the most untrusted input the
 * system has: everything here tolerates missing or malformed markup and never throws.
 */
export function extractPage(html: string, baseUrl: string): IParsedPage {
  const $ = load(html);
  // Before anything is read, and on the whole document, because h1s are read outside the
  // main content: strip what no reader sees, and the controls sitting inside headings.
  $(HIDDEN_TEXT).remove();
  $(HEADINGS).find(HEADING_CONTROLS).remove();

  const main = mainContent($);
  // `.text()` concatenates siblings: "Title</h1><p>One" would read as "TitleOne". This runs
  // BEFORE anything is collected, or the headings and blocks never see the separators and
  // only the whole-page word count benefits. Collapsing afterwards removes the doubled
  // spaces, so nothing else moves.
  main
    .find(`${BLOCK_ELEMENTS}, ${LAYOUT_ELEMENTS}, button, label, a`)
    .after(' ');

  const headings: IHeading[] = [];
  main.find(HEADINGS).each((_, element) => {
    const text = collapse($(element).text());
    if (text)
      headings.push({
        level: Number(element.tagName.slice(1)) as IHeading['level'],
        text,
      });
  });

  const blocks: string[] = [];
  main.find(BLOCK_ELEMENTS).each((_, element) => {
    // A block that contains blocks is read through its children instead.
    if ($(element).find(BLOCK_ELEMENTS).length > 0) return;
    // A heading is already a field of its own, and counting it here as well paid it
    // twice: a listicle's h2 scored its subheading weight AND a body frequency it
    // never earned in prose, which is how "start this week" and "add specific
    // statistics" became keywords. With a table of contents repeating every heading
    // as an `li`, the same phrase was paid three times.
    if (HEADING_TAGS.has(element.tagName)) return;
    const text = collapse($(element).text());
    if (text) blocks.push(text);
  });
  const links: string[] = [];
  main.find('a[href]').each((_, element) => {
    const href = absolute($(element).attr('href'), baseUrl);
    if (href) links.push(href);
  });

  const mainText = collapse(main.text());
  if (blocks.length === 0 && mainText) blocks.push(mainText);

  const images: IPageImage[] = [];
  main.find('img').each((_, element) => {
    const image = $(element);
    images.push({
      src: image.attr('src') ?? null,
      alt: image.attr('alt') ?? null,
    });
  });

  return {
    title: orNull($('head > title').first().text()),
    metaDescription: orNull(metaContent($, 'name', 'description')),
    metaRobots: orNull(metaContent($, 'name', 'robots')),
    metaRefresh: orNull(httpEquivContent($, 'refresh')),
    viewport: orNull(metaContent($, 'name', 'viewport')),
    canonical: canonicalOf($, baseUrl),
    alternates: alternatesOf($, baseUrl),
    openGraph: openGraphOf($),
    articleTags: $('meta[property="article:tag"]')
      .map((_, element) => collapse($(element).attr('content') ?? ''))
      .get()
      .filter(Boolean),
    jsonLd: jsonLdOf($),
    lang: orNull($('html').attr('lang')),
    h1s: $('body h1')
      .map((_, element) => collapse($(element).text()))
      .get()
      .filter(Boolean),
    headings,
    firstParagraph:
      main
        .find('p')
        .map((_, element) => collapse($(element).text()))
        .get()
        .find((text) => text.length > 0) ?? null,
    images,
    resourceUrls: resourceUrlsOf($, baseUrl),
    links,
    blocks,
    wordCount: mainText.split(' ').filter((token) => WORD.test(token)).length,
  };
}

/**
 * The container the page's own text lives in.
 *
 * The `article` holding the `h1` wins over `main`, because that is the narrower and
 * more certain answer: a theme's `main` routinely holds the post AND what follows it.
 * travelsmart.bg closes `</article>` and opens a related-posts container as its
 * sibling, so reading `main` read both, and other destinations became the post's
 * keywords. An `article` WITHOUT the heading is not trusted — in a listing every card
 * is one — and the old order is kept for that case.
 */
const wordsIn = ($: CheerioAPI, node: ReturnType<CheerioAPI>) =>
  $(node).text().split(/\s+/).filter(Boolean).length;

function mainContent($: CheerioAPI): ReturnType<CheerioAPI> {
  const mainEl = $('main').first();
  const whole = mainEl.length ? mainEl : $('body').first();
  const wholeWords = wordsIn($, whole);

  let withHeading: ReturnType<CheerioAPI> | null = null;
  $('article').each((_, element) => {
    const article = $(element);
    if (withHeading || article.find('h1').length === 0) return;
    // A related-post card is an <article> with an <h1> in it too, and on
    // canadiangeographic.ca the post itself is not in an <article> at all: the first
    // one on the page is the first card, and reading it gave a 2,555-word feature a
    // word count of 30. The post is most of what the page holds; a card is a sliver.
    if (wholeWords > 0 && wordsIn($, article) < wholeWords * ARTICLE_MIN_SHARE)
      return;
    withHeading = article;
  });
  const candidate =
    withHeading ??
    (mainEl.length
      ? mainEl
      : $('article').first().length
        ? $('article').first()
        : $('body').first());
  const main = candidate.clone();
  main.find(NEVER_CONTENT).remove();
  const total = wordsIn($, main);
  // Document order, so a wrapper is judged before what it wraps: keeping a wrapper
  // still lets the furniture inside it be removed on its own terms.
  main.find(NON_CONTENT).each((_, element) => {
    const node = $(element);
    if (total > 0 && wordsIn($, node) > total * FURNITURE_MAX_SHARE) return;
    node.remove();
  });
  return main;
}

function metaContent(
  $: CheerioAPI,
  attribute: 'name' | 'property',
  value: string,
): string | undefined {
  let content: string | undefined;
  $(`meta[${attribute}]`).each((_, element) => {
    if (content !== undefined) return;
    if (($(element).attr(attribute) ?? '').toLowerCase() === value)
      content = $(element).attr('content');
  });
  return content;
}

/** A URL as a browser would resolve it, or null where there is nothing resolvable. */
function absolute(value: string | undefined, baseUrl: string): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return null;
  }
}

function canonicalOf($: CheerioAPI, baseUrl: string): string | null {
  return absolute($('link[rel~="canonical"]').first().attr('href'), baseUrl);
}

/** `http-equiv` is matched case-insensitively: `HTTP-EQUIV="Refresh"` is the same tag. */
function httpEquivContent($: CheerioAPI, value: string): string | undefined {
  let content: string | undefined;
  $('meta[http-equiv]').each((_, element) => {
    if (content !== undefined) return;
    if (($(element).attr('http-equiv') ?? '').toLowerCase() === value)
      content = $(element).attr('content');
  });
  return content;
}

/**
 * Alternates keep their order and their duplicates. A page naming `en-US` twice with two
 * different URLs has a defect the check is there to report, and de-duplicating here would
 * hide it before the check ever saw it.
 */
function alternatesOf($: CheerioAPI, baseUrl: string): IAlternateLink[] {
  const alternates: IAlternateLink[] = [];
  $('link[rel~="alternate"][hreflang]').each((_, element) => {
    const lang = collapse($(element).attr('hreflang') ?? '');
    const href = absolute($(element).attr('href'), baseUrl);
    if (lang && href) alternates.push({ lang, href });
  });
  return alternates;
}

/**
 * Every subresource URL the document names, de-duplicated. A `srcset` is a comma-separated
 * list of candidates with descriptors ("a.png 1x, b.png 2x"), so each candidate's first
 * token is the URL.
 */
function resourceUrlsOf($: CheerioAPI, baseUrl: string): string[] {
  const urls = new Set<string>();
  const add = (value: string | undefined) => {
    const url = absolute(value, baseUrl);
    if (url) urls.add(url);
  };
  for (const [selector, attribute] of RESOURCE_ATTRIBUTES) {
    $(selector).each((_, element) => {
      const value = $(element).attr(attribute);
      if (attribute !== 'srcset') {
        add(value);
        return;
      }
      for (const candidate of (value ?? '').split(','))
        add(candidate.trim().split(/\s+/)[0]);
    });
  }
  return [...urls];
}

function openGraphOf($: CheerioAPI): Record<string, string> {
  const properties: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, element) => {
    const name = $(element).attr('property')!.toLowerCase();
    const content = collapse($(element).attr('content') ?? '');
    if (content && !(name in properties)) properties[name] = content;
  });
  return properties;
}

/**
 * Types and keywords of every JSON-LD node, `@graph` and nested arrays flattened, plus
 * the property names of the nodes that are articles.
 *
 * A property counts only when it carries something: WordPress emits `"author": ""` and
 * `"image": []` for fields nobody filled in, and treating a present-but-empty key as the
 * field being there would pass every page a CMS half-populated.
 */
function jsonLdOf($: CheerioAPI): IParsedPage['jsonLd'] {
  const types = new Set<string>();
  const keywords = new Set<string>();
  const articleFields = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    const nodeTypes = [record['@type']].flat();
    for (const type of nodeTypes) {
      if (typeof type === 'string') types.add(type);
    }
    if (
      nodeTypes.some(
        (type) => typeof type === 'string' && ARTICLE_TYPES.has(type),
      )
    )
      for (const [field, value] of Object.entries(record)) {
        if (!field.startsWith('@') && isPresent(value))
          articleFields.add(field);
      }
    for (const keyword of keywordsOf(record.keywords)) keywords.add(keyword);
    if (record['@graph'] !== undefined) visit(record['@graph']);
  };
  // Broken JSON-LD is common and says nothing about the page itself: a block that is
  // not JSON is `undefined`, which `visit` ignores.
  $('script[type="application/ld+json"]').each((_, element) => {
    visit(parseJsonLd($(element).text()));
  });
  return {
    types: [...types],
    keywords: [...keywords],
    articleFields: [...articleFields],
  };
}

/** A JSON-LD value that actually says something: not null, not '', not []. */
function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(isPresent);
  return true;
}

function keywordsOf(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return raw.map(collapse).filter(Boolean);
}
