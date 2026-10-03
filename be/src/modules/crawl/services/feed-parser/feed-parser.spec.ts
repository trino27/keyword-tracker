import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { findAlternateFeeds, parseFeedLinks } from './feed-parser';

const fixture = (file: string) =>
  readFileSync(join(FIXTURES_ROOT, 'sites', file), 'utf8');

describe('parseFeedLinks', () => {
  it('reads RSS 2.0 item links in order', () => {
    expect(
      parseFeedLinks(
        '<rss version="2.0"><channel><item><link>https://a.example/1/</link></item><item><link>https://a.example/2/?a=1&amp;b=2</link></item></channel></rss>',
      ),
    ).toEqual(['https://a.example/1/', 'https://a.example/2/?a=1&b=2']);
  });

  it('reads Atom entries, preferring the alternate link', () => {
    expect(
      parseFeedLinks(
        '<feed xmlns="http://www.w3.org/2005/Atom"><entry><link rel="replies" href="https://a.example/c"/><link rel="alternate" href="https://a.example/post/"/></entry></feed>',
      ),
    ).toEqual(['https://a.example/post/']);
  });

  it('reads RSS 1.0 (RDF) items', () => {
    expect(
      parseFeedLinks(
        '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><item><link>https://a.example/x/</link></item></rdf:RDF>',
      ),
    ).toEqual(['https://a.example/x/']);
  });

  it('reads a JSON Feed (jsonfeed.org), version 1 and 1.1', () => {
    expect(
      parseFeedLinks(
        JSON.stringify({
          version: 'https://jsonfeed.org/version/1.1',
          items: [
            { id: '1', url: 'https://a.example/1/' },
            { id: '2', external_url: 'https://elsewhere.example/' },
            { id: 'https://a.example/3/' },
          ],
        }),
      ),
    ).toEqual(['https://a.example/1/']);
    expect(parseFeedLinks('{"version":"x","items":[]}')).toBeNull();
    expect(parseFeedLinks('{not json')).toBeNull();
  });

  it('an RSS item without <link> falls back to a permalink <guid>', () => {
    expect(
      parseFeedLinks(
        '<rss><channel><item><guid isPermaLink="true">https://a.example/g/</guid></item><item><guid isPermaLink="false">post-42</guid></item><item><guid>https://a.example/h/</guid></item></channel></rss>',
      ),
    ).toEqual(['https://a.example/g/', 'https://a.example/h/']);
  });

  it("prefers FeedBurner's original link over its redirect", () => {
    expect(
      parseFeedLinks(
        '<rss xmlns:feedburner="http://rssnamespace.org/feedburner/ext/1.0"><channel><item><link>https://feedproxy.google.com/~r/a/~3/x/</link><feedburner:origLink>https://a.example/x/</feedburner:origLink></item></channel></rss>',
      ),
    ).toEqual(['https://a.example/x/']);
  });

  it('drops utm_* tracking parameters and the fragment from item links', () => {
    expect(
      parseFeedLinks(
        '<rss><channel><item><link>https://a.example/p/?utm_source=rss&amp;utm_medium=rss&amp;id=7#more-7</link></item></channel></rss>',
      ),
    ).toEqual(['https://a.example/p/?id=7']);
  });

  it('an empty channel is an empty feed; HTML is not a feed', () => {
    expect(parseFeedLinks('<rss><channel></channel></rss>')).toEqual([]);
    expect(parseFeedLinks('<html><body>hi</body></html>')).toBeNull();
  });

  it('reads the recorded yoast feed', () => {
    const links = parseFeedLinks(fixture('yoast/feed/index.xml'));

    expect(links?.length).toBeGreaterThan(5);
    expect(links?.every((link) => link.startsWith('https://yoast.com/'))).toBe(
      true,
    );
  });
});

describe('findAlternateFeeds', () => {
  it('resolves RSS and Atom alternates and ignores other alternates', () => {
    const html = `<html><head>
      <link rel="alternate" type="application/rss+xml" href="/feed/">
      <link rel="alternate" type="application/atom+xml" href="https://a.example/atom.xml">
      <link rel="alternate" hreflang="de" href="https://de.a.example/">
    </head></html>`;

    expect(findAlternateFeeds(html, 'https://a.example/')).toEqual([
      'https://a.example/feed/',
      'https://a.example/atom.xml',
    ]);
  });

  it('accepts a type with parameters, and JSON Feed alternates', () => {
    const html = `<html><head>
      <link rel="alternate" type="application/rss+xml; charset=UTF-8" href="/rss/">
      <link rel="alternate" type="application/feed+json" href="/feed.json">
    </head></html>`;

    expect(findAlternateFeeds(html, 'https://a.example/')).toEqual([
      'https://a.example/rss/',
      'https://a.example/feed.json',
    ]);
  });
});
