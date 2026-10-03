import { describe, expect, it } from 'vitest';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';
import { MEASURED_ISSUE_CODES } from './measured-issue-codes.constant';

describe('MEASURED_ISSUE_CODES', () => {
  it('is exactly the four bounded codes', () => {
    expect([...MEASURED_ISSUE_CODES].sort()).toEqual([
      'LARGE_PAGE',
      'META_DESCRIPTION_LENGTH',
      'THIN_CONTENT',
      'TITLE_LENGTH',
    ]);
  });

  it('holds every catalogue entry that declares a min or a max', () => {
    const bounded = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(([, entry]) => 'min' in entry || 'max' in entry)
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
