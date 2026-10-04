import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { H1_MULTIPLE_CHECK } from './h1-multiple.check';

describe('H1_MULTIPLE', () => {
  it.each([
    [[], PASSES],
    [['One'], PASSES],
    [['One', 'Two'], failsWith({ count: 2 })],
  ])('h1s %j', (h1s, expected) => {
    expect(
      H1_MULTIPLE_CHECK.evaluate(makeCheckInput({ parsed: { h1s } })),
    ).toEqual(expected);
  });
});
