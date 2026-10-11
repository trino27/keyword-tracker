export interface IHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

/** One `<link rel="alternate" hreflang>`: the value as written, the URL it resolves to. */
export interface IAlternateLink {
  /** As written, so a malformed code can be reported back in the author's own spelling. */
  lang: string;
  /** Absolute, resolved against the page, as a browser would resolve it. */
  href: string;
}

export interface IPageImage {
  src: string | null;
  /** The `srcset` attribute as written; null when absent. */
  srcset: string | null;
  /** null: the attribute is absent. '' is a deliberate decorative image, not a miss. */
  alt: string | null;
  /** The `loading` attribute as written, lower-cased; null when absent. */
  loading: string | null;
  /**
   * Whether the markup reserves the image's box before it loads: both `width` and
   * `height` attributes, or an inline style giving an aspect ratio or both sizes.
   */
  sized: boolean;
  /** The element as written, cut to 200 characters, for a finding to quote. */
  markup: string;
}

/**
 * One author as the article's structured data states it. `asText` is an author given as
 * a bare string — a name with no type and nowhere to read more about the person.
 */
export interface IMarkupAuthor {
  name: string | null;
  /** The first `@type` (or Microdata `itemtype`) the author carries; null when none. */
  type: string | null;
  /** `url` and every `sameAs`, in that order: the pages that say who the author is. */
  urls: string[];
  asText: boolean;
}

/** An image the article's structured data names, with the size it declares, if any. */
export interface IMarkupImage {
  url: string;
  width: number | null;
  height: number | null;
}

/**
 * The page's article node as its structured data states it — the first JSON-LD node
 * typed as an article, or else the first Microdata item. Read as written, so a check can
 * judge the FORM of what is declared, not only whether a property is there.
 */
export interface IArticleMarkup {
  source: 'json-ld' | 'microdata';
  type: string;
  headline: string | null;
  datePublished: string | null;
  dateModified: string | null;
  authors: IMarkupAuthor[];
  images: IMarkupImage[];
}

/** One `ListItem` of a JSON-LD `BreadcrumbList`, with what Google requires of it. */
export interface IBreadcrumbItem {
  /** Null when absent or not an integer. */
  position: number | null;
  /** `name`, or the name of the `item` it points at. */
  name: string | null;
  /** The URL the step leads to: `item` as a string, or its `@id` or `url`. */
  item: string | null;
}

/** A `<link>` naming an icon for the site. */
export interface IIconLink {
  /** The rel token that made it an icon: `icon`, `apple-touch-icon`, … */
  rel: string;
  /** Absolute, resolved against the page. */
  href: string;
  /** The `type` attribute, lower-cased; null when absent. */
  type: string | null;
  /** The `sizes` attribute as written; null when absent. */
  sizes: string | null;
}

/**
 * The image the page names for itself — og:image, or else the article markup's first
 * image — as the crawl read it from the file: its pixel size comes from the file's own
 * header, because the sizes a page declares are often not the image's.
 */
export interface IPreviewImage {
  url: string;
  /** Null when no HTTP answer came back at all. */
  status: number | null;
  width: number | null;
  height: number | null;
}

