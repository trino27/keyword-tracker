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
  /** null: the attribute is absent. '' is a deliberate decorative image, not a miss. */
  alt: string | null;
}

/** What the analysis reads from one page's HTML; every string is whitespace-collapsed. */
export interface IParsedPage {
  /** From `head > title` only — an SVG <title> in the body is not the page title. */
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  /** `<meta http-equiv="refresh">` content, as written; null when there is none. */
  metaRefresh: string | null;
  /** `<meta name="viewport">` content, as written; null when the tag is absent. */
  viewport: string | null;
  canonical: string | null;
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
  /** `<html lang>`, as written. */
  lang: string | null;
  /** Every h1 of the document, in order. */
  h1s: string[];
  /** h1–h6 of the main content, in order. */
  headings: IHeading[];
  firstParagraph: string | null;
  images: IPageImage[];
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
  /**
   * Prose blocks of the main content — paragraphs, list items, cells — so keyword
   * candidates never cross a block boundary. Headings are NOT here: they are read
   * through `headings`, and counting them in both paid a section label twice.
   */
  blocks: string[];
  wordCount: number;
}
