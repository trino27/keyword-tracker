import type { PinoLogger } from 'nestjs-pino';
import { siteKeyOf } from '@app/contracts';
import { FixtureHttpTransport } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { FeedDiscoveryService } from '../feed-discovery/feed-discovery.service';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import { SitemapDiscoveryService } from './sitemap-discovery.service';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

const setup = () => {
  const transport = new FixtureHttpTransport();
  const http = new SiteHttpClient(transport, logger, {
    sleep: () => Promise.resolve(),
  });
  const discovery = new SitemapDiscoveryService(
    http,
    new FeedDiscoveryService(http),
    logger,
  );
  const discover = (websiteUrl: string) =>
    discovery.discover(
      { websiteUrl, siteKey: siteKeyOf(new URL(websiteUrl).hostname) },
      AbortSignal.timeout(10_000),
    );
  return { transport, discover };
};

describe('SitemapDiscoveryService (recorded and synthetic sites)', () => {
  it('semrush: selects /blog/sitemap/ and never reads another subdomain', async () => {
    const { transport, discover } = setup();

    const result = await discover('https://www.semrush.com');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: ['https://www.semrush.com/blog/sitemap/'],
    });
    expect(result.ok && result.urls[0]).toBe(
      'https://www.semrush.com/blog/seo-split-test-result-does-bolded-text-help-your-seo/',
    );
    expect(
      transport.requests.filter(
        (url) => !url.startsWith('https://www.semrush.com/'),
      ),
    ).toEqual([]);
  });

  it('yoast: selects the post group, both numbered sitemaps, in index order', async () => {
    const { discover } = setup();

    const result = await discover('https://yoast.com');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: [
        'https://yoast.com/post-sitemap.xml',
        'https://yoast.com/post-sitemap2.xml',
      ],
    });
    expect(result.ok && result.urls[0]).toBe('https://yoast.com/seo-blog/');
    expect(result.ok && result.reason).toMatch(/feed share [1-4]/);
  });

  it('no page URL is requested before selection', async () => {
    const { transport, discover } = setup();

    await discover('https://yoast.com');

    const pages = transport.requests.filter(
      (url) =>
        !/robots\.txt$|sitemap|\.xml$|\/feed\/$|\/rss\.xml$/.test(url) &&
        url !== 'https://yoast.com/',
    );
    expect(pages).toEqual([]);
  });

  it('without robots.txt, falls back to the well-known paths', async () => {
    const { transport, discover } = setup();

    const result = await discover('https://no-robots.example');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: ['https://no-robots.example/post-sitemap.xml'],
    });
    expect(transport.requests).toContain(
      'https://no-robots.example/sitemap.xml',
    );
  });

  it('reads a gzipped sitemap', async () => {
    const { discover } = setup();

    const result = await discover('https://gzip-sitemap.example');

    expect(result.ok && result.urls).toHaveLength(20);
  });

  it('selects a root-level post sitemap without a feed at score 2', async () => {
    const { discover } = setup();

    const result = await discover('https://root-blog-no-feed.example');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: ['https://root-blog-no-feed.example/post-sitemap.xml'],
    });
    expect(result.ok && result.reason).toContain('with score 2:');
  });

  it('finds a blog with an unusual sitemap name through its feed', async () => {
    const { discover } = setup();

    const result = await discover('https://unusual-name.example');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: ['https://unusual-name.example/chronicle.xml'],
    });
    expect(
      result.ok &&
        result.robots.isAllowed(
          'https://unusual-name.example/stories/post-number-3/',
        ),
    ).toBe(false);
  });

  it('a blog host with a relative Sitemap line: the host makes it a blog', async () => {
    const { discover } = setup();

    const result = await discover('https://blog.relative-sitemap.example');

    expect(result).toMatchObject({
      ok: true,
      articlesOnly: false,
      sitemapUrls: ['https://blog.relative-sitemap.example/sitemap.xml'],
    });
    expect(result.ok && result.urls).toHaveLength(20);
  });

  it('reads sitemaps served from a sibling subdomain', async () => {
    const { discover } = setup();

    const result = await discover('https://crosshost.example');

    expect(result).toMatchObject({
      ok: true,
      sitemapUrls: ['https://sitemaps.crosshost.example/post-sitemap.xml'],
    });
    expect(result.ok && result.urls[0]).toBe(
      'https://crosshost.example/blog/post-number-1/',
    );
  });

  it('prefers a Google News sitemap on a news site', async () => {
    const { discover } = setup();

    await expect(discover('https://newsroom.example')).resolves.toMatchObject({
      ok: true,
      articlesOnly: false,
      sitemapUrls: ['https://newsroom.example/news-sitemap.xml'],
    });
  });

  it('without a sitemap, takes the feed items as the posts', async () => {
    const { discover } = setup();

    const result = await discover('https://feed-only.example');

    expect(result).toMatchObject({
      ok: true,
      articlesOnly: false,
      sitemapUrls: ['https://feed-only.example/rss/'],
    });
    expect(result.ok && result.urls).toHaveLength(12);
  });

  it('without a sitemap or feed, reads the blog index page — articles only', async () => {
    const { discover } = setup();

    const result = await discover('https://listing-only.example');

    expect(result).toMatchObject({
      ok: true,
      articlesOnly: true,
      sitemapUrls: ['https://listing-only.example/blog/'],
    });
    expect(result.ok && result.urls).toEqual(
      Array.from(
        { length: 8 },
        (_, i) => `https://listing-only.example/blog/post-number-${i + 1}/`,
      ),
    );
  });

  it('a sitemap that does not look like a blog is read, articles only', async () => {
    const { discover } = setup();

    await expect(discover('https://flat-mixed.example')).resolves.toMatchObject(
      {
        ok: true,
        articlesOnly: true,
        sitemapUrls: ['https://flat-mixed.example/sitemap.xml'],
      },
    );
    await expect(discover('https://pages-only.example')).resolves.toMatchObject(
      {
        ok: true,
        articlesOnly: true,
      },
    );
  });

  it('reads a text sitemap', async () => {
    const { discover } = setup();

    const result = await discover('https://text-sitemap.example');

    expect(result).toMatchObject({
      ok: true,
      articlesOnly: false,
      sitemapUrls: ['https://text-sitemap.example/sitemap.txt'],
    });
    expect(result.ok && result.urls).toHaveLength(20);
  });

  it('a feed named as the sitemap in robots.txt is read as one', async () => {
    const { discover } = setup();

    const result = await discover('https://feed-as-sitemap.example');

    expect(result).toMatchObject({
      ok: true,
      articlesOnly: false,
      sitemapUrls: ['https://feed-as-sitemap.example/syndication.xml'],
    });
    expect(result.ok && result.urls[0]).toBe(
      'https://feed-as-sitemap.example/notes/post-number-1/',
    );
  });

  it('robots.txt answering 5xx means disallow everything (RFC 9309): nothing else is read', async () => {
    const { transport, discover } = setup();

    await expect(discover('https://robots-5xx.example')).resolves.toMatchObject(
      { ok: false, errorCode: 'ROBOTS_UNAVAILABLE' },
    );
    expect(
      transport.requests.filter((url) => !url.endsWith('/robots.txt')),
    ).toEqual([]);
  });

  // Google: "all 4xx errors, except 429" mean no rules. A 429 is a server asking for
  // less, and like a 5xx it forbids everything until it answers.
  it('robots.txt answering 429 forbids everything, like a 5xx', async () => {
    const { transport, discover } = setup();
    transport.override('https://yoast.com/robots.txt', { status: 429 });

    await expect(discover('https://yoast.com')).resolves.toMatchObject({
      ok: false,
      errorCode: 'ROBOTS_UNAVAILABLE',
    });
    expect(
      transport.requests.filter((url) => !url.endsWith('/robots.txt')),
    ).toEqual([]);
  });

  // A timeout is a server error to Google, not a missing file. Read as "no rules", it
  // crawled a site whose robots.txt Google could not read either.
  it('a robots.txt that times out forbids everything, on a site that otherwise answers', async () => {
    const { transport, discover } = setup();
    transport.override('https://yoast.com/robots.txt', {
      status: 0,
      error: 'timeout',
    });

    await expect(discover('https://yoast.com')).resolves.toMatchObject({
      ok: false,
      errorCode: 'SITE_UNREACHABLE',
      detail: expect.stringContaining('RFC 9309') as string,
    });
    expect(
      transport.requests.filter((url) => !url.endsWith('/robots.txt')),
    ).toEqual([]);
  });

  // Google reads the first 500 KiB and ignores the rest. Thrown away whole, the file's
  // rules were all lost; cut mid-line, `Disallow: /admin/` would read as `/adm`.
  it('reads a robots.txt past 500 KiB up to the limit, and not a cut line', async () => {
    const { transport, discover } = setup();
    const filler = '# padding\n'.repeat(51_195);
    const body = `User-agent: *\nDisallow: /blocked/\n${filler}Disallow: /admin/\n`;
    transport.override('https://yoast.com/robots.txt', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
      body,
    });

    const result = await discover('https://yoast.com');

    expect(Buffer.byteLength(body)).toBeGreaterThan(500 * 1024);
    expect(result.robots.isAllowed('https://yoast.com/blocked/x')).toBe(false);
    expect(result.robots.isAllowed('https://yoast.com/adm')).toBe(true);
    expect(result.robots.isAllowed('https://yoast.com/admin/x')).toBe(true);
  });

  it.each([
    ['https://no-sitemap.example', 'SITEMAP_NOT_FOUND'],
    ['https://unreachable.example', 'SITE_UNREACHABLE'],
    ['https://walled.example', 'SITE_BLOCKED'],
    // A Cloudflare challenge answers 503, which alone would read as "no sitemap".
    ['https://challenged.example', 'SITE_BLOCKED'],
    ['https://moved.example', 'SITE_REDIRECTS_ELSEWHERE'],
  ])('%s fails %s', async (websiteUrl, errorCode) => {
    const { discover } = setup();

    await expect(discover(websiteUrl)).resolves.toMatchObject({
      ok: false,
      errorCode,
    });
  });
});
