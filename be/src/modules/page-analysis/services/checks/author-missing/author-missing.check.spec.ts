import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { AUTHOR_MISSING_CHECK } from './author-missing.check';

describe('AUTHOR_MISSING', () => {
  it('passes a page that names its author in any way the markup identifies', () => {
    expect(AUTHOR_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
    expect(
      AUTHOR_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { authors: ['<meta name="author" content="Jane Doe">'] },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('fails a page that names nobody, saying where it looked', () => {
    const verdict = AUTHOR_MISSING_CHECK.evaluate(
      makeCheckInput({ parsed: { authors: [] } }),
    );

    expect(verdict).toEqual(failsWith({}));
    expect(evidenceOf(verdict)).toEqual([
      'No author in the article markup, no <meta name="author">, no rel="author" link, no itemprop="author"',
    ]);
  });
});
