import type { IHeading } from '../../../../interfaces/parsed-page.interface';
import {
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { HEADING_RULES } from './heading-rules';

const outline = (...levels: IHeading['level'][]) =>
  makeRuleInput({
    parsed: { headings: levels.map((level) => ({ level, text: `H${level}` })) },
  });

describe('HEADING_RULES', () => {
  it.each([
    [[], { H1_MISSING: failsWith({}), H1_MULTIPLE: PASSES }],
    [['One'], { H1_MISSING: PASSES, H1_MULTIPLE: PASSES }],
    [
      ['One', 'Two'],
      { H1_MISSING: PASSES, H1_MULTIPLE: failsWith({ count: 2 }) },
    ],
  ])('h1s %j', (h1s, expected) => {
    const input = makeRuleInput({ parsed: { h1s } });

    expect({
      H1_MISSING: HEADING_RULES.H1_MISSING(input),
      H1_MULTIPLE: HEADING_RULES.H1_MULTIPLE(input),
    }).toEqual(expected);
  });

  it('HEADING_SKIP reports the first jump of more than one level', () => {
    expect(HEADING_RULES.HEADING_SKIP(outline(1, 2, 4, 6))).toEqual(
      failsWith({ from: 'h2', to: 'h4', heading: 'H4' }),
    );
  });

  it('HEADING_SKIP allows going back up and one level down', () => {
    expect(HEADING_RULES.HEADING_SKIP(outline(1, 2, 3, 2, 3, 1, 2))).toEqual(
      PASSES,
    );
  });

  // One heading is no outline. Judging it passed would reward a page for having nothing
  // to get wrong, which is the opposite of what an outline check is for.
  it.each([[[]], [[1 as const]]])(
    'HEADING_SKIP cannot be judged on %j headings',
    (levels) => {
      expect(HEADING_RULES.HEADING_SKIP(outline(...levels))).toEqual(
        NOT_APPLICABLE,
      );
    },
  );
});
