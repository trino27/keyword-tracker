import { createHash } from 'node:crypto';
import { siteKeyOf } from '@app/contracts';
import { load, type CheerioAPI } from 'cheerio';
import { ARTICLE_TYPES } from '../../constants/article-types.constant';
import type {
  IAlternateLink,
  IArticleMarkup,
  IHeading,
  IIconLink,
  IPageImage,
  IParsedPage,
} from '../../interfaces/parsed-page.interface';
import { parseJsonLd } from './parse-json-ld';
import { readMicrodata } from './read-microdata';
import {
  authorsOf,
  breadcrumbItemsOf,
  imagesOf,
  logosOf,
  typesOf,
  websiteNameOf,
  type TNode,
} from './structured-data-nodes';

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

/**
 * What a frame leaves behind in the main content. A frame is never text, so it is removed
 * with the rest of NEVER_CONTENT — but it is a demo or a player the reader sees, so it
 * leaves this empty marker, counted as an embed once the furniture around it is gone.
 */
const FRAME_MARKER = 'seo-frame';

/** What shows the reader something other than text and pictures: a demo, a player, a chart. */
const EMBED_SELECTOR = `${FRAME_MARKER}, video, embed, object`;

/**
 * A `javascript:` URL that does nothing — the link is a control whose click a script
 * handles elsewhere, the "Войти" and "Добавить" buttons of cossa.ru. Leads to no page.
 */
const DO_NOTHING_SCRIPT =
  /^\s*javascript:\s*(void\s*\(?\s*0\s*\)?|return\s+false|undefined)?\s*;?\s*$/i;

/**
 * An `onclick` that goes somewhere: it names a location, an address or a path —
 * `go('/three/')`, `location.href = …`. `chatToggleConnect()` on scripting.com names
 * none, and opens a chat, not a page.
 */
const NAVIGATING_SCRIPT =
  /location|href|window\.open|navigate|['"`](\/|https?:)/i;

/** Fragment routes that open a widget, not a page: Ghost's membership portal. */
const WIDGET_FRAGMENT = /#\/portal(?:\/|$)/;

/** How much of an uncrawlable link's markup is kept to quote it. */
const MARKUP_QUOTE_MAX = 200;

/**
 * Where a link's accessible name is parked while the hidden text that may be part of it
 * is still in the document. Stripped again before any markup is quoted.
 */
const NAME_ATTRIBUTE = 'data-seo-accessible-name';

/** Which entry of the links' markup-as-written a link is, for the same reason. */
const INDEX_ATTRIBUTE = 'data-seo-link-index';

/**
 * A meta element that declares the encoding, in either of its two forms — `<meta
 * charset>` or an http-equiv Content-Type whose content names a charset. Both carry
 * `charset=`; an http-equiv that names no charset declares no encoding.
 */
const CHARSET_DECLARATION = /<meta\b[^>]*?\bcharset\s*=[^>]*>/i;

/** A selection, as cheerio returns one. */
type TSelection = ReturnType<CheerioAPI>;

/** A URL that names its scheme; anything else is resolved against the page. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

const WORD = /[\p{L}\p{N}]/u;

/** Scripts written without spaces between words: Chinese and Japanese. */
const UNSPACED_SCRIPT =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const WORD_SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'word' });

/**
 * Words in the text. A space separates them in most scripts; Chinese and Japanese put
 * none, so a run of them is split as ICU's dictionaries split it — blog.cloudflare.com's
 * Japanese post was 176 "words", every sentence one, and reported as thin.
 */
