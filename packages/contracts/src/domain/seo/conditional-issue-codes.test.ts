import { describe, expect, it } from 'vitest';
import {
  CONDITIONAL_ISSUE_CODES,
  skipReasonOf,
} from './conditional-issue-codes.constant';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';

describe('CONDITIONAL_ISSUE_CODES', () => {
  /**
   * Pinned by name, not by count: another conditional check must be a conscious edit
   * here, which is the prompt to give it a reason rather than ship an empty line. A
   * run-scoped check is conditional too — it is skipped when the run holds one page.
   */
  it('is exactly the codes whose rule can skip', () => {
    expect([...CONDITIONAL_ISSUE_CODES].sort()).toEqual([
      'ARTICLE_DATE_FORMAT_INVALID',
      'ARTICLE_HEADLINE_MISMATCH',
      'AUTHOR_MARKUP_INCOMPLETE',
      'BREADCRUMB_INVALID',
      'BREADCRUMB_MISSING',
      'BROKEN_LINKS',
      'CANONICAL_CONFLICT',
      'CANONICAL_MISMATCH',
      'CANONICAL_RELATIVE',
      'CANONICAL_TO_HTTP',
      'DATES_INCONSISTENT',
      'DATE_BUMPED_WITHOUT_CHANGES',
      'HEADING_SKIP',
      'HREFLANG_INVALID',
      'HREFLANG_NO_SELF_REFERENCE',
      'IMAGES_MISSING_ALT',
      'IMAGES_NOT_INDEXABLE',
      'IMAGE_FILENAMES_GENERIC',
      'INTERNAL_LINKS_NOFOLLOW',
      'INTERNAL_LINK_VARIANTS',
      'KEYWORD_CANNIBALISATION',
      'LCP_IMAGE_LAZY_LOADED',
      'LINKS_TO_REDIRECTS',
      'META_DESCRIPTION_DUPLICATE',
      'META_DESCRIPTION_LENGTH',
      'META_DESCRIPTION_REPEATS_TITLE',
      'MIXED_CONTENT',
      'NEAR_DUPLICATE_CONTENT',
      'NO_EXTERNAL_SOURCES',
      'NO_IMAGES',
      'NO_SUBHEADINGS',
      'OG_URL_MISMATCH',
      'PREVIEW_IMAGE_IS_LOGO',
      'PREVIEW_IMAGE_TOO_SMALL',
      'ROBOTS_BLOCKS_AI_SEARCH',
      'ROBOTS_BLOCKS_GOOGLEBOT',
      'ROBOTS_BLOCKS_RESOURCES',
      'STRUCTURED_DATA_INCOMPLETE',
      'STRUCTURED_DATA_INVALID',
      'TITLE_DUPLICATE',
      'TITLE_LENGTH',
      'TITLE_SCRIPT_MISMATCH',
      'TITLE_YEAR_OUTDATED',
      'VIDEO_WITHOUT_METADATA',
    ]);
  });

  it('holds every catalogue entry that declares a skip reason', () => {
    const declared = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(([, entry]) => 'skipReason' in entry)
      .map(([code]) => code)
      .sort();

    expect([...CONDITIONAL_ISSUE_CODES].sort()).toEqual(declared);
  });

  it('gives every conditional code a non-empty reason', () => {
    for (const code of CONDITIONAL_ISSUE_CODES) {
      expect(skipReasonOf(code)).toMatch(/\S/);
    }
  });

  it('gives null for a code that always applies', () => {
    expect(skipReasonOf('NOT_HTTPS')).toBeNull();
    expect(skipReasonOf('THIN_CONTENT')).toBeNull();
  });
});
