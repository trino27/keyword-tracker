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

  it('compares with the canonical when one is declared', () => {
    expect(
      OG_URL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            canonicals: ['https://a.example/original/'],
            openGraph: og('https://a.example/original/'),
          },
        }),
      ),
    ).toEqual(PASSES);
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
