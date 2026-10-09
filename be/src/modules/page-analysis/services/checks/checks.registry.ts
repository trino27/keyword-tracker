import {
  ACTIVE_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  type TSeoIssue,
  type TSeoIssueCode,
} from '@app/contracts';
import { AUTHOR_MISSING_CHECK } from './author-missing/author-missing.check';
import { CANONICAL_CONFLICT_CHECK } from './canonical-conflict/canonical-conflict.check';
import { CANONICAL_RELATIVE_CHECK } from './canonical-relative/canonical-relative.check';
import { CHARSET_MISSING_OR_LATE_CHECK } from './charset-missing-or-late/charset-missing-or-late.check';
import { CANONICAL_MISMATCH_CHECK } from './canonical-mismatch/canonical-mismatch.check';
import { CANONICAL_MISSING_CHECK } from './canonical-missing/canonical-missing.check';
import { DEVELOPMENT_HOST_REFERENCES_CHECK } from './development-host-references/development-host-references.check';
import { DATES_INCONSISTENT_CHECK } from './dates-inconsistent/dates-inconsistent.check';
import { DATE_BUMPED_WITHOUT_CHANGES_CHECK } from './date-bumped-without-changes/date-bumped-without-changes.check';
import { H1_MISSING_CHECK } from './h1-missing/h1-missing.check';
import { H1_MULTIPLE_CHECK } from './h1-multiple/h1-multiple.check';
import { HEADING_SKIP_CHECK } from './heading-skip/heading-skip.check';
import { HREFLANG_INVALID_CHECK } from './hreflang-invalid/hreflang-invalid.check';
import { LCP_IMAGE_LAZY_LOADED_CHECK } from './lcp-image-lazy-loaded/lcp-image-lazy-loaded.check';
import { RENDER_BLOCKING_SCRIPTS_CHECK } from './render-blocking-scripts/render-blocking-scripts.check';
import { FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK } from './font-preload-without-crossorigin/font-preload-without-crossorigin.check';
import { BFCACHE_BLOCKED_BY_NO_STORE_CHECK } from './bfcache-blocked-by-no-store/bfcache-blocked-by-no-store.check';
import { DOM_SIZE_LARGE_CHECK } from './dom-size-large/dom-size-large.check';
import { HTML_NOT_COMPRESSED_CHECK } from './html-not-compressed/html-not-compressed.check';
import { IMAGES_MISSING_ALT_CHECK } from './images-missing-alt/images-missing-alt.check';
import { INTERNAL_LINK_VARIANTS_CHECK } from './internal-link-variants/internal-link-variants.check';
import { INTERNAL_LINKS_NOFOLLOW_CHECK } from './internal-links-nofollow/internal-links-nofollow.check';
import { KEYWORD_CANNIBALISATION_CHECK } from './keyword-cannibalisation/keyword-cannibalisation.check';
import { LANG_MISSING_CHECK } from './lang-missing/lang-missing.check';
import { LARGE_PAGE_CHECK } from './large-page/large-page.check';
import { LINKS_WITHOUT_TEXT_CHECK } from './links-without-text/links-without-text.check';
import { META_DESCRIPTION_DUPLICATE_CHECK } from './meta-description-duplicate/meta-description-duplicate.check';
import { META_DESCRIPTION_LENGTH_CHECK } from './meta-description-length/meta-description-length.check';
import { META_DESCRIPTION_MISSING_CHECK } from './meta-description-missing/meta-description-missing.check';
import { META_REFRESH_CHECK } from './meta-refresh/meta-refresh.check';
import { MIXED_CONTENT_CHECK } from './mixed-content/mixed-content.check';
import { NEAR_DUPLICATE_CONTENT_CHECK } from './near-duplicate-content/near-duplicate-content.check';
import { NO_INTERNAL_LINKS_CHECK } from './no-internal-links/no-internal-links.check';
import { NOINDEX_CHECK } from './noindex/noindex.check';
import { NOT_HTTPS_CHECK } from './not-https/not-https.check';
import { OG_TAGS_MISSING_CHECK } from './og-tags-missing/og-tags-missing.check';
import { REDIRECTED_CHECK } from './redirected/redirected.check';
import { ROBOTS_BLOCKS_AI_SEARCH_CHECK } from './robots-blocks-ai-search/robots-blocks-ai-search.check';
import { ROBOTS_BLOCKS_GOOGLEBOT_CHECK } from './robots-blocks-googlebot/robots-blocks-googlebot.check';
import { ROBOTS_BLOCKS_RESOURCES_CHECK } from './robots-blocks-resources/robots-blocks-resources.check';
import { SNIPPET_RESTRICTED_CHECK } from './snippet-restricted/snippet-restricted.check';
import { STRUCTURED_DATA_INVALID_CHECK } from './structured-data-invalid/structured-data-invalid.check';
import { STRUCTURED_DATA_MISSING_CHECK } from './structured-data-missing/structured-data-missing.check';
import { STRUCTURED_DATA_INCOMPLETE_CHECK } from './structured-data-incomplete/structured-data-incomplete.check';
import { THIN_CONTENT_CHECK } from './thin-content/thin-content.check';
import { TITLE_DUPLICATE_CHECK } from './title-duplicate/title-duplicate.check';
import { TITLE_LENGTH_CHECK } from './title-length/title-length.check';
import { TITLE_MISSING_CHECK } from './title-missing/title-missing.check';
import { UNCRAWLABLE_LINKS_CHECK } from './uncrawlable-links/uncrawlable-links.check';
import { VIEWPORT_MISSING_CHECK } from './viewport-missing/viewport-missing.check';
import type { IRunInput, TCheck, TVerdict } from './check.interface';

