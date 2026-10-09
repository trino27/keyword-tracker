import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import {
  isDevelopmentHost,
  isOwnDevelopmentHost,
} from '../_shared/development-host';
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

describe('isOwnDevelopmentHost', () => {
  it.each([
    ['localhost', 'a.example', true],
    ['10.0.0.5', 'a.example', true],
    ['staging.a.example', 'www.a.example', true],
    ['dev.example.com', 'blog.example.com', true],
    ['overreacted-git-main.vercel.app', 'overreacted.io', true],
    // Another site's live addresses, seen on habr.com and overreacted.io (2026-10).
    ['dev.vk.ru', 'habr.com', false],
    ['atproto-browser.vercel.app', 'overreacted.io', false],
    ['8.8.8.8', 'a.example', false],
    // `co` is a suffix label, not the site: bbc.co.uk owns nothing under it.
    ['staging.co.uk', 'bbc.co.uk', false],
  ])('%s from %s → %s', (host, pageHost, expected) => {
    expect(isOwnDevelopmentHost(host, pageHost)).toBe(expected);
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
          links: ['https://staging.a.example/other/'],
          resourceUrls: ['http://127.0.0.1:8080/hero.png'],
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ count: 5 }));
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="canonical" href="https://staging.a.example/post/">',
      '<meta property="og:url" content="http://localhost:3000/post/">',
      '<link rel="alternate" hreflang="fr" href="https://dev.a.example/fr/post/">',
      '<a href="https://staging.a.example/other/"> in the content',
      'loads http://127.0.0.1:8080/hero.png',
    ]);
  });

  // habr.com, 2026-10: a post linked VK's developer docs and was reported as leaking
  // a staging host. A link to someone else's site is not this site's environment.
  it("passes links and resources on other sites' dev-looking hosts", () => {
    expect(
      DEVELOPMENT_HOST_REFERENCES_CHECK.evaluate(
        makeCheckInput({
          finalUrl: 'https://habr.com/ru/articles/1/',
          parsed: {
            links: [
              'https://dev.vk.ru/en/api/community-messages/getting-started',
              'https://atproto-browser.vercel.app/at/x',
            ],
            resourceUrls: ['https://widget.netlify.app/embed.js'],
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('still flags a self-reference to any preview host', () => {
    expect(
      DEVELOPMENT_HOST_REFERENCES_CHECK.evaluate(
        makeCheckInput({
          parsed: { openGraph: { 'og:url': 'https://other.vercel.app/post/' } },
        }),
      ),
    ).toEqual(failsWith({ count: 1 }));
  });
});
