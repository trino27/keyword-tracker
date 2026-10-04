import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { H1_MISSING_CHECK } from './h1-missing.check';

describe('H1_MISSING', () => {
  it.each([
    [[], failsWith({})],
    [['One'], PASSES],
    [['One', 'Two'], PASSES],
  ])('h1s %j', (h1s, expected) => {
    expect(
      H1_MISSING_CHECK.evaluate(makeCheckInput({ parsed: { h1s } })),
    ).toEqual(expected);
  });
});
