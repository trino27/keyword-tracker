import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { META_DESCRIPTION_LENGTH_CHECK } from './meta-description-length.check';

describe('META_DESCRIPTION_LENGTH', () => {
  it.each([
    [69, failsWith({ value: 69, min: 70, max: 160 })],
    [70, PASSES],
    [160, PASSES],
    [161, failsWith({ value: 161, min: 70, max: 160 })],
  ])('at %d characters', (length, expected) => {
    expect(
      META_DESCRIPTION_LENGTH_CHECK.evaluate(
        makeCheckInput({ parsed: { metaDescription: 'd'.repeat(length) } }),
      ),
    ).toEqual(expected);
  });

  it('cannot be judged without a description', () => {
    expect(
      META_DESCRIPTION_LENGTH_CHECK.evaluate(
        makeCheckInput({ parsed: { metaDescription: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
