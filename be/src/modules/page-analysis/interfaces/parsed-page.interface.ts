export interface IHeading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
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
  canonical: string | null;
  /** `og:*` properties by name, e.g. `og:title`. */
  openGraph: Record<string, string>;
  articleTags: string[];
  jsonLd: { types: string[]; keywords: string[] };
  /** `<html lang>`, as written. */
  lang: string | null;
  /** Every h1 of the document, in order. */
  h1s: string[];
  /** h1–h6 of the main content, in order. */
  headings: IHeading[];
  firstParagraph: string | null;
  images: IPageImage[];
  /**
   * Prose blocks of the main content — paragraphs, list items, cells — so keyword
   * candidates never cross a block boundary. Headings are NOT here: they are read
   * through `headings`, and counting them in both paid a section label twice.
   */
  blocks: string[];
  wordCount: number;
}
