import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { TITLE_MISSING_CHECK } from './title-missing.check';

const withTitle = (title: string | null) =>
  makeCheckInput({ parsed: { title } });

describe('TITLE_MISSING', () => {
  it('fires only without a title', () => {
    expect(TITLE_MISSING_CHECK.evaluate(withTitle(null))).toEqual(
      failsWith({}),
    );
    expect(TITLE_MISSING_CHECK.evaluate(withTitle('Anything'))).toEqual(PASSES);
  });
});