/**
 * One check per catalogued code, in catalogue order.
 *
 * The mapped type is the completeness check, and it is `pnpm typecheck` rather than a
 * test: a code added to the catalogue without a check does not compile, and neither does
 * a check registered under the wrong code — the unit carries its own code, so the two
 * must agree. Whether a check reads one page or the whole crawl follows from the code's
 * `scope` in the catalogue, so that cannot disagree either.
 *
 * Retired codes stay here. `enabled: false` decides what RUNS; this record decides what
 * EXISTS, and a retired check still has to exist for its stored findings to be read.
 */
export type TCheckRegistry = { [K in TSeoIssueCode]: TCheck<K> };

export const CHECKS: TCheckRegistry = {
  TITLE_MISSING: TITLE_MISSING_CHECK,
  TITLE_LENGTH: TITLE_LENGTH_CHECK,
  META_DESCRIPTION_MISSING: META_DESCRIPTION_MISSING_CHECK,
  META_DESCRIPTION_LENGTH: META_DESCRIPTION_LENGTH_CHECK,
  H1_MISSING: H1_MISSING_CHECK,
  H1_MULTIPLE: H1_MULTIPLE_CHECK,
  HEADING_SKIP: HEADING_SKIP_CHECK,
  CANONICAL_MISSING: CANONICAL_MISSING_CHECK,
  CANONICAL_MISMATCH: CANONICAL_MISMATCH_CHECK,
  CANONICAL_CONFLICT: CANONICAL_CONFLICT_CHECK,
  DEVELOPMENT_HOST_REFERENCES: DEVELOPMENT_HOST_REFERENCES_CHECK,
  CANONICAL_RELATIVE: CANONICAL_RELATIVE_CHECK,
  NOINDEX: NOINDEX_CHECK,
  SNIPPET_RESTRICTED: SNIPPET_RESTRICTED_CHECK,
  ROBOTS_BLOCKS_GOOGLEBOT: ROBOTS_BLOCKS_GOOGLEBOT_CHECK,
  ROBOTS_BLOCKS_RESOURCES: ROBOTS_BLOCKS_RESOURCES_CHECK,
  ROBOTS_BLOCKS_AI_SEARCH: ROBOTS_BLOCKS_AI_SEARCH_CHECK,
  IMAGES_MISSING_ALT: IMAGES_MISSING_ALT_CHECK,
  THIN_CONTENT: THIN_CONTENT_CHECK,
  AUTHOR_MISSING: AUTHOR_MISSING_CHECK,
  DATE_BUMPED_WITHOUT_CHANGES: DATE_BUMPED_WITHOUT_CHANGES_CHECK,
  NO_INTERNAL_LINKS: NO_INTERNAL_LINKS_CHECK,
  INTERNAL_LINKS_NOFOLLOW: INTERNAL_LINKS_NOFOLLOW_CHECK,
  INTERNAL_LINK_VARIANTS: INTERNAL_LINK_VARIANTS_CHECK,
  LINKS_WITHOUT_TEXT: LINKS_WITHOUT_TEXT_CHECK,
  UNCRAWLABLE_LINKS: UNCRAWLABLE_LINKS_CHECK,
  LANG_MISSING: LANG_MISSING_CHECK,
  HREFLANG_INVALID: HREFLANG_INVALID_CHECK,
  VIEWPORT_MISSING: VIEWPORT_MISSING_CHECK,
  OG_TAGS_MISSING: OG_TAGS_MISSING_CHECK,
  CHARSET_MISSING_OR_LATE: CHARSET_MISSING_OR_LATE_CHECK,
  NOT_HTTPS: NOT_HTTPS_CHECK,
  MIXED_CONTENT: MIXED_CONTENT_CHECK,
  REDIRECTED: REDIRECTED_CHECK,
  META_REFRESH: META_REFRESH_CHECK,
  LARGE_PAGE: LARGE_PAGE_CHECK,
  LCP_IMAGE_LAZY_LOADED: LCP_IMAGE_LAZY_LOADED_CHECK,
  RENDER_BLOCKING_SCRIPTS: RENDER_BLOCKING_SCRIPTS_CHECK,
  FONT_PRELOAD_WITHOUT_CROSSORIGIN: FONT_PRELOAD_WITHOUT_CROSSORIGIN_CHECK,
  BFCACHE_BLOCKED_BY_NO_STORE: BFCACHE_BLOCKED_BY_NO_STORE_CHECK,
  DOM_SIZE_LARGE: DOM_SIZE_LARGE_CHECK,
  HTML_NOT_COMPRESSED: HTML_NOT_COMPRESSED_CHECK,
  KEYWORD_CANNIBALISATION: KEYWORD_CANNIBALISATION_CHECK,
  TITLE_DUPLICATE: TITLE_DUPLICATE_CHECK,
  META_DESCRIPTION_DUPLICATE: META_DESCRIPTION_DUPLICATE_CHECK,
  NEAR_DUPLICATE_CONTENT: NEAR_DUPLICATE_CONTENT_CHECK,
  STRUCTURED_DATA_INVALID: STRUCTURED_DATA_INVALID_CHECK,
  DATES_INCONSISTENT: DATES_INCONSISTENT_CHECK,
  STRUCTURED_DATA_MISSING: STRUCTURED_DATA_MISSING_CHECK,
  STRUCTURED_DATA_INCOMPLETE: STRUCTURED_DATA_INCOMPLETE_CHECK,
};

