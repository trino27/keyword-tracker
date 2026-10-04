import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { VIEWPORT_MISSING_CHECK } from './viewport-missing.check';

describe('VIEWPORT_MISSING', () => {
  it('fires only when the tag is absent', () => {
    expect(
      VIEWPORT_MISSING_CHECK.evaluate(
        makeCheckInput({ parsed: { viewport: null } }),
      ),
    ).toEqual(failsWith({}));
    expect(VIEWPORT_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  // The content is not judged: which values render well is a question the HTML cannot
  // answer, and a page declaring something unusual has still declared one.
  it('accepts any content the tag carries', () => {
    expect(
      VIEWPORT_MISSING_CHECK.evaluate(
        makeCheckInput({ parsed: { viewport: 'width=1024' } }),
      ),
    ).toEqual(PASSES);
  });
});