/** What the analysis reads from one page's HTML; every string is whitespace-collapsed. */
export interface IParsedPage {
  /** From `head > title` only — an SVG <title> in the body is not the page title. */
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  /** `<meta name="googlebot">` content: Google obeys it exactly as it obeys `robots`. */
  metaGooglebot: string | null;
  /** `<meta http-equiv="refresh">` content, as written; null when there is none. */
  metaRefresh: string | null;
  /** `<meta name="viewport">` content, as written; null when the tag is absent. */
  viewport: string | null;
  /**
   * Every distinct canonical `<head>` declares, in order. Two different ones are a
   * conflict, and Google answers a conflict by ignoring all of them.
   */
  canonicals: string[];
  /**
   * Canonicals written outside `<head>`. Google reads a canonical only in the head, so
   * one of these is a canonical the author believes the page has and it does not.
   */
  canonicalsOutsideHead: string[];
  /** Canonical hrefs in `<head>` written as a path rather than a full URL, as written. */
  relativeCanonicals: string[];
  alternates: IAlternateLink[];
  /** `og:*` properties by name, e.g. `og:title`. */
  openGraph: Record<string, string>;
  articleTags: string[];
  /**
   * `articleFields` are the property names carried by the nodes typed as an article —
   * only those, because a `BreadcrumbList` beside the post has an `itemListElement` and
   * no `author`, and a union over every node would report the breadcrumb's fields as the
   * article's.
   */
  jsonLd: { types: string[]; keywords: string[]; articleFields: string[] };
  /** JSON-LD blocks that are not JSON, each as the start of its text and the error. */
  jsonLdErrors: string[];
  /**
   * The same two facts read from Microdata (`itemscope itemtype`), which Google reads as
   * it reads JSON-LD: the schema.org types, and the properties of the article item.
   */
  microdata: { types: string[]; articleFields: string[] };
  articleMarkup: IArticleMarkup | null;
  /** Every JSON-LD `BreadcrumbList`, each as its items in the order written. */
  breadcrumbs: IBreadcrumbItem[][];
  /** Every `logo` a structured data node declares — the publisher's, the organization's. */
  logos: string[];
  /** Every `WebSite` node's `name` and `alternateName`, JSON-LD or Microdata. */
  websiteNames: { name: string; alternateNames: string[] }[];
  /** Icons the document declares for the site, in order. */
  icons: IIconLink[];
  /**
   * Videos the page shows outside its navigation and footer — a `<video>` a reader can
   * play, or a known player's `<iframe>` (YouTube, Vimeo, Wistia…) — each as its markup.
   * A muted video without controls is decoration, not a video, and not here.
   */
  videos: string[];
  /**
   * The `data-nosnippet` element holding most of the main content, as its markup; null
   * when there is none. Google shows no text from inside it, so wrapping the article in
   * one is a nosnippet rule written another way.
   */
  contentNosnippet: string | null;
  /** `<html lang>`, as written. */
  lang: string | null;
  /** Every h1 of the document, in order. */
  h1s: string[];
  /** h1–h6 of the main content, in order. */
  headings: IHeading[];
  firstParagraph: string | null;
  images: IPageImage[];
  /**
   * Frames, videos and plugin objects in the main content — a CodePen demo, a YouTube
   * player, an embedded chart. Visual content a post shows instead of an `<img>`.
   */
  embeds: number;
  /**
   * Absolute URLs of everything the DOCUMENT loads — images, scripts, stylesheets,
   * frames, media. The whole document and not the main content: a tracking script in
   * `<head>` fetched over plain HTTP breaks the padlock exactly as a body image does.
   */
  resourceUrls: string[];
  /**
   * Absolute hrefs of the links inside the MAIN CONTENT — the ones the author wrote.
   * The nav, the related-posts rail and the share bar are already gone by the time this
   * is read, which is the whole point: a theme that links every post from every sidebar
   * would otherwise make "this page links somewhere" true of every page on the site.
   */
  links: string[];
  /** The subset of `links` whose `rel` says `nofollow`. */
  nofollowLinks: string[];
  /**
   * Links in the main content a crawler cannot follow — a `javascript:` href, a
   * client-side route in the fragment (`#/pricing`, `#!pricing`), or an `<a>` with no
   * href that navigates by `onclick` — each as its markup, cut to 200
   * characters, so the reader can find it in the page source.
   */
  uncrawlableLinks: string[];
  /**
   * Followable content links with no accessible name — no text, no alt on a linked
   * image, no aria-label, no title — each as its markup. Text hidden visually for screen
   * readers counts as a name: it is read before that text is removed.
   */
  unnamedLinks: { href: string; markup: string }[];
  /**
   * Absolute URLs of the scripts and stylesheets the document loads: what a renderer
   * needs to draw the page, and so what robots.txt must not keep from Googlebot.
   */
  renderResources: string[];
  /**
   * The document looks like a client-rendered shell: an empty mount point for a
   * JavaScript framework, or a `<noscript>` asking for JavaScript. Read only beside a
   * low word count, where it says WHY there was nothing to read.
   */
  clientRendered: boolean;
  /**
   * Prose blocks of the main content — paragraphs, list items, cells — so keyword
   * candidates never cross a block boundary. Headings are NOT here: they are read
   * through `headings`, and counting them in both paid a section label twice.
   */
  blocks: string[];
  wordCount: number;
  /**
   * Who the page says wrote it, each as the evidence it came from — `JSON-LD author:
   * Jane Doe`, `<meta name="author" content="Jane Doe">`. Only what the markup
   * identifies as the author: a class name like "author-box" is a theme's guess.
   */
  authors: string[];
  /**
   * The article's declared dates as written: JSON-LD first, then `article:*` meta, then
   * Microdata. Both date checks read these, so a date is judged once whatever declares it.
   */
  datePublished: string | null;
  dateModified: string | null;
  /**
   * SHA-256 of the main content's text, so a later crawl can tell whether the words
   * changed. Read from the same text the word count is, after furniture is removed.
   */
  contentHash: string;
  /**
   * Byte offset at which the document's `<meta charset>` (or its http-equiv form) ENDS,
   * or null when the HTML declares no encoding. The HTML standard requires it within the
   * first 1024 bytes.
   */
  charsetDeclarationEnd: number | null;
  /**
   * Scripts in `<head>` that stop the parser: an external classic script with neither
   * `async` nor `defer`. Each as its markup.
   */
  renderBlockingScripts: string[];
  /** `<link rel="preload" as="font">` without `crossorigin`, each as its markup. */
  fontPreloadsWithoutCrossorigin: string[];
  /** Elements in the document as served, before anything is removed. */
  elementCount: number;
  /**
   * The `<img>` showing the page's featured image — the one `og:image` names — wherever
   * it sits in the document, or null when the page shows none. The image a CMS puts at
   * the top of a post, and so the likeliest Largest Contentful Paint.
   */
  featuredImage: { loading: string | null; markup: string } | null;
}
