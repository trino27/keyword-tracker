import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
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

  // The title the author already wrote for sharing is the fastest fix, so it is quoted.
  it('quotes og:title beside the absence', () => {
    expect(
      evidenceOf(
        TITLE_MISSING_CHECK.evaluate(
          makeCheckInput({
            parsed: { title: null, openGraph: { 'og:title': 'Link building' } },
          }),
        ),
      ),
    ).toEqual([
      'No <title> element in <head>',
      '<meta property="og:title" content="Link building"> — written for sharing, not read as the page title',
    ]);
  });
});
