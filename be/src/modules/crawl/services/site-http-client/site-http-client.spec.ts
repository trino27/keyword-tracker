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

  describe('without a charset in the header', () => {
    const answer = (body: Buffer, contentType = 'text/html') => {
      const transport = new FixtureHttpTransport({ entries: {}, patterns: [] });
      jest.spyOn(transport, 'send').mockResolvedValue({
        status: 200,
        headers: { 'content-type': contentType },
        body,
        ttfbMs: 1,
      });
      return makeClient(transport);
    };
    // "Блог" in windows-1251 — the encoding of many Bulgarian and Russian sites.
    const cp1251 = Buffer.from([0xc1, 0xeb, 0xee, 0xe3]);

    it('reads <meta charset> in the page', async () => {
      const body = Buffer.concat([
        Buffer.from('<html><head><meta charset="windows-1251"><title>'),
        cp1251,
        Buffer.from('</title>'),
      ]);

      const response = await answer(body).getHtml(
        'https://a.example/',
        signal(),
      );

      expect(response.text).toContain('<title>Блог</title>');
    });

    it('reads <meta http-equiv="Content-Type">', async () => {
      const body = Buffer.concat([
        Buffer.from(
          '<meta http-equiv="Content-Type" content="text/html; charset=windows-1251"><h1>',
        ),
        cp1251,
      ]);

      const response = await answer(body).getHtml(
        'https://a.example/',
        signal(),
      );

      expect(response.text).toContain('<h1>Блог');
    });

    it('reads the XML declaration of a sitemap', async () => {
      const body = Buffer.concat([
        Buffer.from(
          '<?xml version="1.0" encoding="windows-1251"?><urlset><url><loc>https://a.example/',
        ),
        cp1251,
        Buffer.from('/</loc></url></urlset>'),
      ]);

      const response = await answer(body, 'application/xml').getSitemap(
        'https://a.example/sitemap.xml',
        signal(),
      );

      expect(response.text).toContain('https://a.example/Блог/');
    });

    it('a byte order mark wins and is not part of the text', async () => {
      const body = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from('<meta charset="windows-1251"><p>Блог</p>'),
      ]);

      const response = await answer(
        body,
        'text/html; charset=iso-8859-1',
      ).getHtml('https://a.example/', signal());

      expect(response.text).toBe('<meta charset="windows-1251"><p>Блог</p>');
    });
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
