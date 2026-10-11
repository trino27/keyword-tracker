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
  { crawl: ['UNCRAWLABLE_LINKS'], lighthouse: ['LH_CRAWLABLE_ANCHORS'] },
  { crawl: ['HREFLANG_INVALID'], lighthouse: ['LH_HREFLANG'] },
] as const satisfies readonly ICounterpartGroup[];

/** The Lighthouse code of each group: every group has exactly one, which names it. */
type TCounterpartKey =
  (typeof ISSUE_COUNTERPARTS)[number]['lighthouse'][number];

/**
 * Why our verdict and Lighthouse's can differ on a group, said where the screen marks a
 * disagreement. The two read the same subject from different places — we read the HTML the
 * server sends and, for content checks, the article alone; Lighthouse reads the whole page
 * after its scripts have run — and some draw a different line. Each reason names that
 * difference for its group, as each check's code and Lighthouse's audit actually behave, so
 * a reader can tell an expected difference from a defect. A Record: a group added without
 * its reason does not compile.
 */
export const WHY_COUNTERPARTS_DIFFER = {
  LH_DOCUMENT_TITLE:
    'We read the <title> in the HTML the server sends; Lighthouse reads the page after its scripts have run. A title that scripts add, change or remove shows on one side only.',
  LH_META_DESCRIPTION:
    'We read the meta description in the HTML the server sends; Lighthouse reads it after the page’s scripts have run, so one that scripts add or remove shows on one side only.',
  LH_CANONICAL:
    'The two judge different faults of the same tag. We report a missing canonical, one naming another URL, an http:// one, conflicting ones and a relative one; Lighthouse does not judge a missing canonical, fails one that is invalid, relative, repeated or points at the home page or another language version, and reads the tag after scripts have run.',
  LH_IS_CRAWLABLE:
    'We report a noindex addressed to Google and a robots.txt rule that closes the page to Googlebot. Lighthouse fails only a rule that keeps every search engine out — one aimed at Googlebot alone is just a warning to it; both fail an unavailable_after date that has passed.',
  LH_IMAGE_ALT:
    'We check the images in the article; Lighthouse checks every image on the rendered page — logos, icons, banners and images that scripts add — so an image outside the article can fail its check while ours passes, and a page whose article has no images is ours to skip. Lighthouse also passes an image the page hides at a phone’s width, which its desktop run then fails, and accepts a title or aria-label in place of alt; Google reads the alt attribute for images, so we accept only that.',
  LH_CRAWLABLE_ANCHORS:
    'We check the links in the article for javascript: addresses that do something and for links without an address whose onclick opens a page. Lighthouse checks every link on the rendered page, hidden ones and ones scripts add included: it fails a link without an address that any script listens to (a menu toggle, a popup’s Close), javascript:void(0), which leads nowhere and which we pass, an empty address and file: links. It passes a javascript: address that navigates, which we fail, as Google cannot follow it.',
  LH_HREFLANG:
    'We judge hreflang only when the page declares some, and also fail a set whose page names another URL as canonical; Lighthouse passes a page with none, fails a relative address, and does not look at the canonical.',
} as const satisfies Record<TCounterpartKey, string>;

/** Why a group's two verdicts can differ, from any of its codes; null outside a group. */
export function whyCounterpartsDiffer(code: TSeoIssueCode): string | null {
  const key = counterpartGroupOf(code)?.lighthouse?.[0];
  return key ? WHY_COUNTERPARTS_DIFFER[key as TCounterpartKey] : null;
}

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
