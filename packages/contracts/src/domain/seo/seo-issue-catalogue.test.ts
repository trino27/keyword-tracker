import { describe, expect, it } from 'vitest';
import {
  PAGE_ISSUE_CODES,
  RUN_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
} from './seo-issue-catalogue.constant';

describe('the catalogue split by scope', () => {
  it('partitions the catalogue: every code in exactly one list', () => {
    expect([...PAGE_ISSUE_CODES, ...RUN_ISSUE_CODES].sort()).toEqual(
      [...SEO_ISSUE_CODES].sort(),
    );
    const overlap = PAGE_ISSUE_CODES.filter((code) =>
      (RUN_ISSUE_CODES as string[]).includes(code),
    );
    expect(overlap).toEqual([]);
  });

  it('holds exactly the entries that declare run scope', () => {
    const declared = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(([, entry]) => 'scope' in entry)
      .map(([code]) => code)
      .sort();

    expect([...RUN_ISSUE_CODES].sort()).toEqual(declared);
  });

  /**
   * Pinned by name: a run-scoped code is answered by a different registry and read
   * from several pages at once, so adding one is a decision rather than a rule.
   */
  it('is exactly the checks that compare a page with the rest of the crawl', () => {
    expect([...RUN_ISSUE_CODES].sort()).toEqual([
      'KEYWORD_CANNIBALISATION',
      'META_DESCRIPTION_DUPLICATE',
      'TITLE_DUPLICATE',
    ]);
  });

  it('gives every run check a skip reason, since a run of one cannot answer it', () => {
    for (const code of RUN_ISSUE_CODES) {
      expect(SEO_ISSUE_CATALOGUE[code].skipReason).toMatch(/\S/);
    }
  });
});
