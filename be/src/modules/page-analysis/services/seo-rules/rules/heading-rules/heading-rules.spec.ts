import type { IHeading } from '../../../../interfaces/parsed-page.interface';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { HEADING_RULES } from './heading-rules';

const outline = (...levels: IHeading['level'][]) =>
  makeRuleInput({
    parsed: { headings: levels.map((level) => ({ level, text: `H${level}` })) },
  });

describe('HEADING_RULES', () => {
  it.each([
    [[], { H1_MISSING: {}, H1_MULTIPLE: null }],
    [['One'], { H1_MISSING: null, H1_MULTIPLE: null }],
    [['One', 'Two'], { H1_MISSING: null, H1_MULTIPLE: { count: 2 } }],
  ])('h1s %j', (h1s, expected) => {
    const input = makeRuleInput({ parsed: { h1s } });

    expect({
      H1_MISSING: HEADING_RULES.H1_MISSING(input),
      H1_MULTIPLE: HEADING_RULES.H1_MULTIPLE(input),
    }).toEqual(expected);
  });

  it('HEADING_SKIP reports the first jump of more than one level', () => {
    expect(HEADING_RULES.HEADING_SKIP(outline(1, 2, 4, 6))).toEqual({
      from: 'h2',
      to: 'h4',
      heading: 'H4',
    });
  });

  it('HEADING_SKIP allows going back up and one level down', () => {
    expect(HEADING_RULES.HEADING_SKIP(outline(1, 2, 3, 2, 3, 1, 2))).toBeNull();
    expect(HEADING_RULES.HEADING_SKIP(outline())).toBeNull();
  });
});
