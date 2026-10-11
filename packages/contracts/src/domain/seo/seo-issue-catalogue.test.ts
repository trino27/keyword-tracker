import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ISSUE_CODES,
  CRAWL_ISSUE_CODES,
  ISSUE_CATALOGUES,
  ISSUE_OWNERS,
  LIGHTHOUSE_ISSUE_CODES,
  SCORED_ISSUE_OWNERS,
  issueCodesOf,
  PAGE_ISSUE_CODES,
  PAGE_SPEED_ISSUE_CODES,
  RUN_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
} from './catalogue/issue-catalogues.constant';
import { CWV_ISSUE_CODES } from '../page-speed/cwv-issue-codes.constant';
import { CWV_THRESHOLDS } from '../page-speed/cwv-thresholds.constant';
import { CWV_METRICS } from '../page-speed/cwv-metric.enum';
import { SITE_CHECK_CATALOGUE } from '../site/site-check-catalogue.constant';
import { inclusionBarViolations } from './inclusion-bar/inclusion-bar.util';

describe('the owner registry', () => {
  it('derives the owners from the registry: crawl, pageSpeed, lighthouse', () => {
    expect([...ISSUE_OWNERS].sort()).toEqual([
      'crawl',
      'lighthouse',
      'pageSpeed',
    ]);
    expect(ISSUE_OWNERS).toEqual(Object.keys(ISSUE_CATALOGUES));
  });

  /**
   * The owner is the key an entry sits under, stamped onto the flattened catalogue — so an
   * entry cannot claim one owner while living in another's catalogue.
   */
  it('stamps each entry with the owner whose catalogue holds it', () => {
    for (const owner of ISSUE_OWNERS)
      for (const code of issueCodesOf(owner))
        expect({ code, owner: SEO_ISSUE_CATALOGUE[code].owner }).toEqual({
          code,
          owner,
        });
  });

  it('no code belongs to two owners', () => {
    const all = ISSUE_OWNERS.flatMap((owner) => issueCodesOf(owner));
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...SEO_ISSUE_CODES].sort());
  });

  it('the crawl and Lighthouse are scored, the Core Web Vitals are not', () => {
    expect([...SCORED_ISSUE_OWNERS].sort()).toEqual(['crawl', 'lighthouse']);
  });

  it("gives the crawl's code list none of Lighthouse's", () => {
    const crawl = new Set<string>(CRAWL_ISSUE_CODES);
    expect(LIGHTHOUSE_ISSUE_CODES.filter((code) => crawl.has(code))).toEqual(
      [],
    );
  });
});

describe('the catalogue split by owner', () => {
  /**
   * Each writer replaces only its own codes, so a code in both sets would be deleted by
   * one writer's replace and re-added by the other's, and a code in neither would never
   * be cleared at all.
   */
  it("partitions the catalogue by owner: every code in exactly one writer's set", () => {
    expect(
      [
        ...CRAWL_ISSUE_CODES,
        ...PAGE_SPEED_ISSUE_CODES,
        ...LIGHTHOUSE_ISSUE_CODES,
      ].sort(),
    ).toEqual([...SEO_ISSUE_CODES].sort());
    const overlap = CRAWL_ISSUE_CODES.filter((code) =>
      (PAGE_SPEED_ISSUE_CODES as string[]).includes(code),
    );
    expect(overlap).toEqual([]);
  });

  it('gives the PageSpeed worker exactly the six Core Web Vitals codes', () => {
    expect([...PAGE_SPEED_ISSUE_CODES].sort()).toEqual([
      'CWV_CLS_NEEDS_IMPROVEMENT',
      'CWV_CLS_POOR',
      'CWV_INP_NEEDS_IMPROVEMENT',
      'CWV_INP_POOR',
      'CWV_LCP_NEEDS_IMPROVEMENT',
      'CWV_LCP_POOR',
    ]);
  });

  /**
   * The badge reads the thresholds, the finding reads the catalogue's bound; if they
   * drifted, a yellow badge could sit beside no finding, or a finding beside a green one.
   */
  it("each CWV code's max is its metric's threshold for its band", () => {
    for (const metric of CWV_METRICS) {
      expect(
        SEO_ISSUE_CATALOGUE[CWV_ISSUE_CODES[metric].needsImprovement].max,
      ).toBe(CWV_THRESHOLDS[metric].good);
      expect(SEO_ISSUE_CATALOGUE[CWV_ISSUE_CODES[metric].poor].max).toBe(
        CWV_THRESHOLDS[metric].poor,
      );
    }
  });

  /** D10: falling out of search is Critical; a slow page shows, so it is at most Important. */
  it('makes a poor metric a warning and one that needs improvement a notice', () => {
    for (const metric of CWV_METRICS) {
      expect(SEO_ISSUE_CATALOGUE[CWV_ISSUE_CODES[metric].poor].severity).toBe(
        'warning',
      );
      expect(
        SEO_ISSUE_CATALOGUE[CWV_ISSUE_CODES[metric].needsImprovement].severity,
      ).toBe('notice');
    }
  });
});

