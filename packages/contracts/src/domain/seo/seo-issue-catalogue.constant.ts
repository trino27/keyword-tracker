import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';

export interface ISeoIssueDefinition {
  severity: TSeoIssueSeverity;
  /** Short, shown as the issue's name. */
  label: string;
  /** One sentence on why it matters and what to do. */
  hint: string;
  /** Inclusive bounds of the acceptable value, where the rule has one. */
  min?: number;
  max?: number;
  /**
   * Why this check can be skipped, for the codes whose rule can answer `notApplicable`.
   * A property of the RULE, not of a page — `IMAGES_MISSING_ALT` is skipped for one
   * reason every time — so it is a constant here rather than a fact stored per page.
   * Its presence is what `CONDITIONAL_ISSUE_CODES` reads.
   */
  skipReason?: string;
  /**
   * `run` marks a check that cannot be answered from one page — it compares the page
   * with the others crawled in the same run. Absent means the ordinary thing: the
   * page judges itself.
   */
  scope?: 'run';
}

/**
 * Every SEO issue the analysis can report — the backend's rules are typed by these
 * keys, so a code without a rule does not compile, and the frontend renders labels and
 * hints from here. Thresholds live here too: the rule and the screen quote one number.
 */
export const SEO_ISSUE_CATALOGUE = {
  TITLE_MISSING: {
    severity: 'error',
    label: 'Title is missing',
    hint: 'Search results show the title as the headline; add a <title> in <head>.',
  },
  TITLE_LENGTH: {
    // A notice, not a warning: exceeding the bounds costs space in a result, it does not
    // break the page (plan D4). The numbers are unchanged; industry consensus confirms them.
    severity: 'notice',
    label: 'Title length',
    hint: 'Titles outside 30–60 characters are cut off or waste the space in results.',
    min: 30,
    max: 60,
    skipReason: 'No title to measure.',
  },
  META_DESCRIPTION_MISSING: {
    severity: 'warning',
    label: 'Meta description is missing',
    hint: 'Without one, search engines pick a snippet from the page themselves.',
  },
  META_DESCRIPTION_LENGTH: {
    severity: 'notice',
    label: 'Meta description length',
    hint: 'Descriptions outside 70–160 characters are cut off or look thin.',
    min: 70,
    max: 160,
    skipReason: 'No description to measure.',
  },
  H1_MISSING: {
    severity: 'error',
    label: 'H1 is missing',
    hint: 'The main heading tells readers and crawlers what the page is about.',
  },
  H1_MULTIPLE: {
    severity: 'warning',
    label: 'More than one H1',
    hint: 'Several main headings blur what the page is about; keep one.',
  },
  HEADING_SKIP: {
    severity: 'notice',
    label: 'Heading level skipped',
    hint: 'Going from H2 straight to H4 breaks the outline that headings describe.',
    skipReason: 'Fewer than two headings — no outline to judge.',
  },
  CANONICAL_MISSING: {
    severity: 'warning',
    label: 'Canonical URL is missing',
    hint: 'A canonical link says which URL should rank when copies exist.',
  },
  CANONICAL_MISMATCH: {
    severity: 'notice',
    label: 'Canonical points elsewhere',
    hint: 'The page names another URL as canonical, so this one may not be indexed.',
    skipReason: 'No canonical to disagree with.',
  },
  NOINDEX: {
    severity: 'error',
    label: 'Page is set to noindex',
    hint: 'A robots meta tag or X-Robots-Tag header keeps the page out of search results.',
  },
  IMAGES_MISSING_ALT: {
    severity: 'warning',
    label: 'Images without alt text',
    hint: 'Alt text describes an image to screen readers and image search.',
    skipReason: 'The page has no images.',
  },
  THIN_CONTENT: {
    severity: 'warning',
    label: 'Thin content',
    hint: 'Posts under 300 words rarely answer a query well enough to rank.',
    min: 300,
  },
  LANG_MISSING: {
    severity: 'notice',
    label: 'Language is not declared',
    hint: 'The lang attribute on <html> tells search engines which audience to serve.',
  },
  OG_TAGS_MISSING: {
    severity: 'notice',
    label: 'Open Graph tags missing',
    hint: 'og:title, og:description and og:image control how shared links look.',
  },
  NOT_HTTPS: {
    severity: 'error',
    label: 'Not served over HTTPS',
    hint: 'Browsers mark plain HTTP pages as not secure, and search engines prefer HTTPS.',
  },
  REDIRECTED: {
    severity: 'notice',
    label: 'Sitemap URL redirects',
    hint: 'The sitemap lists a URL that redirects; list the final URL instead.',
  },
  LARGE_PAGE: {
    severity: 'notice',
    label: 'Large HTML',
    hint: 'HTML over 1 MB is slow to download and parse.',
    max: 1_048_576,
  },
  KEYWORD_CANNIBALISATION: {
    scope: 'run',
    severity: 'warning',
    label: 'Two pages target the same keyword',
    hint: 'Pages competing for one query split its links and rankings; merge them or retarget one.',
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no keyword.',
  },
  TITLE_DUPLICATE: {
    scope: 'run',
    severity: 'warning',
    label: 'Title is used by another page',
    hint: 'Identical titles give search engines no way to tell the pages apart in results.',
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no title.',
  },
  META_DESCRIPTION_DUPLICATE: {
    scope: 'run',
    severity: 'notice',
    label: 'Meta description is used by another page',
    hint: 'A description written for one page describes the others worse; write one per page.',
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no description.',
  },
  STRUCTURED_DATA_MISSING: {
    // The hint speaks about eligibility, never about a violation: Google requires no
    // structured data, and a hint implying otherwise manufactures urgency.
    severity: 'notice',
    label: 'No article structured data',
    hint: 'Article or BlogPosting markup makes the post eligible for rich results; Google requires none.',
  },
} as const satisfies Record<string, ISeoIssueDefinition>;

export type TSeoIssueCode = keyof typeof SEO_ISSUE_CATALOGUE;

export const SEO_ISSUE_CODES = Object.keys(
  SEO_ISSUE_CATALOGUE,
) as TSeoIssueCode[];

/**
 * The catalogue split by what a check can see. Derived from the entries, so a code is
 * in exactly one of them and neither list can drift from the catalogue.
 *
 * The split is what lets the page rules stay typed as complete: `SEO_RULES` covers
 * every PAGE code and would not compile if one were missing, and a run check — which
 * takes the whole crawl rather than a page — is answered by its own registry instead
 * of being forced into a shape it cannot have.
 */
export type TRunIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends {
    scope: 'run';
  }
    ? K
    : never;
}[TSeoIssueCode];

export type TPageIssueCode = Exclude<TSeoIssueCode, TRunIssueCode>;

export const RUN_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => 'scope' in SEO_ISSUE_CATALOGUE[code],
) as TRunIssueCode[];

export const PAGE_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => !('scope' in SEO_ISSUE_CATALOGUE[code]),
) as TPageIssueCode[];
