import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TLighthouseCategory } from '../issue-definition.interface';
import { ACTIVE_LIGHTHOUSE_CODES } from '../issue-catalogues.constant';
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

  it('gives each code the severity its audit earns', () => {
    for (const [code, entry] of ENTRIES)
      expect({ code, severity: entry.severity }).toEqual({
        code,
        severity: lighthouseSeverityOf(entry.audit),
      });
  });

  /** The accessibility audits are retired: Lighthouse's accessibility score stands for them. */
  it('makes the audits Lighthouse weighs in SEO its active codes, and no other', () => {
    expect(
      ACTIVE_LIGHTHOUSE_CODES.map(
        (code) => LIGHTHOUSE_CATALOGUE[code].audit,
      ).sort(),
    ).toEqual(
      CONFIG.categories.seo
        .filter((ref) => ref.weight > 0)
        .map((ref) => ref.id)
        .sort(),
    );
  });
});

describe('lighthouseSeverityOf', () => {
  /** SEO weighs its audits alike; an accessibility weight no longer makes a warning. */
  it('makes an SEO audit a notice', () => {
    expect(lighthouseSeverityOf('canonical')).toBe('notice');
    expect(lighthouseSeverityOf('image-alt')).toBe('notice');
  });

  /** A page Lighthouse finds blocked from indexing falls out of search: as NOINDEX is. */
  it('makes is-crawlable an error', () => {
    expect(lighthouseSeverityOf('is-crawlable')).toBe('error');
  });
});
