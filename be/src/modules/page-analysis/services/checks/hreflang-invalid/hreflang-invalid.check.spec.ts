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
    ).toEqual(failsWith({ invalid: ['en_GB', 'english'] }));
  });

  // A set that leaves out its own page is HREFLANG_NO_SELF_REFERENCE's finding; reported
  // here as well, one fact would count twice against the page (plan D14).
  it("passes a valid set that omits this page — that is HREFLANG_NO_SELF_REFERENCE's", () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates({ lang: 'de-DE', href: 'https://a.example/de/post/' }),
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

  /**
   * Google: "Only language codes listed in ISO 639-1 and region codes listed in ISO
   * 3166-1 Alpha 2 are supported; other codes … such as es-419, aren't supported." Each
   * of these is valid BCP 47 that Google ignores.
   */
  it.each([
    [
      'es-419',
      '"419" is a UN M.49 region; Google supports only two-letter ISO 3166-1 country codes',
    ],
    [
      'fil',
      '"fil" is not an ISO 639-1 code; Google supports only two-letter language codes',
    ],
    ['en-ZZ', '"ZZ" is not a country code'],
    ['en-XA', '"XA" is not a country code'],
    [
      'de-DE-1996',
      '"1996" follows the country; hreflang takes a language, an optional script and an optional country',
    ],
  ])('fails %s, which Google does not support', (lang, problem) => {
    const verdict = HREFLANG_INVALID_CHECK.evaluate(
      withAlternates(
        { lang: 'en', href: SELF },
        { lang, href: 'https://a.example/other/' },
      ),
    );

    expect(evidenceOf(verdict)).toEqual([
      `<link rel="alternate" hreflang="${lang}" href="https://a.example/other/"> — ${problem}`,
    ]);
  });

  /**
   * Google: alternate URLs "must be fully-qualified, including the transport method",
   * and the tags "must be inside a well-formed <head> section". Lighthouse fails a
   * relative href too.
   */
  it('fails a relative alternate URL, and an hreflang outside <head>, quoting each as written', () => {
    const verdict = HREFLANG_INVALID_CHECK.evaluate(
      makeCheckInput({
        finalUrl: SELF,
        parsed: {
          alternates: [
            { lang: 'en', href: SELF },
            {
              lang: 'de',
              href: 'https://a.example/de/post/',
              relativeHref: '/de/post/',
            },
          ],
          alternatesOutsideHead: [
            { lang: 'fr', href: 'https://a.example/fr/post/' },
          ],
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ invalid: ['de', 'fr'] }));
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="alternate" hreflang="de" href="/de/post/"> — a relative URL; Google requires the full address, https:// included',
      '<link rel="alternate" hreflang="fr" href="https://a.example/fr/post/"> — outside <head>, where Google does not read hreflang',
    ]);
  });

  // Real languages that happen to share a country's code are not corrected.
  it('accepts se (Northern Sami), uz-Latn and zh-Hant-TW', () => {
    expect(
      HREFLANG_INVALID_CHECK.evaluate(
        withAlternates(
          { lang: 'en', href: SELF },
          { lang: 'se', href: 'https://a.example/se/' },
          { lang: 'uz-Latn', href: 'https://a.example/uz/' },
          { lang: 'zh-Hant-TW', href: 'https://a.example/tw/' },
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
