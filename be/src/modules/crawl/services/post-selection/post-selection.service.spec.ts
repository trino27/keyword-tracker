import type { PinoLogger } from 'nestjs-pino';
import {
  FixtureHttpTransport,
  type IFixtureEntry,
} from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import { PostSelectionService } from './post-selection.service';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

const ORIGIN = 'https://site.example';
const article = (title: string): IFixtureEntry => ({
  status: 200,
  headers: { 'content-type': 'text/html; charset=utf-8' },
  body: `<html lang="en"><head><title>${title}</title></head><body><main><h1>${title}</h1><p>Words.</p></main></body></html>`,
});

const setup = (entries: Record<string, IFixtureEntry> = {}) => {
  const transport = new FixtureHttpTransport({
    entries,
    patterns: [
      {
        pattern: '^https://site\\.example/posts/[a-z0-9-]+/$',
        synthesize: 'article',
      },
    ],
  });
  const http = new SiteHttpClient(transport, logger, {
    sleep: () => Promise.resolve(),
  });
  const service = new PostSelectionService(http);
  const select = (
    urls: string[],
    robots = RobotsPolicy.allowAll(),
    onProgress?: (crawled: number) => Promise<void>,
  ) =>
    service.select({
      urls,
      siteKey: 'site.example',
      robots,
      signal: AbortSignal.timeout(10_000),
      onProgress,
    });
  return { transport, select };
};

const posts = (count: number, from = 1) =>
  Array.from({ length: count }, (_, i) => `${ORIGIN}/posts/p${from + i}/`);

