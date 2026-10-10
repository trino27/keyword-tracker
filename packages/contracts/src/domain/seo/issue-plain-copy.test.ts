import { describe, expect, it } from 'vitest';
import { SITE_CHECK_CATALOGUE } from '../site/site-check-catalogue.constant';
import {
  FIX_AUDIENCE_WORDS,
  PLAIN_COPY_LIMITS,
  type IPlainCopy,
} from './plain-copy.interface';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';

const entries: [string, IPlainCopy][] = [
  ...Object.entries(SEO_ISSUE_CATALOGUE).map(
    ([code, entry]) => [code, entry.plain] as [string, IPlainCopy],
  ),
  ...Object.entries(SITE_CHECK_CATALOGUE).map(
    ([code, entry]) => [code, entry.plain] as [string, IPlainCopy],
  ),
];

describe('the plain copy a marketer reads', () => {
  it('covers every page, speed and site entry', () => {
    expect(entries).toHaveLength(
      Object.keys(SEO_ISSUE_CATALOGUE).length +
        Object.keys(SITE_CHECK_CATALOGUE).length,
    );
  });

  it.each(entries)('%s carries what, why and fix', (_, plain) => {
    for (const field of ['what', 'why', 'fix'] as const) {
      expect(plain[field].trim()).toBe(plain[field]);
      expect(plain[field].length).toBeGreaterThanOrEqual(
        PLAIN_COPY_LIMITS[field].min,
      );
    }
  });

  /** Markup is the developer's vocabulary; the explanation keeps it, this does not. */
  it.each(entries)('%s has no < or > in its plain copy', (_, plain) => {
    expect(`${plain.what} ${plain.why} ${plain.fix}`).not.toMatch(/[<>]/);
  });

  it.each(entries)('%s stays within its bounds', (_, plain) => {
    for (const field of ['what', 'why', 'fix'] as const) {
      expect(plain[field].length).toBeLessThanOrEqual(
        PLAIN_COPY_LIMITS[field].max,
      );
    }
  });

  it.each(entries)('%s says in its fix who does it', (_, plain) => {
    const fix = plain.fix.toLowerCase();
    expect(
      FIX_AUDIENCE_WORDS.some((word) => fix.includes(word.toLowerCase())),
    ).toBe(true);
  });

  it('gives no two entries the same title', () => {
    const titles = entries.map(([, plain]) => plain.what);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