function countWords(text: string): number {
  let count = 0;
  for (const token of text.split(' ')) {
    if (!WORD.test(token)) continue;
    if (!UNSPACED_SCRIPT.test(token)) count += 1;
    else
      for (const segment of WORD_SEGMENTER.segment(token))
        if (segment.isWordLike) count += 1;
  }
  return count;
}

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
  const elementCount = $('body *').length;
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

  const blocks = blocksOf($, main);
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
        NAVIGATING_SCRIPT.test(anchor.attr('onclick') ?? '') &&
        anchor.attr('role') !== 'button'
      )
        uncrawlableLinks.push(label());
      return;
    }
    // A script call, or a client-side route in this site's fragment ("#/pricing",
    // "#!pricing"): Google drops everything after #, so the latter leads back to the
    // page it sits on. Another site's hashbang URL is that site's routing, not a link
    // this page failed to write, and is read as an ordinary link.
    // A control marked as one (`role="button"`) or a fragment that opens a widget
    // (`#/portal/signup`, Ghost's membership dialog, on ghost.org) leads to no page,
    // and nothing is hidden behind it.
    if (
      (/^\s*javascript:/i.test(raw) && !DO_NOTHING_SCRIPT.test(raw)) ||
      (/#[!/][^\s]/.test(raw) &&
        !WIDGET_FRAGMENT.test(raw) &&
        sameHostAs(absolute(raw, baseUrl), pageUrl))
    ) {
      if (anchor.attr('role') !== 'button') uncrawlableLinks.push(label());
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
  (postArticleIn($, main) ?? main).find('img').each((_, element) => {
    const image = $(element);
    images.push({
      src: image.attr('src') ?? null,
      srcset: orNull(image.attr('srcset')),
      alt: image.attr('alt') ?? null,
      loading: image.attr('loading')?.trim().toLowerCase() || null,
      sized: isSized(image),
      markup: quoteMarkup($, image),
    });
  });

  const canonicals = canonicalsOf($, 'head', baseUrl);
  const openGraph = openGraphOf($);
  const structured = structuredDataOf($, baseUrl);
  const scriptedSchemaTypes = scriptedSchemaTypesOf($);
  const { jsonLd, jsonLdErrors, authors, dates } = structured;
  const microdata = readMicrodata($, baseUrl);
  const wordCount = countWords(mainText);

  return {
    title: orNull($('head > title').first().text()),
    metaDescription: orNull(metaContent($, 'name', 'description', 'head')),
    metaDescriptionGap: metaDescriptionGapOf($),
    metaRobots: metaContents($, 'robots'),
    metaGooglebot: metaContents($, 'googlebot'),
    metaRefresh: orNull(httpEquivContent($, 'refresh')),
    metaContentSecurityPolicy: orNull(
      httpEquivContent($, 'content-security-policy'),
    ),
    viewport: orNull(metaContent($, 'name', 'viewport')),
    canonicals,
    canonicalsOutsideHead: canonicalsOf($, 'body', baseUrl),
    relativeCanonicals: $('head link[rel~="canonical" i][href]')
      .map((_, element) => collapse($(element).attr('href') ?? ''))
      .get()
      .filter((href) => href && !HAS_SCHEME.test(href)),
    alternates: alternatesOf($, 'head', baseUrl),
    alternatesOutsideHead: alternatesOf($, 'body', baseUrl),
    openGraph,
    shareImage: shareImageOf(openGraph),
    articleTags: $('meta[property="article:tag"]')
      .map((_, element) => collapse($(element).attr('content') ?? ''))
      .get()
      .filter(Boolean),
    jsonLd,
    jsonLdErrors,
    scriptedSchemaTypes,
    microdata: {
      types: microdata.types,
      articleFields: microdata.articleFields,
    },
    articleMarkup: structured.article ?? microdata.article,
    breadcrumbs: structured.breadcrumbs,
    logos: structured.logos,
    websiteNames: [...structured.websiteNames, ...microdata.websiteNames],
    icons: iconsOf($, baseUrl),
    videos: videosOf($),
    contentNosnippet: contentNosnippetOf($, wordCount),
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
    embeds: main.find(EMBED_SELECTOR).length,
    resourceUrls: urlsOf($, RESOURCE_ATTRIBUTES, baseUrl),
    links,
    nofollowLinks,
    uncrawlableLinks,
    unnamedLinks,
    renderResources: urlsOf($, RENDER_RESOURCE_ATTRIBUTES, baseUrl),
    clientRendered,
    blocks,
    wordCount,
    authors: [...authors, ...authorsInMarkup($, baseUrl)],
    datePublished:
      dates.published ??
      orNull(metaContent($, 'property', 'article:published_time')) ??
      microdata.article?.datePublished ??
      null,
    dateModified:
      dates.modified ??
      orNull(metaContent($, 'property', 'article:modified_time')) ??
      microdata.article?.dateModified ??
      null,
    contentHash: createHash('sha256').update(mainText).digest('hex'),
    charsetDeclarationEnd: charsetDeclarationEndOf(html),
    renderBlockingScripts: $('head script[src]')
      .filter((_, element) => isParserBlocking($(element)))
      .map((_, element) => quoteMarkup($, $(element)))
      .get(),
    fontPreloadsWithoutCrossorigin: $('link[rel~="preload" i][as="font" i]')
      .filter((_, element) => $(element).attr('crossorigin') === undefined)
      .map((_, element) => quoteMarkup($, $(element)))
      .get(),
    elementCount,
    featuredImage: featuredImageOf($, baseUrl),
    shareImageAsBackground: shownAsBackground($, shareImageOf(openGraph)),
  };
}

