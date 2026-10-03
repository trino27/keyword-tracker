import {
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { TITLE_RULES } from './title-rules';

const withTitle = (title: string | null) =>
  makeRuleInput({ parsed: { title } });

describe('TITLE_RULES', () => {
  it('TITLE_MISSING fires only without a title', () => {
    expect(TITLE_RULES.TITLE_MISSING(withTitle(null))).toEqual(failsWith({}));
    expect(TITLE_RULES.TITLE_MISSING(withTitle('Anything'))).toEqual(PASSES);
  });

  it.each([
    [29, failsWith({ value: 29, min: 30, max: 60 })],
    [30, PASSES],
    [60, PASSES],
    [61, failsWith({ value: 61, min: 30, max: 60 })],
  ])('TITLE_LENGTH at %d characters', (length, expected) => {
    expect(TITLE_RULES.TITLE_LENGTH(withTitle('x'.repeat(length)))).toEqual(
      expected,
    );
  });

  it('TITLE_LENGTH counts characters, not UTF-16 units', () => {
    expect(TITLE_RULES.TITLE_LENGTH(withTitle('🙂'.repeat(30)))).toEqual(
      PASSES,
    );
  });

  // Not `pass`: a page with no title has not satisfied the length rule, it has escaped it.
  // Counted as passed, it would be rewarded for the very absence TITLE_MISSING fails it for.
  it('TITLE_LENGTH cannot be judged without a title', () => {
    expect(TITLE_RULES.TITLE_LENGTH(withTitle(null))).toEqual(NOT_APPLICABLE);
  });
});
