import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { OG_URL_MISMATCH_CHECK } from './og-url-mismatch.check';

const og = (url: string) => ({
  'og:title': 'Link building',
  'og:url': url,
});

describe('OG_URL_MISMATCH', () => {
  it('fails og:url naming another page', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { openGraph: og('https://a.example/other/') },
        }),
      ),
    ).toEqual(
      failsWith({
        ogUrl: 'https://a.example/other/',
        expected: 'https://a.example/post/',
      }),
    );
  });

  // No contradiction between checks: when the canonical names another page, the canonical
  // checks ask to fix the canonical, so asking here to copy it into og:url would advise
  // the opposite. With the canonical disputed, og:url is not judged.
  it('is not applicable while the canonical names another page — the canonical checks say what to fix', () => {
    for (const ogUrl of [
      'https://a.example/post/',
      'https://a.example/original/',
    ])
      expect(
        OG_URL_MISMATCH_CHECK.evaluate(
          makeCheckInput({
            parsed: {
              canonicals: ['https://a.example/original/'],
              openGraph: og(ogUrl),
            },
          }),
        ),
      ).toEqual(NOT_APPLICABLE);
  });

  it('compares with a canonical that names the page itself', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            canonicals: ['https://a.example/post/'],
            openGraph: og('https://a.example/post/?utm_source=x'),
          },
        }),
      ),
    ).toEqual(failsWith({ expected: 'https://a.example/post/' }));
  });

  it('compares with the served address when no canonical is declared', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: [], openGraph: og('https://a.example/post/') },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('passes a trailing-slash difference', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { openGraph: og('https://a.example/post') } }),
      ),
    ).toEqual(PASSES);
  });

  it('resolves a relative og:url against the page', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { openGraph: og('/post/') } }),
      ),
    ).toEqual(PASSES);
  });

  it("is not applicable to a staging og:url — DEVELOPMENT_HOST_REFERENCES's", () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { openGraph: og('https://staging.a.example/post/') },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable without og:url', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { openGraph: { 'og:title': 'A post' } } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