describe('PostSelectionService', () => {
  it('articles only: a page that does not say it is an article is skipped', async () => {
    const transport = new FixtureHttpTransport();
    const service = new PostSelectionService(
      new SiteHttpClient(transport, logger, { sleep: () => Promise.resolve() }),
    );

    const { items } = await service.select({
      urls: [
        'https://flat-mixed.example/web-design',
        'https://flat-mixed.example/article-number-1',
      ],
      siteKey: 'flat-mixed.example',
      robots: RobotsPolicy.allowAll(),
      signal: AbortSignal.timeout(10_000),
      articlesOnly: true,
    });

    expect(items.map(({ status, reason }) => [status, reason])).toEqual([
      [
        'skipped_listing',
        'Not marked as an article (no og:type=article, no JSON-LD Article)',
      ],
      ['crawled', null],
    ]);
  });

  it('takes the first 15 posts in order and stops the log at the 15th', async () => {
    const { select } = setup();

    const { items, pages } = await select(posts(25));

    expect(pages).toHaveLength(15);
    expect(items).toHaveLength(15);
    expect(items.map((item) => item.sitemapPosition)).toEqual(
      Array.from({ length: 15 }, (_, i) => i),
    );
    expect(pages[14]).toMatchObject({
      sitemapPosition: 14,
      url: posts(15)[14],
    });
  });

  it('logs and skips each kind of non-post, then keeps going', async () => {
    const { select } = setup({
      [`${ORIGIN}/posts/listing/`]: {
        status: 200,
        headers: { 'content-type': 'text/html' },
        body: '<script type="application/ld+json">{"@type":["WebPage","CollectionPage"]}</script>',
      },
      [`${ORIGIN}/posts/gone/`]: { status: 500 },
      [`${ORIGIN}/posts/moved/`]: {
        status: 301,
        headers: { location: 'https://other.example/x/' },
      },
      [`${ORIGIN}/posts/file/`]: {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
        body: '%PDF',
      },
      [`${ORIGIN}/posts/slow/`]: { status: 0, error: 'timeout' },
    });
    const robots = RobotsPolicy.parse(
      `${ORIGIN}/robots.txt`,
      'User-agent: *\nDisallow: /posts/private/\n',
    );

    const { items } = await select(
      [
        `${ORIGIN}/posts/listing/`,
        'https://elsewhere.example/posts/a/',
        `${ORIGIN}/`,
        `${ORIGIN}/guide.pdf`,
        `${ORIGIN}/posts/private/`,
        `${ORIGIN}/posts/gone/`,
        `${ORIGIN}/posts/moved/`,
        `${ORIGIN}/posts/file/`,
        `${ORIGIN}/posts/slow/`,
        ...posts(2),
      ],
      robots,
    );

    expect(items.map(({ status, reason }) => [status, reason])).toEqual([
      ['skipped_listing', 'Declares itself a listing (JSON-LD CollectionPage)'],
      ['skipped_other_site', 'Belongs to another site'],
      ['skipped_listing', "The site's home page"],
      ['skipped_not_html', 'Not an HTML page (.pdf)'],
      ['skipped_robots', 'Disallowed by robots.txt'],
      ['failed', 'HTTP 500'],
      ['skipped_other_site', 'Redirects to another site'],
      ['skipped_not_html', 'Not HTML (application/pdf)'],
      ['failed', 'Timed out'],
      ['crawled', null],
      ['crawled', null],
    ]);
    expect(items[5].httpStatus).toBe(500);
  });

  it('a Cloudflare challenge is a refusal, whatever its status', async () => {
    const challenge = (status: number): IFixtureEntry => ({
      status,
      headers: { 'content-type': 'text/html', 'cf-mitigated': 'challenge' },
      body: '<title>Just a moment...</title>',
    });
    const { select } = setup({
      [`${ORIGIN}/posts/a/`]: challenge(503),
      [`${ORIGIN}/posts/b/`]: challenge(403),
    });

    const { items } = await select([
      `${ORIGIN}/posts/a/`,
      `${ORIGIN}/posts/b/`,
    ]);

    expect(
      items.map(({ status, reason, httpStatus }) => [
        status,
        reason,
        httpStatus,
      ]),
    ).toEqual([
      ['failed', 'Bot challenge (Cloudflare)', 503],
      ['failed', 'Bot challenge (Cloudflare)', 403],
    ]);
  });

  it('considers at most 30 entries', async () => {
    const { select, transport } = setup({
      ...Object.fromEntries(posts(40).map((url) => [url, { status: 404 }])),
    });

    const { items, pages } = await select(posts(40));

    expect(items).toHaveLength(30);
    expect(pages).toHaveLength(0);
    expect(transport.requests).toHaveLength(30);
  });

  it('reports progress after each window', async () => {
    const { select } = setup();
    const progress: number[] = [];

    await select(posts(7), RobotsPolicy.allowAll(), (crawled) => {
      progress.push(crawled);
      return Promise.resolve();
    });

    expect(progress).toEqual([3, 6, 7]);
  });

  it('a redirect within the site is followed and kept, with its final URL', async () => {
    const { select } = setup({
      [`${ORIGIN}/posts/old/`]: {
        status: 301,
        headers: { location: '/posts/new/' },
      },
      [`${ORIGIN}/posts/new/`]: article('New'),
    });

    const { pages } = await select([`${ORIGIN}/posts/old/`]);

    expect(pages[0]).toMatchObject({
      url: `${ORIGIN}/posts/old/`,
      finalUrl: `${ORIGIN}/posts/new/`,
      redirected: true,
      parsed: { title: 'New' },
    });
  });

  it('yoast: /seo-blog/ at position 0 is skipped as a listing', async () => {
    const transport = new FixtureHttpTransport();
    const service = new PostSelectionService(
      new SiteHttpClient(transport, logger, { sleep: () => Promise.resolve() }),
    );

    const { items, pages } = await service.select({
      urls: ['https://yoast.com/seo-blog/', 'https://yoast.com/what-is-http2/'],
      siteKey: 'yoast.com',
      robots: RobotsPolicy.allowAll(),
      signal: AbortSignal.timeout(10_000),
    });

    expect(items[0]).toMatchObject({
      sitemapPosition: 0,
      status: 'skipped_listing',
    });
    expect(pages.map((page) => page.url)).toEqual([
      'https://yoast.com/what-is-http2/',
    ]);
  });
});
