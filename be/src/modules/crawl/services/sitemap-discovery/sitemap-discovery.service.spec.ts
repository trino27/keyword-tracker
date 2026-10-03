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

  it.each([
    ['https://pages-only.example', 'BLOG_SITEMAP_NOT_FOUND'],
    ['https://no-sitemap.example', 'SITEMAP_NOT_FOUND'],
    ['https://unreachable.example', 'SITE_UNREACHABLE'],
  ])('%s fails %s', async (websiteUrl, errorCode) => {
    const { discover } = setup();

    await expect(discover(websiteUrl)).resolves.toMatchObject({
      ok: false,
      errorCode,
    });
  });
});