/** Phrasing elements: they continue a run of text rather than end it. */
const INLINE = new Set([
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'font',
  'i',
  'ins',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'nobr',
]);

/**
 * Words a run of loose text needs to be prose. Below it, what sits outside any block is
 * a theme's label — "Get Started", a date, "TAGS" — not the post.
 */
const LOOSE_RUN_MIN_WORDS = 8;

/** The DOM's node type of text (comments are 8). */
const TEXT_NODE = 3;

/**
 * The prose of the main content, one entry per block, in document order.
 *
 * A block that contains blocks is read through its children. A heading is already a
 * field of its own, and counting it here as well paid it twice: a listicle's h2 scored
 * its subheading weight AND a body frequency it never earned in prose, which is how
 * "start this week" and "add specific statistics" became keywords.
 *
 * Text that sits in no block at all — straight inside a `<div>`, between `<br>`s and
 * `<h2>`s — is a block of its own up to the next break, when it reads as prose. cossa.ru
 * writes whole articles that way, and reading only the `<p>`s left a post's text to be
 * its footer's. An inline element holding blocks is no inline element: hubspot.com wraps
 * every paragraph of a post in one `<span>`.
 */
function blocksOf($: CheerioAPI, main: TSelection): string[] {
  const blocks: string[] = [];
  let run = '';
  let ownText = false;
  const flush = () => {
    const text = collapse(run);
    if (ownText && countWords(text) >= LOOSE_RUN_MIN_WORDS) blocks.push(text);
    run = '';
    ownText = false;
  };
  const walk = (nodes: ReturnType<TSelection['contents']>) => {
    nodes.each((_, node) => {
      if (!('tagName' in node)) {
        // Text, and comments — whose `data` is no text of the page.
        if (node.nodeType === TEXT_NODE && 'data' in node) {
          run += ` ${node.data}`;
          if (WORD.test(node.data)) ownText = true;
        }
        return;
      }
      const element = $(node);
      const tag = node.tagName.toLowerCase();
      if (
        INLINE.has(tag) &&
        element.find(`${BLOCK_ELEMENTS}, ${LAYOUT_ELEMENTS}`).length === 0
      ) {
        run += ` ${element.text()}`;
        return;
      }
      flush();
      if (HEADING_TAGS.has(tag)) return;
      if (
        element.is(BLOCK_ELEMENTS) &&
        element.find(BLOCK_ELEMENTS).length === 0
      ) {
        const text = collapse(element.text());
        if (text) blocks.push(text);
        return;
      }
      walk(element.contents());
      flush();
    });
  };
  walk(main.contents());
  flush();
  return blocks;
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

/**
 * What themes call the container of the post's text, most specific first. Read only
 * when the page has neither `<main>` nor an `<article>` to say so: kottke.org has
 * neither, the whole `<body>` was read, and its footer, social links and membership
 * notice — the same on every post — made one-sentence posts 70% alike.
 */
const CONTENT_CONTAINERS = [
  '[itemprop~="articleBody" i]',
  '.entry-content',
  '.post-content',
  '.post-body',
  '.article-body',
  '.article-content',
  '.post',
];

/**
 * The first named container the page has exactly one of. Two of a kind is a listing —
 * every card is a `.post` — and none of them is the page's text.
 */
function namedContainer($: CheerioAPI): ReturnType<CheerioAPI> | null {
  for (const selector of CONTENT_CONTAINERS) {
    const found = $(selector);
    if (found.length === 1 && wordsIn($, found) > 0) return found;
    if (found.length > 1) return null;
  }
  return null;
}

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
      : (namedContainer($) ??
        ($('article').first().length
          ? $('article').first()
          : $('body').first())));
  const main = candidate.clone();
  main.find('iframe').replaceWith(`<${FRAME_MARKER}></${FRAME_MARKER}>`);
  main.find(NEVER_CONTENT).remove();
  const total = wordsIn($, main);
  const scoped = candidate.is('main, article');
  // Document order, so a wrapper is judged before what it wraps: keeping a wrapper
  // still lets the furniture inside it be removed on its own terms.
  main.find(NON_CONTENT).each((_, element) => {
    const node = $(element);
    if (total > 0 && wordsIn($, node) > total * FURNITURE_MAX_SHARE) return;
    if (scoped && isPostHeader(node)) return;
    node.remove();
  });
  return main;
}

/**
 * The post's own header: a `<header>` holding the post's `<h1>`, inside the `<main>` or
 * `<article>` the content was read from. HTML-AAM maps a header to the site banner only
 * when it is not inside an article, aside, main, nav or section; inside one it is that
 * section's own header — the post's title, byline, date and hero image. Removing it as
 * furniture dropped the h1 from the outline (css-tricks.com: h1 then h3 read as h3, h3)
 * and the hero from the images (yoast.com: "no images" under a full-width picture).
 */
