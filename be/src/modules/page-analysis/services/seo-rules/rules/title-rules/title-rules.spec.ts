import { makeRuleInput } from '../../_testing/make-rule-input';
import { TITLE_RULES } from './title-rules';

const withTitle = (title: string | null) =>
  makeRuleInput({ parsed: { title } });

describe('TITLE_RULES', () => {
  it('TITLE_MISSING fires only without a title', () => {
    expect(TITLE_RULES.TITLE_MISSING(withTitle(null))).toEqual({});
    expect(TITLE_RULES.TITLE_MISSING(withTitle('Anything'))).toBeNull();
  });

  it.each([
    [29, { value: 29, min: 30, max: 60 }],
    [30, null],
    [60, null],
    [61, { value: 61, min: 30, max: 60 }],
  ])('TITLE_LENGTH at %d characters', (length, expected) => {
    expect(TITLE_RULES.TITLE_LENGTH(withTitle('x'.repeat(length)))).toEqual(
      expected,
    );
  });

  it('TITLE_LENGTH counts characters, not UTF-16 units, and skips a missing title', () => {
    expect(TITLE_RULES.TITLE_LENGTH(withTitle('🙂'.repeat(30)))).toBeNull();
    expect(TITLE_RULES.TITLE_LENGTH(withTitle(null))).toBeNull();
  });
});
