import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
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
});
