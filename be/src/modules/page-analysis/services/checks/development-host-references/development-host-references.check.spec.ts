import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { isDevelopmentHost } from '../_shared/development-host';
import { DEVELOPMENT_HOST_REFERENCES_CHECK } from './development-host-references.check';

describe('isDevelopmentHost', () => {
  it.each([
    ['localhost', true],
    ['127.0.0.1', true],
    ['10.0.0.5', true],
    ['staging.a.example', true],
    ['dev.a.example', true],
    ['my-branch.vercel.app', true],
    ['site.netlify.app', true],
    // Two labels: a real site whose name is the word.
    ['dev.to', false],
    ['a.example', false],
    ['www.a.example', false],
  ])('%s → %s', (host, expected) => {
    expect(isDevelopmentHost(host, 'a.example')).toBe(expected);
  });

  // A site may live on a platform domain; only a reference to ANOTHER one is a leak.
  it('does not flag the host the page is served from', () => {
    expect(isDevelopmentHost('site.vercel.app', 'site.vercel.app')).toBe(false);
  });
});

describe('DEVELOPMENT_HOST_REFERENCES', () => {
  it('passes a page that names production URLs only', () => {
    expect(
      DEVELOPMENT_HOST_REFERENCES_CHECK.evaluate(makeCheckInput()),
    ).toEqual(PASSES);
  });

  it('quotes every kind of reference to a staging host', () => {
    const verdict = DEVELOPMENT_HOST_REFERENCES_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          canonicals: ['https://staging.a.example/post/'],
          openGraph: { 'og:url': 'http://localhost:3000/post/' },
          alternates: [{ lang: 'fr', href: 'https://dev.a.example/fr/post/' }],
          links: ['https://preview-42.vercel.app/other/'],
          resourceUrls: ['http://127.0.0.1:8080/hero.png'],
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ count: 5 }));
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="canonical" href="https://staging.a.example/post/">',
      '<meta property="og:url" content="http://localhost:3000/post/">',
      '<link rel="alternate" hreflang="fr" href="https://dev.a.example/fr/post/">',
      '<a href="https://preview-42.vercel.app/other/"> in the content',
      'loads http://127.0.0.1:8080/hero.png',
    ]);
  });
});
