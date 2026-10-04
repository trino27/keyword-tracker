import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { LANG_MISSING_CHECK } from './lang-missing.check';

describe('LANG_MISSING', () => {
  it('fires only without a lang attribute', () => {
    expect(
      LANG_MISSING_CHECK.evaluate(makeCheckInput({ parsed: { lang: null } })),
    ).toEqual(failsWith({}));
    expect(LANG_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });
});
