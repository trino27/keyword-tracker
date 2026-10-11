import type {
  TIssueCodeOf,
  TIssueOwner,
  TSeoIssueCode,
} from './issue-catalogues.constant.js';

/**
 * Codes of different owners that look at the same property of a page — one row of the
 * checks section, our verdict beside Lighthouse's. Nothing else: a group merges no finding,
 * hides none, and weighs none differently. Each owner keeps its findings, its severities
 * and its share of the score (lighthouse-checks D10, D11).
 */
export type ICounterpartGroup = {
  readonly [O in TIssueOwner]?: readonly TIssueCodeOf<O>[];
};

/**
 * Every group, in the crawl catalogue's order. A code is in at most one, and a group spans
 * at least two owners (`issue-counterparts.test.ts`). A pair belongs here only when both
 * codes fail on the same thing being wrong — not when they share a subject: our
 * VIEWPORT_MISSING (no viewport at all) and Lighthouse's `meta-viewport` (zoom blocked)
 * both read the viewport tag and are not counterparts.
 */
export const ISSUE_COUNTERPARTS = [
  { crawl: ['TITLE_MISSING'], lighthouse: ['LH_DOCUMENT_TITLE'] },
  { crawl: ['META_DESCRIPTION_MISSING'], lighthouse: ['LH_META_DESCRIPTION'] },
  { crawl: ['HEADING_SKIP'], lighthouse: ['LH_HEADING_ORDER'] },
  {
    crawl: [
      'CANONICAL_MISSING',
      'CANONICAL_MISMATCH',
      'CANONICAL_TO_HTTP',
      'CANONICAL_CONFLICT',
      'CANONICAL_RELATIVE',
    ],
    lighthouse: ['LH_CANONICAL'],
  },
  {
    crawl: ['NOINDEX', 'ROBOTS_BLOCKS_GOOGLEBOT'],
    lighthouse: ['LH_IS_CRAWLABLE'],
  },
  { crawl: ['IMAGES_MISSING_ALT'], lighthouse: ['LH_IMAGE_ALT'] },
  { crawl: ['LINKS_WITHOUT_TEXT'], lighthouse: ['LH_LINK_NAME'] },
  { crawl: ['UNCRAWLABLE_LINKS'], lighthouse: ['LH_CRAWLABLE_ANCHORS'] },
  { crawl: ['LANG_MISSING'], lighthouse: ['LH_HTML_HAS_LANG'] },
  { crawl: ['HREFLANG_INVALID'], lighthouse: ['LH_HREFLANG'] },
  { crawl: ['META_REFRESH'], lighthouse: ['LH_META_REFRESH'] },
] as const satisfies readonly ICounterpartGroup[];

const GROUP_OF = new Map<string, ICounterpartGroup>(
  ISSUE_COUNTERPARTS.flatMap((group: ICounterpartGroup) =>
    Object.values(group).flatMap((codes) =>
      (codes ?? []).map((code): [string, ICounterpartGroup] => [code, group]),
    ),
  ),
);

/** The group a code shares a row with, or null for a code checked by one owner alone. */
export function counterpartGroupOf(
  code: TSeoIssueCode,
): ICounterpartGroup | null {
  return GROUP_OF.get(code) ?? null;
}
