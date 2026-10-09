import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { HREFLANG_INVALID_CHECK } from './hreflang-invalid.check';

const SELF = 'https://a.example/post/';

const withAlternates = (...alternates: { lang: string; href: string }[]) =>
  makeCheckInput({ parsed: { alternates } });

describe('HREFLANG_INVALID', () => {
  it('passes a set that names this page and spells its languages correctly', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates(
          { lang: 'en', href: SELF },
          { lang: 'de-DE', href: 'https://a.example/de/post/' },
          { lang: 'zh-Hant-TW', href: 'https://a.example/tw/post/' },
          { lang: 'x-default', href: SELF },
        ),
      ),
    ).toEqual(PASSES);
  });

  it('names the tags that are not languages', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates(
          { lang: 'en', href: SELF },
          { lang: 'en_GB', href: 'https://a.example/gb/' },
          { lang: 'english', href: 'https://a.example/uk/' },
        ),
      ),
    ).toEqual(
      failsWith({ invalid: ['en_GB', 'english'], selfReferenced: true }),
    );
  });

  // Google ignores the whole set when the page is not in it, so a correct set of other
  // languages is still a defect on this page.
  it('fails a set that never names this page', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates({ lang: 'de-DE', href: 'https://a.example/de/post/' }),
      ),
    ).toEqual(failsWith({ invalid: [], selfReferenced: false }));
  });

  it('accepts a self-reference written without the trailing slash', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates({ lang: 'en', href: 'https://a.example/post' }),
      ),
    ).toEqual(PASSES);
  });

  it('cannot be judged on a page declaring no hreflang', () => {
    expect(HREFLANG_INVALID_CHECK.evaluate(withAlternates())).toEqual(
      NOT_APPLICABLE,
    );
  });

  // Grammar alone accepted all four: each is a country code written where a language,
  // or a code ISO never assigned, belongs.
  it.each([
    ['ua', '"ua" is a country code; the language is "uk"'],
    ['kz', '"kz" is a country code; the language is "kk"'],
    ['jp', '"jp" is a country code; the language is "ja"'],
    ['en-UK', '"UK" is not a country code; the United Kingdom is "GB"'],
  ])('fails %s, saying what was meant', (lang, problem) => {
    const verdict = HREFLANG_INVALID_CHECK.evaluate(
      withAlternates(
        { lang: 'en', href: SELF },
        { lang, href: 'https://a.example/other/' },
      ),
    );

    expect(verdict).toEqual(failsWith({ invalid: [lang] }));
    expect(evidenceOf(verdict)).toEqual([
      `<link rel="alternate" hreflang="${lang}" href="https://a.example/other/"> — ${problem}`,
    ]);
  });

  // Real languages that happen to share a country's code are not corrected.
  it('accepts se (Northern Sami) and uz-Latn', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates(
          { lang: 'en', href: SELF },
          { lang: 'se', href: 'https://a.example/se/' },
          { lang: 'uz-Latn', href: 'https://a.example/uz/' },
        ),
      ),
    ).toEqual(PASSES);
  });

  // The page calls itself a duplicate of another, which takes it out of its own set.
  it('fails a page whose canonical names another URL', () => {
    const verdict = HREFLANG_INVALID_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          alternates: [{ lang: 'en', href: SELF }],
          canonicals: ['https://a.example/en/post/'],
        },
      }),
    );

    expect(verdict).toEqual(
      failsWith({ canonicalElsewhere: 'https://a.example/en/post/' }),
    );
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="canonical" href="https://a.example/en/post/"> — this page calls itself a duplicate of another',
    ]);
  });
});