describe('the catalogue split by scope', () => {
  it("partitions the crawl's codes: every one in exactly one list", () => {
    expect([...PAGE_ISSUE_CODES, ...RUN_ISSUE_CODES].sort()).toEqual(
      [...CRAWL_ISSUE_CODES].sort(),
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
      'NEAR_DUPLICATE_CONTENT',
      'TITLE_DUPLICATE',
    ]);
  });

  it('gives every run check a skip reason, since a run of one cannot answer it', () => {
    for (const code of RUN_ISSUE_CODES) {
      expect(SEO_ISSUE_CATALOGUE[code].skipReason).toMatch(/\S/);
    }
  });
});

describe('what the catalogue tells a reader', () => {
  /**
   * A finding is only as useful as the reader's ability to weigh it, so every check says
   * why it exists at length and names where that comes from. Pinned for every code, so a
   * check cannot be added with a label and nothing behind it.
   */
  it('explains every check in more than one sentence', () => {
    for (const code of SEO_ISSUE_CODES) {
      const { explanation } = SEO_ISSUE_CATALOGUE[code];
      expect(
        explanation.split(/[.!?](\s|$)/).filter((s) => s.trim()).length,
      ).toBeGreaterThan(1);
    }
  });

  /** Plan D1: an industry reading of search, unbacked by a first party, is at most a notice. */
  it('holds the inclusion bar: no industry-only check above notice', () => {
    expect(inclusionBarViolations(SEO_ISSUE_CATALOGUE)).toEqual([]);
    expect(inclusionBarViolations(SITE_CHECK_CATALOGUE)).toEqual([]);
  });

  it('backs every check with at least one https source', () => {
    for (const code of SEO_ISSUE_CODES) {
      const { sources } = SEO_ISSUE_CATALOGUE[code];
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        expect(source.title).toMatch(/\S/);
        expect(new URL(source.url).protocol).toBe('https:');
      }
    }
  });
});

describe('the catalogue split by whether the check still runs', () => {
  it('holds every crawl code the catalogue has not retired', () => {
    const running = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(([, entry]) => entry.owner === 'crawl' && !('enabled' in entry))
      .map(([code]) => code)
      .sort();

    expect([...ACTIVE_ISSUE_CODES].sort()).toEqual(running);
  });

  /**
   * A retired code keeps its entry on purpose, so a finding stored under it still has a
   * label, a hint and a severity to be read back with. Pinned because deleting the entry
   * is the obvious shortcut and it breaks pages already crawled.
   */
  it('leaves a retired code in the catalogue it was retired from', () => {
    for (const code of SEO_ISSUE_CODES) {
      expect(SEO_ISSUE_CATALOGUE[code].label).toMatch(/\S/);
      expect(SEO_ISSUE_CATALOGUE[code].hint).toMatch(/\S/);
    }
    expect(ACTIVE_ISSUE_CODES.length).toBeLessThanOrEqual(
      SEO_ISSUE_CODES.length,
    );
  });

  /**
   * Nothing is retired today; this says so out loud rather than by silence. The speed
   * codes are not checks — no crawl runs them — so they are never active.
   */
  it('runs every catalogued crawl check right now', () => {
    expect([...ACTIVE_ISSUE_CODES].sort()).toEqual(
      [...CRAWL_ISSUE_CODES].sort(),
    );
  });
});
