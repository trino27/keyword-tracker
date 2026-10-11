import { describe, expect, it } from 'vitest';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';
import { MEASURED_ISSUE_CODES } from './measured-issue-codes.constant';

describe('MEASURED_ISSUE_CODES', () => {
  it('is exactly the six bounded codes', () => {
    expect([...MEASURED_ISSUE_CODES].sort()).toEqual([
      'DOM_SIZE_LARGE',
      'H1_LENGTH',
      'LARGE_PAGE',
      'META_DESCRIPTION_LENGTH',
      'THIN_CONTENT',
      'TITLE_LENGTH',
    ]);
  });

  /**
   * Crawl codes only: a speed finding is measured too, but it carries a source as well
   * (`ICwvMeasurement`), so it has its own variant on both sides of the wire.
   */
  it('holds every crawl entry that declares a min or a max', () => {
    const bounded = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(
        ([, entry]) =>
          entry.owner === 'crawl' && ('min' in entry || 'max' in entry),
      )
      .map(([code]) => code)
      .sort();

    expect([...MEASURED_ISSUE_CODES].sort()).toEqual(bounded);
  });

  it('holds no entry without a bound', () => {
    for (const code of MEASURED_ISSUE_CODES) {
      const entry = SEO_ISSUE_CATALOGUE[code];
      expect('min' in entry || 'max' in entry).toBe(true);
    }
  });
});
