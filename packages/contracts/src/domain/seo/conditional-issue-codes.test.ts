import { describe, expect, it } from 'vitest';
import {
  CONDITIONAL_ISSUE_CODES,
  skipReasonOf,
} from './conditional-issue-codes.constant';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';

describe('CONDITIONAL_ISSUE_CODES', () => {
  /**
   * Pinned by name, not by count: a sixth conditional check must be a conscious edit
   * here, which is the prompt to give it a reason rather than ship an empty line.
   */
  it('is exactly the five codes whose rule can skip', () => {
    expect([...CONDITIONAL_ISSUE_CODES].sort()).toEqual([
      'CANONICAL_MISMATCH',
      'HEADING_SKIP',
      'IMAGES_MISSING_ALT',
      'META_DESCRIPTION_LENGTH',
      'TITLE_LENGTH',
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
