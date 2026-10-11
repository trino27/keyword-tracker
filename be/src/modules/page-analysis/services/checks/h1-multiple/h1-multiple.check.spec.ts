import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { H1_MULTIPLE_CHECK } from './h1-multiple.check';

describe('H1_MULTIPLE', () => {
  it.each([
    [[], PASSES],
    [['One'], PASSES],
    [['One', 'Two'], failsWith({ count: 2 })],
    // moz.com: one title as two <h1>s, CSS showing one per screen width.
    [['One title', 'One Title'], PASSES],
    [['One', 'Two', 'One'], failsWith({ count: 2 })],
  ])('h1s %j', (h1s, expected) => {
    expect(
      H1_MULTIPLE_CHECK.evaluate(makeCheckInput({ parsed: { h1s } })),
    ).toEqual(expected);
  });
});
