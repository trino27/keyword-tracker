import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { META_DESCRIPTION_MISSING_CHECK } from './meta-description-missing.check';

describe('META_DESCRIPTION_MISSING', () => {
  it('fires only without a description', () => {
    expect(
      META_DESCRIPTION_MISSING_CHECK.evaluate(
        makeCheckInput({ parsed: { metaDescription: null } }),
      ),
    ).toEqual(failsWith({}));
    expect(META_DESCRIPTION_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
  });
});
