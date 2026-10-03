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
});