function isPostHeader(node: ReturnType<CheerioAPI>): boolean {
  return node.is('header') && node.find('h1').length > 0;
}

/** The share of the content's words an <article> needs to be the post on its own. */
/**
 * The post's own <article> inside the content, when the content is wider than it.
 *
 * semrush.com sets the h1, byline and date above the <article>, so `mainContent` cannot
 * pick the article out by its h1 and reads the whole <main>, and below the article the
 * same <main> carries a "preferred source" badge with an image. Counted as the post's
 * image, it passed NO_IMAGES and IMAGES_MISSING_ALT on posts with no image at all —
 * Lighthouse, finding no content image there, said not applicable. The images are
 * therefore read from the post's <article>.
 *
 * The post is the largest top-level <article>, and only if it outweighs everything else:
 * all the other articles together (so a listing's biggest card is not taken), the text
 * outside any article (so a lone card beside a page's own text is not), and the bar
 * `mainContent` sets an article with an h1. A share of half the words alone missed a
 * short semrush post, 175 of whose 359 words were the post's.
 *
 * Images only. Moving the text to the article as well drops the author bio and the
 * related-post teasers, which is right, but the keyword catalogue measured four
 * labelled keywords lost on four semrush posts doing it (scoring is tuned on <main>), so
 * that change waits for a retuning of its own.
 */
function postArticleIn(
  $: CheerioAPI,
  main: ReturnType<CheerioAPI>,
): ReturnType<CheerioAPI> | null {
  if (main.is('article')) return null;
  const total = wordsIn($, main);
  if (total === 0) return null;
  const articles = main
    .find('article')
    .filter((_, element) => $(element).parents('article').length === 0)
    .toArray()
    .map((element) => ({ element, words: wordsIn($, $(element)) }))
    .sort((a, b) => b.words - a.words);
  const [largest, ...others] = articles;
  if (!largest) return null;
  const otherArticles = others.reduce((sum, { words }) => sum + words, 0);
  const outside = total - largest.words - otherArticles;
  return largest.words >= total * ARTICLE_MIN_SHARE &&
    largest.words > otherArticles &&
    largest.words > outside
    ? $(largest.element)
    : null;
}

/**
 * Why the page has no description Google reads. Google takes page metadata from `<head>`
 * only, so a description the parser finds in `<body>` — written there, or pushed there by
 * an element that does not belong in `<head>` — is as good as none. An empty one is told
 * apart because its fix differs: the tag is there and only the CMS field is blank.
 */
function metaDescriptionGapOf(
  $: CheerioAPI,
): IParsedPage['metaDescriptionGap'] {
  const inHead = metaContent($, 'name', 'description', 'head');
  if (inHead !== undefined) return orNull(inHead) === null ? 'empty' : null;
  return metaContent($, 'name', 'description') === undefined
    ? 'absent'
    : 'outsideHead';
}

/**
 * The content of every `<meta name>` with this name, anywhere in the document, collapsed,
 * empty ones left out. Robots rules are read from the whole document because Google
 * Search does not enforce their placement in `<head>`.
 */
function metaContents($: CheerioAPI, name: string): string[] {
  return $('meta[name]')
    .filter(
      (_, element) => ($(element).attr('name') ?? '').toLowerCase() === name,
    )
    .map((_, element) => orNull($(element).attr('content')))
    .get()
    .filter((content): content is string => content !== null);
}