/** What one pass over the checks concluded about a page. */
export interface ISeoEvaluation {
  /** In catalogue order, as the screens read them. */
  issues: TSeoIssue[];
  /**
   * The codes that could be judged, and the codes that could not, both in catalogue
   * order and disjoint. Their union is THE CATALOGUE THIS CRAWL RAN, which is the only
   * record of it there will ever be: read back later against a catalogue that has grown,
   * a code missing from both is one that did not exist — or did not run — when this page
   * was seen, and without these two lists it would be indistinguishable from one that
   * passed.
   */
  checksJudged: TSeoIssueCode[];
  checksNotApplicable: TSeoIssueCode[];
  /** Outcomes that were not `notApplicable` — the score's denominator. */
  checksApplicable: number;
  /** Outcomes that were `fails`. Always `issues.length`; see below. */
  checksFailed: number;
}

/**
 * A run-scoped check that did not answer for every page. It is an error rather than a
 * skipped entry: a missing verdict would silently shrink one page's denominator, and a
 * score computed over a denominator nobody chose is worse than a crawl that stops.
 */
class MissingVerdictsError extends Error {
  constructor(code: TSeoIssueCode, got: number, expected: number) {
    super(
      `Run check ${code} returned ${got} verdicts for ${expected} pages; a run check answers once per page.`,
    );
    this.name = 'MissingVerdictsError';
  }
}

