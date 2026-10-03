import { gzipSync } from 'node:zlib';
import type { PinoLogger } from 'nestjs-pino';
import { FixtureHttpTransport } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { SiteHttpClient } from './site-http-client';

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn() };
const signal = () => AbortSignal.timeout(5_000);

const makeClient = (transport = new FixtureHttpTransport()) =>
  new SiteHttpClient(transport, logger as unknown as PinoLogger, {
    sleep: () => Promise.resolve(),
  });

describe('SiteHttpClient', () => {
  it('inflates a gzipped sitemap', async () => {
    const response = await makeClient().getSitemap(
      'https://gzip-sitemap.example/sitemap.xml.gz',
      signal(),
    );

    expect(response.text).toContain('<urlset');
    expect(response.text).toContain('/blog/post-number-1/');
  });

  it('decodes by the declared charset', async () => {
    const transport = new FixtureHttpTransport({ entries: {}, patterns: [] });
    jest.spyOn(transport, 'send').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html; charset=windows-1252' },
      body: Buffer.from([0x63, 0x61, 0x66, 0xe9]),
      ttfbMs: 1,
    });

    const response = await makeClient(transport).getHtml(
      'https://a.example/',
      signal(),
    );

    expect(response.text).toBe('café');
    expect(response.bytes).toBe(4);
  });

  it('reads a recorded post with its final URL and timing', async () => {
    const response = await makeClient().getHtml(
      'https://yoast.com/seo-blog/',
      signal(),
    );

    expect(response.status).toBe(200);
    expect(response.finalUrl).toBe('https://yoast.com/seo-blog/');
    expect(response.text).toContain('<title>');
  });

  it('a corrupt archive reads as an empty sitemap', async () => {
    const transport = new FixtureHttpTransport({ entries: {}, patterns: [] });
    const truncated = gzipSync('<urlset></urlset>').subarray(0, 12);
    jest.spyOn(transport, 'send').mockResolvedValue({
      status: 200,
      headers: {},
      body: truncated,
      ttfbMs: 1,
    });

    const response = await makeClient(transport).getSitemap(
      'https://a.example/s.xml.gz',
      signal(),
    );

    expect(response.text).toBe('');
  });
});
