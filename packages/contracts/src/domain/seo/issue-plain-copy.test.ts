import { describe, expect, it } from 'vitest';
import { SITE_CHECK_CATALOGUE } from '../site/site-check-catalogue.constant';
import {
  FIX_AUDIENCE_WORDS,
  PLAIN_COPY_LIMITS,
  type IPlainCopy,
} from './plain-copy.interface';
import { SEO_ISSUE_CATALOGUE } from './seo-issue-catalogue.constant';

/** The entries shown without "What to do", each by decision (plan D33). */
const WITHOUT_FIX = new Set(['SITEMAP_LISTS_NON_INDEXABLE']);

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

  it.each(entries)('%s carries what, why and fix', (code, plain) => {
    expect(plain.fix === undefined).toBe(WITHOUT_FIX.has(code));
    for (const field of ['what', 'why', 'fix'] as const) {
      const text = plain[field];
      if (text === undefined) continue;
      expect(text.trim()).toBe(text);
      expect(text.length).toBeGreaterThanOrEqual(PLAIN_COPY_LIMITS[field].min);
    }
  });

  /** Markup is the developer's vocabulary; the explanation keeps it, this does not. */
  it.each(entries)('%s has no < or > in its plain copy', (_, plain) => {
    expect(`${plain.what} ${plain.why} ${plain.fix ?? ''}`).not.toMatch(/[<>]/);
  });

  it.each(entries)('%s stays within its bounds', (_, plain) => {
    for (const field of ['what', 'why', 'fix'] as const) {
      expect(plain[field]?.length ?? 0).toBeLessThanOrEqual(
        PLAIN_COPY_LIMITS[field].max,
      );
    }
  });

  it.each(entries.filter(([code]) => !WITHOUT_FIX.has(code)))(
    '%s says in its fix who does it',
    (_, plain) => {
      const fix = (plain.fix ?? '').toLowerCase();
      expect(
        FIX_AUDIENCE_WORDS.some((word) => fix.includes(word.toLowerCase())),
      ).toBe(true);
    },
  );

  it('gives no two entries the same title', () => {
    const titles = entries.map(([, plain]) => plain.what);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
