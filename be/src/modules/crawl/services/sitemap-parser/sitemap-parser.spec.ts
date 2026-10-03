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
    ).toEqual({ kind: 'urlset', urls: ['https://a.example/'] });
  });

  it('does not expand DOCTYPE entities', () => {
    const parsed = parseSitemap(
      '<!DOCTYPE x [<!ENTITY a "aaaaaaaaaa">]><urlset><url><loc>https://a.example/&a;</loc></url></urlset>',
    );

    expect(parsed).toEqual({ kind: 'urlset', urls: ['https://a.example/&a;'] });
  });

  it.each(['<html><body>Not a sitemap</body></html>', 'plain text', ''])(
    'calls %j invalid',
    (input) => {
      expect(parseSitemap(input).kind).toBe('invalid');
    },
  );

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
