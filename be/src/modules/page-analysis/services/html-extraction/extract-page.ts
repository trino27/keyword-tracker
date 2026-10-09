import { createHash } from 'node:crypto';
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

/**
 * The scripts and stylesheets a renderer needs. Images are not here: a page without its
 * images still renders, and robots.txt rules over an image folder are a site's own call.
 */
const RENDER_RESOURCE_ATTRIBUTES: readonly [string, string][] = [
  ['script[src]', 'src'],
  ['link[rel~="stylesheet" i][href]', 'href'],
];

/**
 * The mount points the common JavaScript frameworks render into. Found EMPTY, they say
 * the HTML is a shell the browser fills in — React, Vue, Next, Nuxt, Gatsby, Angular.
 */
const APP_MOUNT_POINTS =
  '#root, #app, #__next, #__nuxt, #___gatsby, app-root, [data-reactroot]';

const LINK_SCHEMES = new Set(['http:', 'https:']);

/** How much of an uncrawlable link's markup is kept to quote it. */
const MARKUP_QUOTE_MAX = 200;

/**
 * Where a link's accessible name is parked while the hidden text that may be part of it
 * is still in the document. Stripped again before any markup is quoted.
 */
const NAME_ATTRIBUTE = 'data-seo-accessible-name';

/** Which entry of the links' markup-as-written a link is, for the same reason. */
const INDEX_ATTRIBUTE = 'data-seo-link-index';

