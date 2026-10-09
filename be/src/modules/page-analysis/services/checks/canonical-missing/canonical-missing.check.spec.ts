import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_MISSING_CHECK } from './canonical-missing.check';

describe('CANONICAL_MISSING', () => {
  it('fires only without a canonical', () => {
    const verdict = CANONICAL_MISSING_CHECK.evaluate(
      makeCheckInput({ parsed: { canonicals: [] } }),
    );

    expect(verdict).toEqual(failsWith({ outsideHead: [] }));
    expect(evidenceOf(verdict)).toEqual([
      'No <link rel="canonical"> in <head>, and no canonical Link header',
    ]);
    expect(CANONICAL_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  // Google accepts `Link: <url>; rel="canonical"` as it accepts the tag; a page that
  // declares its canonical only there was reported as having none.
  it('accepts a canonical declared in a Link header', () => {
    expect(
      CANONICAL_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: [] },
          headers: {
            link: '<https://a.example/style.css>; rel=preload; as=style, </post/>; rel="canonical"',
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('ignores a Link header that names no canonical', () => {
    expect(
      CANONICAL_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: [] },
          headers: {
            link: '<https://a.example/wp-json/>; rel="https://api.w.org/"',
          },
        }),
      ),
    ).toEqual(failsWith({}));
  });

  // Google reads the canonical only in <head>. The one in <body> is the author's
  // intention and the evidence of why it did not take.
  it('quotes a canonical written in <body>, which Google ignores', () => {
    const verdict = CANONICAL_MISSING_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          canonicals: [],
          canonicalsOutsideHead: ['https://a.example/post/'],
        },
      }),
    );

    expect(verdict).toEqual(
      failsWith({ outsideHead: ['https://a.example/post/'] }),
    );
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="canonical" href="https://a.example/post/"> — in <body>, where Google does not read it',
    ]);
  });
});
