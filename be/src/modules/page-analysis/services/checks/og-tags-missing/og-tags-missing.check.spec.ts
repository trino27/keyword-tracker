import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { OG_TAGS_MISSING_CHECK } from './og-tags-missing.check';

describe('OG_TAGS_MISSING', () => {
  it('names the missing properties', () => {
    expect(
      OG_TAGS_MISSING_CHECK.evaluate(
        makeCheckInput({ parsed: { openGraph: { 'og:title': 'T' } } }),
      ),
    ).toEqual(failsWith({ missing: ['og:description', 'og:image'] }));
    expect(OG_TAGS_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });
});