function metaContent(
  $: CheerioAPI,
  attribute: 'name' | 'property',
  value: string,
  scope: 'head' | 'document' = 'document',
): string | undefined {
  let content: string | undefined;
  $(`${scope === 'head' ? 'head ' : ''}meta[${attribute}]`).each(
    (_, element) => {
      if (content !== undefined) return;
      if (($(element).attr(attribute) ?? '').toLowerCase() === value)
        content = $(element).attr('content');
    },
  );
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
 * take: aria-labelledby, aria-label, the content, then the title attribute — which
 * Google, too, falls back to for an empty link.
 *
 * In the content, nothing marked aria-hidden counts, and an element that carries a name
 * of its own is read by it, as the rules read every node on the way down: an icon's
 * aria-label (`<svg role="img" aria-label="Home">`), an image's alt or title, an
 * `<svg>`'s `<title>`, an image button's alt. Reading only `img@alt` called such links
 * empty where every browser and axe give them a name.
 */
function accessibleNameOf($: CheerioAPI, anchor: TSelection): string {
  const own = ownNameOf($, anchor);
  if (own) return own;
  const content = anchor.clone();
  content.find('[aria-hidden="true"]').remove();
  content
    .find('[aria-label], [aria-labelledby], img, svg, input[type="image" i]')
    .each((_, element) => {
      const node = $(element);
      const name =
        ownNameOf($, node) ||
        (node.is('img, input')
          ? collapse(node.attr('alt') ?? '') ||
            collapse(node.attr('title') ?? '')
          : '') ||
        (node.is('svg') ? collapse(node.children('title').text()) : '');
      if (name || node.is('img, svg, input')) node.replaceWith(` ${name} `);
    });
  const text = collapse(content.text());
  if (text) return text;
  return collapse(anchor.attr('title') ?? '');
}

/** An element's name from aria-labelledby, else aria-label; '' when it has neither. */
function ownNameOf($: CheerioAPI, node: TSelection): string {
  const labelledBy = collapse(
    (node.attr('aria-labelledby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => $(`[id="${id.replace(/"/g, '')}"]`).text())
      .join(' '),
  );
  return labelledBy || collapse(node.attr('aria-label') ?? '');
}

/**
 * Script types a browser runs as classic JavaScript — HTML's JavaScript MIME type
 * essence matches, legacy ones included; anything else is data or a module.
 */
const CLASSIC_SCRIPT_TYPES = new Set([
  '',
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript',
]);

/**
 * An external script the parser must stop for: classic JavaScript with neither `async`
 * nor `defer`. A module defers by default; JSON and templates never run; and a classic
 * `nomodule` script is never fetched by a browser that runs modules — HTML's "prepare the
 * script element" returns before fetching it — so it blocks nothing in any browser that
 * renders the page today.
 */
function isParserBlocking(script: TSelection): boolean {
  const type = (script.attr('type') ?? '').trim().toLowerCase();
  return (
    CLASSIC_SCRIPT_TYPES.has(type) &&
    script.attr('nomodule') === undefined &&
    script.attr('async') === undefined &&
    script.attr('defer') === undefined
  );
}

/**
 * A file's name without its directory, query, extension or a CMS's size suffix
 * (`hero-1200x630.jpg` → `hero`), so the og:image and the resized copy in the page meet.
 */
const imageStem = (url: string) =>
  (url.split(/[?#]/)[0].split('/').pop() ?? '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/-\d+x\d+$/, '')
    .toLowerCase();

/** Whether an inline `background-image` shows the share image, matched by file stem. */
function shownAsBackground($: CheerioAPI, shareImage: string | null): boolean {
  const stem = shareImage ? imageStem(shareImage) : '';
  if (!stem) return false;
  return $('[style*="url(" i]')
    .toArray()
    .some((element) =>
      [
        ...($(element).attr('style') ?? '').matchAll(
          /url\(\s*['"]?([^'")]+)/gi,
        ),
      ].some(([, url]) => imageStem(url) === stem),
    );
}

/** The `<img>` whose src or srcset shows the og:image, by file stem. */
/**
 * Words of paragraph text between the headline and a featured image at the top of the
 * post. og:image is often no hero at all, only the post's best picture: on github.blog's
 * DGit post it is a diagram 2,000 words down, on backlinko.com's YouTube study a chart
 * after 1,700 — both lazy, both rightly so. Measured against Lighthouse on live posts
 * (2026-10): minimalistbaker.com's photos, 22 words down, were the LCP and lazy; a
 * github.blog screenshot 102 words down was lazy and not the LCP — a paragraph was.
 */
const FEATURED_IMAGE_MAX_PROSE_BEFORE = 60;

/** Declared narrower than this, an image is a thumbnail of the featured one. */
const THUMBNAIL_MAX_WIDTH = 200;

const isThumbnail = (image: TSelection) => {
  const width = Number.parseInt(image.attr('width') ?? '', 10);
  return Number.isFinite(width) && width < THUMBNAIL_MAX_WIDTH;
};

/**
 * Words in the `<p>`s between the headline and `target`, in document order — from the
 * top of the body on a page without an `<h1>`. From the headline, because what comes
 * before it is the site's own header, and a mega-menu written in paragraphs put
 * hubspot.com's hero, fetchpriority="high", 150 words "down" the page.
 */
function proseBefore($: CheerioAPI, target: TSelection): number {
  const node = target.get(0);
  const headline = $('body h1').get(0);
  let counting = headline === undefined;
  let words = 0;
  for (const element of $('body h1, body p, body img').toArray()) {
    if (element === node) break;
    if (element === headline) counting = true;
    else if (counting && element.tagName === 'p')
      words += $(element).text().split(/\s+/).filter(Boolean).length;
  }
  return words;
}

/**
 * The image og:image names, when it sits at the top of the post — the likeliest Largest
 * Contentful Paint. Only there: og:image is often the post's best picture, not its
 * hero, and an image 2,000 words down is rightly lazy.
 *
 * Nothing stands in for it when og:image names an image further down. "The first wide
 * image under the headline" was tried against Lighthouse on live posts (2026-10): it
 * found the real LCP on dev.to and minimalistbaker.com, and on habr.com, moz.com,
 * ahrefs.com and ghost.org picked an image while the LCP was the headline or another
 * picture — and 19 words of text before the image separated neither group.
 */
function featuredImageOf(
  $: CheerioAPI,
  baseUrl: string,
): IParsedPage['featuredImage'] {
  const og = absolute(shareImageOf(openGraphOf($)) ?? undefined, baseUrl);
  const stem = og ? imageStem(og) : '';
  // The first of the images showing it that is not a thumbnail: neilpatel.com prints
  // the featured image twice, a 175-pixel lazy thumbnail first and the 700-pixel hero
  // — the LCP — after it.
  const named =
    stem.length < 3
      ? undefined
      : $('body img')
          .toArray()
          .map((element) => $(element))
          .find(
            (candidate) =>
              !isThumbnail(candidate) &&
              [
                candidate.attr('src'),
                ...(candidate.attr('srcset') ?? '').split(','),
              ]
                .map((value) => (value ?? '').trim().split(/\s+/)[0])
                .some((value) => value && imageStem(value) === stem),
          );
  const atTop = (image: TSelection) =>
    proseBefore($, image) <= FEATURED_IMAGE_MAX_PROSE_BEFORE;
  const image = named && atTop(named) ? named : undefined;
  return image
    ? {
        loading: image.attr('loading')?.trim().toLowerCase() || null,
        markup: quoteMarkup($, image),
      }
    : null;
}

/** Both size attributes, or an inline style that fixes the box. */
function isSized(image: TSelection): boolean {
  const number = (value: string | undefined) =>
    /^\s*\d+(\.\d+)?\s*$/.test(value ?? '');
  if (number(image.attr('width')) && number(image.attr('height'))) return true;
  const style = (image.attr('style') ?? '').toLowerCase();
  return (
    /aspect-ratio\s*:/.test(style) ||
    (/(^|;)\s*width\s*:/.test(style) && /(^|;)\s*height\s*:/.test(style))
  );
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
 * How many words a shell may hold outside its `<noscript>`: a loading line, a cookie
 * notice. Substack's paid posts hold a hundred and more beside their banner (field
 * audit, 2026-10-11), and a real shell holds none.
 */
const SHELL_MAX_WORDS = 20;

/**
 * An empty framework mount point, or a `<noscript>` asking for JavaScript in a body that
 * holds next to nothing else. The banner alone is no evidence: Substack prints "This site
 * requires JavaScript" on every page, server-rendered ones included. Read on the whole
 * document before anything is removed, because the `<noscript>` is the evidence.
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
  const asksForJavascript = $('body noscript')
    .toArray()
    .some((element) => /javascript/i.test($(element).text()));
  if (!asksForJavascript) return false;
  const body = $('body').clone();
  body.find(NEVER_CONTENT).remove();
  return (
    collapse(body.text()).split(' ').filter(Boolean).length <= SHELL_MAX_WORDS
  );
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
function alternatesOf(
  $: CheerioAPI,
  scope: 'head' | 'body',
  baseUrl: string,
): IAlternateLink[] {
  const alternates: IAlternateLink[] = [];
  $(`${scope} link[rel~="alternate" i][hreflang]`).each((_, element) => {
    const lang = collapse($(element).attr('hreflang') ?? '');
    const raw = collapse($(element).attr('href') ?? '');
    const href = absolute(raw, baseUrl);
    if (lang && href)
      alternates.push(
        HAS_SCHEME.test(raw)
          ? { lang, href }
          : { lang, href, relativeHref: raw },
      );
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
 * The image the page names for sharing, as written: og:image, or else og:image:url or
 * og:image:secure_url — the protocol: "og:image:url – Identical to og:image". vercel.com's
 * docs declare only that spelling, and Facebook reads it as the share image.
 */
function shareImageOf(openGraph: Record<string, string>): string | null {
  return (
    openGraph['og:image'] ??
    openGraph['og:image:url'] ??
    openGraph['og:image:secure_url'] ??
    null
  );
}

/**
 * Types and keywords of every JSON-LD node, `@graph` and nested arrays flattened, plus
 * the property names of the nodes that are articles.
 *
 * A property counts only when it carries something: WordPress emits `"author": ""` and
 * `"image": []` for fields nobody filled in, and treating a present-but-empty key as the
 * field being there would pass every page a CMS half-populated.
 */
/** `"@type":"X"`, as written or escaped inside a string (`\"@type\":\"X\"`). */
const SCRIPTED_TYPE = /\\?"@type\\?"\s*:\s*\\?"([A-Za-z]+)\\?"/g;

/** The properties through which a JSON-LD node holds the page's own nested items. */
const NESTED_ITEM_PROPERTIES = ['mainEntity', 'breadcrumb'] as const;

/** The schema.org types inline scripts other than JSON-LD blocks name. */
function scriptedSchemaTypesOf($: CheerioAPI): string[] {
  const types = new Set<string>();
  $('script:not([src])')
    .not('script[type="application/ld+json" i]')
    .each((_, element) => {
      for (const [, type] of $(element).text().matchAll(SCRIPTED_TYPE))
        types.add(type);
    });
  return [...types];
}

function structuredDataOf(
  $: CheerioAPI,
  baseUrl: string,
): {
  jsonLd: IParsedPage['jsonLd'];
  jsonLdErrors: string[];
  authors: string[];
  dates: { published: string | null; modified: string | null };
  article: IArticleMarkup | null;
  breadcrumbs: IParsedPage['breadcrumbs'];
  logos: string[];
  websiteNames: IParsedPage['websiteNames'];
} {
  const types = new Set<string>();
  const keywords = new Set<string>();
  const articleFields = new Set<string>();
  // Authors are often a reference into the graph — `"author": {"@id": "#person"}` — so
  // names are resolved after every block is read, against the nodes that carry an @id.
  const namesById = new Map<string, string>();
  const nodesById = new Map<string, TNode>();
  const nodes: TNode[] = [];
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
    nodes.push(record);
    const nodeTypes = typesOf(record);
    for (const type of nodeTypes) types.add(type);
    if (typeof record['@id'] === 'string') {
      if (!nodesById.has(record['@id'])) nodesById.set(record['@id'], record);
      if (typeof record.name === 'string')
        namesById.set(record['@id'], collapse(record.name));
    }
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
    // Google: "Google Search understands multiple items on a page, whether you nest the
    // items or specify each item individually." A WebPage carries its post as mainEntity
    // and its trail as breadcrumb. Only these two are followed, and only into a typed
    // node: a listing's ItemList of BlogPostings is not the page's article, and a bare
    // {"@id"} reference would shadow the full node in the index.
    for (const key of NESTED_ITEM_PROPERTIES)
      for (const item of [record[key]].flat())
        if (item && typeof item === 'object' && '@type' in item) visit(item);
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
  const articleNode = nodes.find((node) =>
    typesOf(node).some((type) => ARTICLE_TYPES.has(type)),
  );
  return {
    jsonLd: {
      types: [...types],
      keywords: [...keywords],
      articleFields: [...articleFields],
    },
    jsonLdErrors,
    authors: [...names].map((name) => `JSON-LD author: ${name}`),
    dates,
    article: articleNode
      ? {
          source: 'json-ld',
          type: typesOf(articleNode).find((type) => ARTICLE_TYPES.has(type))!,
          headline: orNull(
            typeof articleNode.headline === 'string'
              ? articleNode.headline
              : undefined,
          ),
          datePublished: dateOf(articleNode.datePublished),
          dateModified: dateOf(articleNode.dateModified),
          authors: authorsOf(articleNode.author, nodesById),
          images: imagesOf(articleNode.image, nodesById, baseUrl),
        }
      : null,
    breadcrumbs: nodes
      .filter((node) => typesOf(node).includes('BreadcrumbList'))
      .map((node) => breadcrumbItemsOf(node, nodesById, baseUrl)),
    logos: [
      ...new Set(nodes.flatMap((node) => logosOf(node, nodesById, baseUrl))),
    ],
    websiteNames: nodes
      .filter((node) => typesOf(node).includes('WebSite'))
      .map(websiteNameOf)
      .filter((names) => names !== null),
  };
}

/** The rel tokens that name a site icon Google reads for the favicon. */
const ICON_RELS = ['icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];

/**
 * Icons the document declares, in order: `shortcut icon` is an `icon` too. Read from the
 * whole document, not `<head>` alone: neilpatel.com writes its icon link after an
 * element that ends the head for a parser (2026-10), and the icon is still the site's.
 */
function iconsOf($: CheerioAPI, baseUrl: string): IIconLink[] {
  const icons: IIconLink[] = [];
  $('link[rel][href]').each((_, element) => {
    const rel = relTokens($(element).attr('rel')).find((token) =>
      ICON_RELS.includes(token),
    );
    const href = absolute($(element).attr('href'), baseUrl);
    if (!rel || !href) return;
    icons.push({
      rel,
      href,
      type: $(element).attr('type')?.trim().toLowerCase() || null,
      sizes: orNull($(element).attr('sizes')),
    });
  });
  return icons;
}

/** The video players whose iframe is a video on the page, by the address it loads. */
const VIDEO_PLAYER =
  /^https?:\/\/(?:[a-z0-9-]+\.)*(?:youtube\.com\/embed|youtube-nocookie\.com\/embed|player\.vimeo\.com\/video|fast\.wistia\.(?:net|com)\/embed|(?:[a-z0-9-]+\.)?wistia\.com\/medias|dailymotion\.com\/embed|geo\.dailymotion\.com\/player|rutube\.ru\/play\/embed|vk\.com\/video_ext|vkvideo\.ru\/video_ext|loom\.com\/embed|play\.vidyard\.com|players\.brightcove\.net|embed\.ted\.com)/i;

/**
 * Videos a reader can watch, outside the site's navigation and footer. A muted `<video>`
 * with no controls is a moving background, not a video anyone came for — semrush.com's
 * home page loops one, started by a script rather than `autoplay` (2026-10).
 */
function videosOf($: CheerioAPI): string[] {
  const outsideFurniture = (element: TSelection) =>
    element.closest('nav, header, footer, aside').length === 0;
  const found: string[] = [];
  $('body video').each((_, node) => {
    const video = $(node);
    const decorative =
      video.attr('muted') !== undefined && video.attr('controls') === undefined;
    if (!decorative && outsideFurniture(video))
      found.push(quoteMarkup($, video));
  });
  $('body iframe').each((_, node) => {
    const frame = $(node);
    const src = (frame.attr('src') || frame.attr('data-src') || '').trim();
    const url = src.startsWith('//') ? `https:${src}` : src;
    if (VIDEO_PLAYER.test(url) && outsideFurniture(frame))
      found.push(quoteMarkup($, frame));
  });
  return found;
}

/**
 * Share of the main content a `data-nosnippet` element must hold to be the article
 * rather than a passage in it. A passage kept out of the snippet is an editor's choice;
 * the whole text kept out is a page Google can quote nothing from.
 */
const NOSNIPPET_MIN_SHARE = 0.5;

/** The `data-nosnippet` element holding most of the main content, or null. */
function contentNosnippetOf($: CheerioAPI, wordCount: number): string | null {
  if (wordCount === 0) return null;
  // Google honours the attribute on span, div and section only.
  const holder = $(
    'span[data-nosnippet], div[data-nosnippet], section[data-nosnippet]',
  )
    .toArray()
    .map((element) => $(element))
    .find((element) => {
      const clone = element.clone();
      clone.find(NEVER_CONTENT).remove();
      return wordsIn($, clone) >= wordCount * NOSNIPPET_MIN_SHARE;
    });
  if (!holder) return null;
  const opening = /^<[^>]*>/.exec(quoteMarkup($, holder.clone().empty()));
  return opening ? opening[0] : quoteMarkup($, holder);
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

/** Path segments of an author's archive page: `/author/<slug>/`. */
const AUTHOR_ARCHIVE_SEGMENTS = new Set([
  'author',
  'authors',
  'contributor',
  'contributors',
]);

/** Whether `href` is this site's archive page of one author. */
function isAuthorArchive(href: string, baseUrl: string): boolean {
  const url = new URL(href);
  if (siteKeyOf(url.hostname) !== siteKeyOf(new URL(baseUrl).hostname))
    return false;
  const segments = url.pathname.split('/').filter(Boolean);
  return (
    segments.length >= 2 &&
    AUTHOR_ARCHIVE_SEGMENTS.has(segments[segments.length - 2].toLowerCase())
  );
}

/**
 * The author as the HTML itself names it: `<meta name="author">`, a `rel="author"` link,
 * an element marked `itemprop="author"`, or a byline that links to the author's archive
 * on this site — `<a href="/author/jane-doe/">Jane Doe</a>`, the way blog.cloudflare.com
 * names its authors with nothing else. Each quoted as written.
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
  $('a[href]').each((_, element) => {
    const href = absolute($(element).attr('href'), baseUrl);
    const name = collapse($(element).text());
    if (href && name && name.length <= 100 && isAuthorArchive(href, baseUrl))
      found.push(`byline: <a href="${href}">${name}</a>`);
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
