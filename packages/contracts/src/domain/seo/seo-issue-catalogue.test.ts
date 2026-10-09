import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ISSUE_CODES,
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
  it('holds every code the catalogue has not retired', () => {
    const running = Object.entries(SEO_ISSUE_CATALOGUE)
      .filter(([, entry]) => !('enabled' in entry))
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

  /** Nothing is retired today; this says so out loud rather than by silence. */
  it('runs every catalogued check right now', () => {
    expect([...ACTIVE_ISSUE_CODES].sort()).toEqual([...SEO_ISSUE_CODES].sort());
  });
});