/** Every active check's verdict for every page, by code, in one place. */
function verdictsByCode(
  run: IRunInput,
  checks: TCheckRegistry,
): Record<TSeoIssueCode, TVerdict<TSeoIssueCode>[]> {
  const verdicts = {} as Record<TSeoIssueCode, TVerdict<TSeoIssueCode>[]>;

  for (const code of ACTIVE_ISSUE_CODES) {
    const check: TCheck<TSeoIssueCode> = checks[code];
    if (check.scope === 'run') {
      const perPage = check.evaluate(run);
      if (perPage.length !== run.pages.length)
        throw new MissingVerdictsError(code, perPage.length, run.pages.length);
      verdicts[code] = perPage;
    } else {
      verdicts[code] = run.pages.map((page) => check.evaluate(page));
    }
  }

  return verdicts;
}

/**
 * Everything the checks conclude about every page of one crawl: each page's issues in
 * catalogue order with its catalogued severity, the record of which checks ran, and the
 * two counts its score is derived from.
 *
 * ONE pass per page, over one list, in catalogue order — so the order is a property of
 * the loop rather than something a later step restores by sorting, and `checksFailed`
 * cannot drift from `issues.length` because nothing else writes them. Counting
 * applicability separately is how the counts and the issue list come to disagree, and
 * the disagreement would be invisible: a score of 88 beside nine findings looks no
 * stranger than a score of 88 beside two.
 *
 * Run-scoped checks are answered first, for the whole crawl at once, because that is the
 * only shape in which they CAN be answered: "is another page using this title" is not a
 * property of a page. Their verdicts then join the same lists as every other check, so a
 * page keeps one score over one denominator however many kinds of check contributed.
 *
 * The registry is a parameter so an experiment — a check being trialled, a check being
 * replaced — runs beside the default instead of editing it, the same way the pipeline
 * takes its list of steps.
 *
 * `checksApplicable` and `checksFailed` are `checksJudged.length` and `issues.length`,
 * and both are kept anyway — deliberately. They are the columns the score reads and the
 * list orders by, and a column derived from a count the reader cannot see is worse than
 * a redundant one the database can check. Here the database does check it:
 * `checks_applicable = cardinality(checks_judged)`.
 */
export function evaluateChecks(
  run: IRunInput,
  checks: TCheckRegistry = CHECKS,
): ISeoEvaluation[] {
  const verdicts = verdictsByCode(run, checks);

  return run.pages.map((_, index) => {
    const issues: TSeoIssue[] = [];
    const checksJudged: TSeoIssueCode[] = [];
    const checksNotApplicable: TSeoIssueCode[] = [];

    for (const code of ACTIVE_ISSUE_CODES) {
      const verdict = verdicts[code][index];
      if (verdict.outcome === 'notApplicable') {
        checksNotApplicable.push(code);
        continue;
      }
      checksJudged.push(code);
      if (verdict.outcome === 'fails')
        issues.push({
          code,
          severity: SEO_ISSUE_CATALOGUE[code].severity,
          details: verdict.details,
        } as TSeoIssue);
    }

    return {
      issues,
      checksJudged,
      checksNotApplicable,
      checksApplicable: checksJudged.length,
      checksFailed: issues.length,
    };
  });
}
