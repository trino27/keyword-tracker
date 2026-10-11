import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { HREFLANG_NO_SELF_REFERENCE_CHECK } from './hreflang-no-self-reference.check';

const withAlternates = (...alternates: { lang: string; href: string }[]) =>
  makeCheckInput({ parsed: { alternates } });

describe('HREFLANG_NO_SELF_REFERENCE', () => {
  // Google ignores the whole set when the page is not in it, so a correct set of other
  // languages is still a defect on this page.
  it('fails a set that never names this page', () => {
    const verdict = HREFLANG_NO_SELF_REFERENCE_CHECK.evaluate(
      withAlternates(
        { lang: 'de-DE', href: 'https://a.example/de/post/' },
        { lang: 'fr', href: 'https://a.example/fr/post/' },
      ),
    );

    expect(verdict).toEqual(failsWith({ alternates: 2 }));
    expect(evidenceOf(verdict)).toEqual([
      'None of the 2 alternates names this page (https://a.example/post/)',
    ]);
  });

  it('accepts a self-reference written without the trailing slash', () => {
    expect(
      HREFLANG_NO_SELF_REFERENCE_CHECK.evaluate(
        withAlternates({ lang: 'en', href: 'https://a.example/post' }),
      ),
    ).toEqual(PASSES);
  });

  // No contradiction: a page whose canonical names another URL has left its own set,
  // which HREFLANG_INVALID reports; asking it to list itself would advise the opposite.
  it("is not applicable when the canonical names another URL — that is HREFLANG_INVALID's", () => {
    expect(
      HREFLANG_NO_SELF_REFERENCE_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            canonicals: ['https://a.example/original/'],
            alternates: [{ lang: 'de', href: 'https://a.example/de/post/' }],
          },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable without alternates', () => {
    expect(HREFLANG_NO_SELF_REFERENCE_CHECK.evaluate(withAlternates())).toEqual(
      NOT_APPLICABLE,
    );
  });
});
