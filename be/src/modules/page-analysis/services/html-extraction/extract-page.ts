import { load, type CheerioAPI } from 'cheerio';
import type {
  IHeading,
  IPageImage,
  IParsedPage,
} from '../../interfaces/parsed-page.interface';

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
const NON_CONTENT = [
  'nav, header, footer, aside, script, style, noscript, form, svg, iframe, template',
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

const LAYOUT_ELEMENTS =
  'div, section, ul, ol, table, tr, figure, br, hr, dl, details, summary';

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
    const text = collapse($(element).text());
    if (text) blocks.push(text);
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
    canonical: canonicalOf($, baseUrl),
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
function mainContent($: CheerioAPI): ReturnType<CheerioAPI> {
  let withHeading: ReturnType<CheerioAPI> | null = null;
  $('article').each((_, element) => {
    const article = $(element);
    if (!withHeading && article.find('h1').length > 0) withHeading = article;
  });
  const candidate =
    withHeading ??
    ($('main').first().length
      ? $('main').first()
      : $('article').first().length
        ? $('article').first()
        : $('body').first());
  const main = candidate.clone();
  main.find(NON_CONTENT).remove();
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

function canonicalOf($: CheerioAPI, baseUrl: string): string | null {
  const href = $('link[rel~="canonical"]').first().attr('href');
  if (!href?.trim()) return null;
  try {
    return new URL(href.trim(), baseUrl).href;
  } catch {
    return null;
  }
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

/** Types and keywords of every JSON-LD node, `@graph` and nested arrays flattened. */
function jsonLdOf($: CheerioAPI): IParsedPage['jsonLd'] {
  const types = new Set<string>();
  const keywords = new Set<string>();
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    for (const type of [record['@type']].flat()) {
      if (typeof type === 'string') types.add(type);
    }
    for (const keyword of keywordsOf(record.keywords)) keywords.add(keyword);
    if (record['@graph'] !== undefined) visit(record['@graph']);
  };
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      visit(JSON.parse($(element).text()));
    } catch {
      // Broken JSON-LD is common and says nothing about the page itself.
    }
  });
  return { types: [...types], keywords: [...keywords] };
}

function keywordsOf(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string'
      ? value.split(',')
      : [];
  return raw.map(collapse).filter(Boolean);
}