/** A meta element that declares the encoding, in either of its two forms. */
const CHARSET_DECLARATION =
  /<meta\b[^>]*?(?:\bcharset\s*=|http-equiv\s*=\s*["']?content-type)[^>]*>/i;

/** A selection, as cheerio returns one. */
type TSelection = ReturnType<CheerioAPI>;

/** A URL that names its scheme; anything else is resolved against the page. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

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
export function extractPage(html: string, pageUrl: string): IParsedPage {
  const $ = load(html);
  // Before anything is resolved: a relative href means what it means against `<base>`,
  // exactly as a browser and Googlebot read it, and a page whose `<base>` is wrong has
  // every relative link pointing somewhere else — the reader must see THAT, not the
  // links the author meant.
  const baseUrl = baseOf($, pageUrl);
  const clientRendered = looksClientRendered($);
  // Before anything is read, and on the whole document, because h1s are read outside the
  // main content: strip what no reader sees, and the controls sitting inside headings.
  // A link's name may be text only a screen reader sees ("Read more<span
  // class="visually-hidden"> about INP</span>"), so it is read before that text goes.
  // Its markup is kept as written too, because a finding quotes what the author can find
  // in the source — not what is left once aria-hidden elements are removed.
  const linkMarkup: string[] = [];
  $('a[href]').each((index, element) => {
    linkMarkup.push(quoteMarkup($, $(element)));
    $(element)
      .attr(NAME_ATTRIBUTE, accessibleNameOf($, $(element)))
      .attr(INDEX_ATTRIBUTE, String(index));
  });
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
  const nofollowLinks: string[] = [];
  const uncrawlableLinks: string[] = [];
  const unnamedLinks: IParsedPage['unnamedLinks'] = [];
  main.find('a').each((_, element) => {
    const anchor = $(element);
    const raw = anchor.attr('href');
    // The markup as written is the evidence: the reader searches the page source for it.
    const label = () => quoteMarkup($, anchor);
    if (raw === undefined) {
      // `<a name>` is a target, not a link; an `<a>` that navigates by script is a link
      // nobody but a clicking reader can follow. A role of button says it is a control.
      if (
        anchor.attr('onclick') !== undefined &&
        anchor.attr('role') !== 'button'
      )
        uncrawlableLinks.push(label());
      return;
    }
    // A script call, or a client-side route in this site's fragment ("#/pricing",
    // "#!pricing"): Google drops everything after #, so the latter leads back to the
    // page it sits on. Another site's hashbang URL is that site's routing, not a link
    // this page failed to write, and is read as an ordinary link.
    if (
      /^\s*javascript:/i.test(raw) ||
      (/#[!/]/.test(raw) && sameHostAs(absolute(raw, baseUrl), pageUrl))
    ) {
      uncrawlableLinks.push(label());
      return;
    }
    const href = absolute(raw, baseUrl);
    // mailto:, tel: and the like name no page; they are neither internal nor outbound.
    if (!href || !LINK_SCHEMES.has(new URL(href).protocol)) return;
    links.push(href);
    if (relTokens(anchor.attr('rel')).includes('nofollow'))
      nofollowLinks.push(href);
    if (anchor.attr(NAME_ATTRIBUTE) === '')
      unnamedLinks.push({
        href,
        markup: linkMarkup[Number(anchor.attr(INDEX_ATTRIBUTE))] ?? label(),
      });
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

  const canonicals = canonicalsOf($, 'head', baseUrl);
  const { jsonLd, jsonLdErrors, authors, dates } = structuredDataOf($);

  return {
    title: orNull($('head > title').first().text()),
    metaDescription: orNull(metaContent($, 'name', 'description')),
    metaRobots: orNull(metaContent($, 'name', 'robots')),
    metaGooglebot: orNull(metaContent($, 'name', 'googlebot')),
    metaRefresh: orNull(httpEquivContent($, 'refresh')),
    viewport: orNull(metaContent($, 'name', 'viewport')),
    canonicals,
    canonicalsOutsideHead: canonicalsOf($, 'body', baseUrl),
    relativeCanonicals: $('head link[rel~="canonical" i][href]')
      .map((_, element) => collapse($(element).attr('href') ?? ''))
      .get()
      .filter((href) => href && !HAS_SCHEME.test(href)),
    alternates: alternatesOf($, baseUrl),
    openGraph: openGraphOf($),
    articleTags: $('meta[property="article:tag"]')
      .map((_, element) => collapse($(element).attr('content') ?? ''))
      .get()
      .filter(Boolean),
    jsonLd,
    jsonLdErrors,
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
    resourceUrls: urlsOf($, RESOURCE_ATTRIBUTES, baseUrl),
    links,
    nofollowLinks,
    uncrawlableLinks,
    unnamedLinks,
    renderResources: urlsOf($, RENDER_RESOURCE_ATTRIBUTES, baseUrl),
    clientRendered,
    blocks,
    wordCount: mainText.split(' ').filter((token) => WORD.test(token)).length,
    authors: [...authors, ...authorsInMarkup($, baseUrl)],
    datePublished:
      dates.published ??
      orNull(metaContent($, 'property', 'article:published_time')),
    dateModified:
      dates.modified ??
      orNull(metaContent($, 'property', 'article:modified_time')),
    contentHash: createHash('sha256').update(mainText).digest('hex'),
    charsetDeclarationEnd: charsetDeclarationEndOf(html),
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

/**
 * The document's base URL: the first `<base href>`, resolved against the page, when it
 * names a web address; the page itself otherwise.
 */
function baseOf($: CheerioAPI, pageUrl: string): string {
  const base = absolute($('base[href]').first().attr('href'), pageUrl);
  return base && LINK_SCHEMES.has(new URL(base).protocol) ? base : pageUrl;
}

/**
 * Distinct canonicals in one part of the document, in order. Google reads a canonical
 * only in `<head>`, so the two parts are read separately: the head's are the page's
 * canonical, the body's are a mistake to report. The parser decides where the head ends,
 * as Google's does — an `<img>` written in `<head>` closes it, and every link after it
 * lands in the body.
 */
function canonicalsOf(
  $: CheerioAPI,
  part: 'head' | 'body',
  baseUrl: string,
): string[] {
  const found = new Set<string>();
  $(`${part} link[rel~="canonical" i]`).each((_, element) => {
    const href = absolute($(element).attr('href'), baseUrl);
    if (href) found.add(withoutFragment(href));
  });
  return [...found];
}

/**
 * What a screen reader would announce for a link, in the order the accessible-name rules
 * take: aria-labelledby, aria-label, the content (with each image's alt in place, and
 * nothing marked aria-hidden), then the title attribute — which Google, too, falls back
 * to for an empty link.
 */
function accessibleNameOf($: CheerioAPI, anchor: TSelection): string {
  const labelledBy = (anchor.attr('aria-labelledby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => collapse($(`[id="${id.replace(/"/g, '')}"]`).text()))
    .join(' ');
  if (collapse(labelledBy)) return collapse(labelledBy);
  const label = collapse(anchor.attr('aria-label') ?? '');
  if (label) return label;
  const content = anchor.clone();
  content.find('[aria-hidden="true"]').remove();
  content.find('img').each((_, image) => {
    $(image).replaceWith(` ${$(image).attr('alt') ?? ''} `);
  });
  const text = collapse(content.text());
  if (text) return text;
  return collapse(anchor.attr('title') ?? '');
}

/** An element as written, without the attribute this extractor parks on links. */
function quoteMarkup($: CheerioAPI, element: TSelection): string {
  const clone = element.clone();
  clone.removeAttr(NAME_ATTRIBUTE).removeAttr(INDEX_ATTRIBUTE);
  return collapse($.html(clone)).slice(0, MARKUP_QUOTE_MAX);
}

function charsetDeclarationEndOf(html: string): number | null {
  const match = CHARSET_DECLARATION.exec(html);
  return match
    ? Buffer.byteLength(html.slice(0, match.index + match[0].length))
    : null;
}

/** Same host, the www prefix aside — the product's notion of one site. */
function sameHostAs(url: string | null, pageUrl: string): boolean {
  if (!url) return true;
  const host = (value: string) => new URL(value).hostname.replace(/^www\./, '');
  return host(url) === host(pageUrl);
}

function withoutFragment(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.href;
}

function relTokens(rel: string | undefined): string[] {
  return (rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * An empty framework mount point, or a `<noscript>` asking for JavaScript. Read on the
 * whole document before anything is removed, because the `<noscript>` is the evidence.
 */
function looksClientRendered($: CheerioAPI): boolean {
  const emptyMount = $(APP_MOUNT_POINTS)
    .toArray()
    .some((element) => {
      const node = $(element).clone();
      node.find(NEVER_CONTENT).remove();
      return collapse(node.text()) === '';
    });
  if (emptyMount) return true;
  return $('body noscript')
    .toArray()
    .some((element) => /javascript/i.test($(element).text()));
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
 * Every subresource URL the given selectors name, de-duplicated. A `srcset` is a
 * comma-separated list of candidates with descriptors ("a.png 1x, b.png 2x"), so each
 * candidate's first token is the URL.
 */
function urlsOf(
  $: CheerioAPI,
  attributes: readonly [string, string][],
  baseUrl: string,
): string[] {
  const urls = new Set<string>();
  const add = (value: string | undefined) => {
    const url = absolute(value, baseUrl);
    if (url) urls.add(url);
  };
  for (const [selector, attribute] of attributes) {
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
function structuredDataOf($: CheerioAPI): {
  jsonLd: IParsedPage['jsonLd'];
  jsonLdErrors: string[];
  authors: string[];
  dates: { published: string | null; modified: string | null };
} {
  const types = new Set<string>();
  const keywords = new Set<string>();
  const articleFields = new Set<string>();
  // Authors are often a reference into the graph — `"author": {"@id": "#person"}` — so
  // names are resolved after every block is read, against the nodes that carry an @id.
  const namesById = new Map<string, string>();
  const authorRefs: unknown[] = [];
  const jsonLdErrors: string[] = [];
  const dates = {
    published: null as string | null,
    modified: null as string | null,
  };
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
    if (typeof record['@id'] === 'string' && typeof record.name === 'string')
      namesById.set(record['@id'], collapse(record.name));
    if (
      nodeTypes.some(
        (type) => typeof type === 'string' && ARTICLE_TYPES.has(type),
      )
    ) {
      for (const [field, value] of Object.entries(record)) {
        if (!field.startsWith('@') && isPresent(value))
          articleFields.add(field);
      }
      if (record.author !== undefined) authorRefs.push(record.author);
      dates.published ??= dateOf(record.datePublished);
      dates.modified ??= dateOf(record.dateModified);
    }
    for (const keyword of keywordsOf(record.keywords)) keywords.add(keyword);
    if (record['@graph'] !== undefined) visit(record['@graph']);
  };
  // A block is read as Google reads it — a raw line break inside a string is forgiven
  // (`parseJsonLd`). What is still not JSON reaches Google as nothing, which is a finding,
  // quoted with the strict parser's own words so the author can find the character.
  $('script[type="application/ld+json"]').each((_, element) => {
    const text = $(element).text().trim();
    if (!text) return;
    const value = parseJsonLd(text);
    if (value !== undefined) {
      visit(value);
      return;
    }
    jsonLdErrors.push(
      `${collapse(text).slice(0, 120)}… — ${strictParseError(text)}`,
    );
  });
  const names = new Set<string>();
  const resolve = (author: unknown): void => {
    if (Array.isArray(author)) return author.forEach(resolve);
    if (typeof author === 'string') {
      if (collapse(author)) names.add(collapse(author));
      return;
    }
    if (!author || typeof author !== 'object') return;
    const record = author as Record<string, unknown>;
    const name =
      typeof record.name === 'string'
        ? collapse(record.name)
        : typeof record['@id'] === 'string'
          ? namesById.get(record['@id'])
          : undefined;
    if (name) names.add(name);
  };
  authorRefs.forEach(resolve);
  return {
    jsonLd: {
      types: [...types],
      keywords: [...keywords],
      articleFields: [...articleFields],
    },
    jsonLdErrors,
    authors: [...names].map((name) => `JSON-LD author: ${name}`),
    dates,
  };
}

/** Why strict JSON refuses the text, in the parser's words: they name the position. */
function strictParseError(text: string): string {
  try {
    JSON.parse(text);
    return 'not JSON';
  } catch (error) {
    return error instanceof Error ? error.message : 'not JSON';
  }
}

function dateOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * The author as the HTML itself names it: `<meta name="author">`, a `rel="author"` link,
 * or an element marked `itemprop="author"`. Each quoted as written.
 */
function authorsInMarkup($: CheerioAPI, baseUrl: string): string[] {
  const found: string[] = [];
  const meta = orNull(metaContent($, 'name', 'author'));
  if (meta) found.push(`<meta name="author" content="${meta}">`);
  $('a[rel~="author" i][href], link[rel~="author" i][href]').each(
    (_, element) => {
      const href = absolute($(element).attr('href'), baseUrl);
      if (href) found.push(`<${element.tagName} rel="author" href="${href}">`);
    },
  );
  $('[itemprop~="author"]').each((_, element) => {
    const name =
      collapse($(element).find('[itemprop~="name"]').first().text()) ||
      collapse($(element).text());
    if (name && name.length <= 100) found.push(`itemprop="author": ${name}`);
  });
  return [...new Set(found)];
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
