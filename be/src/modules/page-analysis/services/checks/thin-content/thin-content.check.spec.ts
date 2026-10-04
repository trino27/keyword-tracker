import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { THIN_CONTENT_CHECK } from './thin-content.check';

describe('THIN_CONTENT', () => {
  it.each([
    [299, failsWith({ value: 299, min: 300 })],
    [300, PASSES],
  ])('at %d words', (wordCount, expected) => {
    expect(
      THIN_CONTENT_CHECK.evaluate(makeCheckInput({ parsed: { wordCount } })),
    ).toEqual(expected);
  });

  it('always applies, even to an empty page', () => {
    expect(
      THIN_CONTENT_CHECK.evaluate(makeCheckInput({ parsed: { wordCount: 0 } })),
    ).toEqual(failsWith({ value: 0, min: 300 }));
  });
});
