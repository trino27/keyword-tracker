import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { TITLE_LENGTH_CHECK } from './title-length.check';

const withTitle = (title: string | null) =>
  makeCheckInput({ parsed: { title } });

describe('TITLE_LENGTH', () => {
  it.each([
    [29, failsWith({ value: 29, min: 30, max: 60 })],
    [30, PASSES],
    [60, PASSES],
    [61, failsWith({ value: 61, min: 30, max: 60 })],
  ])('at %d characters', (length, expected) => {
    expect(TITLE_LENGTH_CHECK.evaluate(withTitle('x'.repeat(length)))).toEqual(
      expected,
    );
  });

  it('counts characters, not UTF-16 units', () => {
    expect(
      TITLE_LENGTH_CHECK.evaluate(withTitle('\u{1F642}'.repeat(30))),
    ).toEqual(PASSES);
  });

  // Not `pass`: a page with no title has not satisfied the length rule, it has escaped it.
  // Counted as passed, it would be rewarded for the very absence TITLE_MISSING fails it for.
  it('cannot be judged without a title', () => {
    expect(TITLE_LENGTH_CHECK.evaluate(withTitle(null))).toEqual(
      NOT_APPLICABLE,
    );
  });
});
