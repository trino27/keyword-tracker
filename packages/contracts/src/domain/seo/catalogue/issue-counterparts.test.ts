import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LIGHTHOUSE_CODES,
  ISSUE_OWNERS,
  SEO_ISSUE_CATALOGUE,
} from './issue-catalogues.constant';
import {
  ISSUE_COUNTERPARTS,
  counterpartGroupOf,
  whyCounterpartsDiffer,
  type ICounterpartGroup,
} from './issue-counterparts.constant';

const GROUPS: readonly ICounterpartGroup[] = ISSUE_COUNTERPARTS;
const codesOf = (group: ICounterpartGroup): string[] =>
  Object.values(group).flatMap((codes) => [...(codes ?? [])]);

describe('the counterpart groups', () => {
  /** A code in two groups would be drawn on two rows, with one of its verdicts twice. */
  it('puts a code in at most one group', () => {
    const all = GROUPS.flatMap(codesOf);
    expect(all.filter((code, i) => all.indexOf(code) !== i)).toEqual([]);
  });

  it('spans at least two owners in every group', () => {
    for (const group of GROUPS)
      expect(Object.keys(group).length).toBeGreaterThanOrEqual(2);
  });

  it('files each code under the owner whose catalogue holds it', () => {
    for (const group of GROUPS)
      for (const owner of ISSUE_OWNERS)
        for (const code of group[owner] ?? [])
          expect({ code, owner: SEO_ISSUE_CATALOGUE[code].owner }).toEqual({
            code,
            owner,
          });
  });

  it("holds the five canonical codes and Lighthouse's canonical in one group", () => {
    expect(counterpartGroupOf('CANONICAL_RELATIVE')).toEqual({
      crawl: [
        'CANONICAL_MISSING',
        'CANONICAL_MISMATCH',
        'CANONICAL_TO_HTTP',
        'CANONICAL_CONFLICT',
        'CANONICAL_RELATIVE',
      ],
      lighthouse: ['LH_CANONICAL'],
    });
  });

  it('gives a code no other owner checks no group', () => {
    expect(counterpartGroupOf('THIN_CONTENT')).toBeNull();
    expect(counterpartGroupOf('LH_ROBOTS_TXT')).toBeNull();
    expect(counterpartGroupOf('LH_LINK_NAME')).toBeNull();
  });

  /**
   * The review point (lighthouse-checks D10): a Lighthouse code added to the catalogue
   * lands here and fails this test until someone decides whether one of our checks looks
   * at the same thing. Moving it into a group, or into this list, is that decision.
   */
  it('leaves exactly these Lighthouse codes without a counterpart of ours', () => {
    const grouped = new Set(GROUPS.flatMap(codesOf));
    expect(
      ACTIVE_LIGHTHOUSE_CODES.filter((code) => !grouped.has(code)),
    ).toEqual(['LH_HTTP_STATUS_CODE', 'LH_LINK_TEXT', 'LH_ROBOTS_TXT']);
  });

  /** A retired audit is listed nowhere, so a group holding one would draw a half-empty row. */
  it('pairs only the Lighthouse codes that are checks', () => {
    for (const group of GROUPS)
      for (const code of group.lighthouse ?? [])
        expect(ACTIVE_LIGHTHOUSE_CODES).toContain(code);
  });

  /** The screen says why a disagreement is expected; a group without a reason would say nothing. */
  it('gives every group a reason its two verdicts can differ, found from either side', () => {
    for (const group of GROUPS) {
      const reasons = codesOf(group).map((code) =>
        whyCounterpartsDiffer(
          code as Parameters<typeof whyCounterpartsDiffer>[0],
        ),
      );
      expect(new Set(reasons).size).toBe(1);
      expect(reasons[0]).toMatch(/Lighthouse/);
    }
    expect(whyCounterpartsDiffer('THIN_CONTENT')).toBeNull();
  });
});
