import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_MISSING_CHECK } from './canonical-missing.check';

describe('CANONICAL_MISSING', () => {
  it('fires only without a canonical', () => {
    expect(
      CANONICAL_MISSING_CHECK.evaluate(
        makeCheckInput({ parsed: { canonical: null } }),
      ),
    ).toEqual(failsWith({}));
    expect(CANONICAL_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });
});
