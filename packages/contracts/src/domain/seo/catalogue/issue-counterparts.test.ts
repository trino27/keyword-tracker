import { describe, expect, it } from 'vitest';
import {
  ISSUE_OWNERS,
  LIGHTHOUSE_ISSUE_CODES,
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
    expect(counterpartGroupOf('LH_COLOR_CONTRAST')).toBeNull();
  });

  /**
   * The review point (lighthouse-checks D10): a Lighthouse code added to the catalogue
   * lands here and fails this test until someone decides whether one of our checks looks
   * at the same thing. Moving it into a group, or into this list, is that decision.
   */
  it('leaves exactly these Lighthouse codes without a counterpart of ours', () => {
    const grouped = new Set(GROUPS.flatMap(codesOf));
    expect(LIGHTHOUSE_ISSUE_CODES.filter((code) => !grouped.has(code))).toEqual(
      [
        'LH_HTTP_STATUS_CODE',
        'LH_LINK_TEXT',
        'LH_ROBOTS_TXT',
        'LH_ACCESSKEYS',
        'LH_ARIA_ALLOWED_ATTR',
        'LH_ARIA_COMMAND_NAME',
        'LH_ARIA_CONDITIONAL_ATTR',
        'LH_ARIA_DEPRECATED_ROLE',
        'LH_ARIA_DIALOG_NAME',
        'LH_ARIA_HIDDEN_BODY',
        'LH_ARIA_HIDDEN_FOCUS',
        'LH_ARIA_INPUT_FIELD_NAME',
        'LH_ARIA_METER_NAME',
        'LH_ARIA_PROGRESSBAR_NAME',
        'LH_ARIA_PROHIBITED_ATTR',
        'LH_ARIA_REQUIRED_ATTR',
        'LH_ARIA_REQUIRED_CHILDREN',
        'LH_ARIA_REQUIRED_PARENT',
        'LH_ARIA_ROLES',
        'LH_ARIA_TEXT',
        'LH_ARIA_TOGGLE_FIELD_NAME',
        'LH_ARIA_TOOLTIP_NAME',
        'LH_ARIA_TREEITEM_NAME',
        'LH_ARIA_VALID_ATTR_VALUE',
        'LH_ARIA_VALID_ATTR',
        'LH_BUTTON_NAME',
        'LH_BYPASS',
        'LH_COLOR_CONTRAST',
        'LH_DEFINITION_LIST',
        'LH_DLITEM',
        'LH_DUPLICATE_ID_ARIA',
        'LH_FORM_FIELD_MULTIPLE_LABELS',
        'LH_FRAME_TITLE',
        'LH_HTML_LANG_VALID',
        'LH_HTML_XML_LANG_MISMATCH',
        'LH_INPUT_BUTTON_NAME',
        'LH_INPUT_IMAGE_ALT',
        'LH_LABEL',
        'LH_LINK_IN_TEXT_BLOCK',
        'LH_LIST',
        'LH_LISTITEM',
        'LH_META_VIEWPORT',
        'LH_OBJECT_ALT',
        'LH_SELECT_NAME',
        'LH_SKIP_LINK',
        'LH_TABINDEX',
        'LH_TARGET_SIZE',
        'LH_TD_HEADERS_ATTR',
        'LH_TH_HAS_DATA_CELLS',
        'LH_VALID_LANG',
        'LH_VIDEO_CAPTION',
        'LH_LANDMARK_ONE_MAIN',
        'LH_AUTOCOMPLETE_VALID',
        'LH_PRESENTATION_ROLE_CONFLICT',
        'LH_SVG_IMG_ALT',
      ],
    );
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
