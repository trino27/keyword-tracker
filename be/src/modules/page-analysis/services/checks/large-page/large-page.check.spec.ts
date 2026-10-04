import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { LARGE_PAGE_CHECK } from './large-page.check';

describe('LARGE_PAGE', () => {
  it.each([
    [1_048_576, PASSES],
    [1_048_577, failsWith({ value: 1_048_577, max: 1_048_576 })],
  ])('at %d bytes', (htmlBytes, expected) => {
    expect(LARGE_PAGE_CHECK.evaluate(makeCheckInput({ htmlBytes }))).toEqual(
      expected,
    );
  });
});
