import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TLighthouseCategory } from '../issue-definition.interface';
import { LIGHTHOUSE_CATALOGUE } from './lighthouse-catalogue.constant';
import { lighthouseSeverityOf } from './lighthouse-severity.util';

interface IAuditRef {
  id: string;
  weight: number;
  group: string | null;
}

/**
 * Lighthouse's own configuration for the version PageSpeed runs, snapshotted with its
 * source. An answer cannot stand in for it: it reports weight 0 for every audit that did not
 * apply to the page it measured.
 */
const CONFIG = JSON.parse(
  readFileSync(
    new URL('./lighthouse-audits.fixture.json', import.meta.url),
    'utf8',
  ),
) as { categories: Record<TLighthouseCategory, IAuditRef[]> };

/** Every audit Lighthouse scores, with its weight in each category that scores it. */
const SCORED = new Map<string, Partial<Record<TLighthouseCategory, number>>>();
for (const category of ['seo', 'accessibility'] as const)
  for (const ref of CONFIG.categories[category])
    if (ref.weight > 0)
      SCORED.set(ref.id, { ...SCORED.get(ref.id), [category]: ref.weight });

const ENTRIES = Object.entries(LIGHTHOUSE_CATALOGUE) as [
  string,
  {
    audit: string;
    weights: Partial<Record<TLighthouseCategory, number>>;
    severity: string;
  },
][];

describe("Lighthouse's catalogue", () => {
  it('holds one code per audit Lighthouse scores in SEO or accessibility, and no other', () => {
    expect(ENTRIES.map(([, entry]) => entry.audit).sort()).toEqual(
      [...SCORED.keys()].sort(),
    );
  });

  it("declares each audit's weights as Lighthouse's configuration gives them", () => {
    for (const [code, entry] of ENTRIES)
      expect({ code, weights: entry.weights }).toEqual({
        code,
        weights: SCORED.get(entry.audit),
      });
  });

  it('names each code after its audit', () => {
    for (const [code, entry] of ENTRIES)
      expect(code).toBe(`LH_${entry.audit.toUpperCase().replace(/-/g, '_')}`);
  });

  it('gives each code the severity its highest weight earns', () => {
    for (const [code, entry] of ENTRIES)
      expect({ code, severity: entry.severity }).toEqual({
        code,
        severity: lighthouseSeverityOf(entry.audit, entry.weights),
      });
  });
});

describe('lighthouseSeverityOf', () => {
  it('makes a weight of 7 or more a warning', () => {
    expect(lighthouseSeverityOf('color-contrast', { accessibility: 7 })).toBe(
      'warning',
    );
  });

  it('makes a lighter audit a notice', () => {
    expect(lighthouseSeverityOf('heading-order', { accessibility: 3 })).toBe(
      'notice',
    );
    expect(lighthouseSeverityOf('canonical', { seo: 1 })).toBe('notice');
  });

  it('reads the highest weight of an audit in both categories', () => {
    expect(
      lighthouseSeverityOf('image-alt', { seo: 1, accessibility: 10 }),
    ).toBe('warning');
  });

  /** A page Lighthouse finds blocked from indexing falls out of search: as NOINDEX is. */
  it('makes is-crawlable an error whatever its weight', () => {
    expect(lighthouseSeverityOf('is-crawlable', { seo: 4.043 })).toBe('error');
  });
});
