import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { parseSitemap } from './sitemap-parser';

const fixture = (file: string) =>
  readFileSync(join(FIXTURES_ROOT, 'sites', file), 'utf8');

describe('parseSitemap', () => {
  it('returns a urlset in document order, decoding entities', () => {
    const parsed = parseSitemap(
      `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc> https://a.example/b/ </loc></url>
        <url><loc>https://a.example/c/?x=1&amp;y=2</loc></url>
      </urlset>`,
    );

    expect(parsed).toEqual({
      kind: 'urlset',
      urls: ['https://a.example/b/', 'https://a.example/c/?x=1&y=2'],
      news: false,
    });
  });

  it('returns the children of a sitemap index, one child included', () => {
    expect(
      parseSitemap(
        '<sitemapindex><sitemap><loc>https://a.example/s.xml</loc></sitemap></sitemapindex>',
      ),
    ).toEqual({ kind: 'index', sitemaps: ['https://a.example/s.xml'] });
  });

  it('reads a namespace-prefixed document', () => {
    expect(
      parseSitemap(
        '<ns:urlset xmlns:ns="http://www.sitemaps.org/schemas/sitemap/0.9"><ns:url><ns:loc>https://a.example/</ns:loc></ns:url></ns:urlset>',
      ),
    ).toEqual({ kind: 'urlset', urls: ['https://a.example/'], news: false });
  });

  it('does not expand DOCTYPE entities', () => {
    const parsed = parseSitemap(
      '<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa">]><urlset><url><loc>https://a.example/&a;</loc></url></urlset>',
    );

    expect(parsed).toEqual({
      kind: 'urlset',
      urls: ['https://a.example/&a;'],
      news: false,
    });
  });

  it('reads a <loc> wrapped in CDATA', () => {
    expect(
      parseSitemap(
        '<urlset><url><loc><![CDATA[https://a.example/x/?a=1&b=2]]></loc></url></urlset>',
      ),
    ).toEqual({
      kind: 'urlset',
      urls: ['https://a.example/x/?a=1&b=2'],
      news: false,
    });
  });

  it('tolerates blank lines before the XML declaration', () => {
    expect(
      parseSitemap(
        '\n\n  <?xml version="1.0"?><urlset><url><loc>https://a.example/</loc></url></urlset>',
      ),
    ).toMatchObject({ kind: 'urlset', urls: ['https://a.example/'] });
  });

  it('reads a text sitemap: one absolute URL per line', () => {
    expect(
      parseSitemap(
        'https://a.example/one/\r\n\r\nhttps://a.example/two/\nhttp://a.example/three/\n',
      ),
    ).toEqual({
      kind: 'urlset',
      urls: [
        'https://a.example/one/',
        'https://a.example/two/',
        'http://a.example/three/',
      ],
      news: false,
    });
  });

  it.each([
    '<html><body>Not a sitemap</body></html>',
    'plain text',
    '',
    'https://a.example/\nnot a url\n',
  ])('calls %j invalid', (input) => {
    expect(parseSitemap(input).kind).toBe('invalid');
  });

  it('parses the recorded yoast index and its first post sitemap', () => {
    const index = parseSitemap(fixture('yoast/sitemap_index.xml'));
    const posts = parseSitemap(fixture('yoast/post-sitemap.xml'));

    expect(index.kind === 'index' && index.sitemaps[0]).toBe(
      'https://yoast.com/post-sitemap.xml',
    );
    expect(posts.kind === 'urlset' && posts.urls[0]).toBe(
      'https://yoast.com/seo-blog/',
    );
  });
});
