import type { PinoLogger } from 'nestjs-pino';
import { FixtureHttpTransport } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import { hasWwwVariant, SiteProbeService } from './site-probe.service';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

const setup = () => {
  const transport = new FixtureHttpTransport();
  const service = new SiteProbeService(
    new SiteHttpClient(transport, logger, { sleep: () => Promise.resolve() }),
  );
  return { transport, service };
};

describe('SiteProbeService (recorded answers)', () => {
  // Recorded live on 2026-10-09: every other variant of yoast.com is one 301 to
  // https://yoast.com/, and a made-up address answers 404.
  it('asks the three other host variants and a missing page, and keeps every answer', async () => {
    const { service } = setup();

    const probes = await service.probe(
      'https://yoast.com',
      RobotsPolicy.allowAll(),
      7,
      AbortSignal.timeout(10_000),
    );

    expect(
      probes.hostVariants.map(({ url, redirects, finalUrl }) => [
        url,
        redirects,
        finalUrl,
      ]),
    ).toEqual([
      [
        'http://yoast.com/',
        [{ url: 'http://yoast.com/', status: 301 }],
        'https://yoast.com/',
      ],
      [
        'https://www.yoast.com/',
        [{ url: 'https://www.yoast.com/', status: 301 }],
        'https://yoast.com/',
      ],
      [
        'http://www.yoast.com/',
        [{ url: 'http://www.yoast.com/', status: 301 }],
        'https://yoast.com/',
      ],
    ]);
    expect(probes.missingPage).toMatchObject({
      url: 'https://yoast.com/seo-keyword-tracker-missing-page-7/',
      status: 404,
    });
  });

  it('does not ask for a missing page robots.txt forbids', async () => {
    const { service, transport } = setup();

    const probes = await service.probe(
      'https://yoast.com',
      RobotsPolicy.parse(
        'https://yoast.com/robots.txt',
        'User-agent: *\nDisallow: /\n',
      ),
      7,
      AbortSignal.timeout(10_000),
    );

    expect(probes.missingPage).toBeNull();
    expect(transport.requests.some((url) => url.includes('missing-page'))).toBe(
      false,
    );
  });
});

describe('hasWwwVariant', () => {
  it.each([
    ['yoast.com', true],
    ['www.semrush.com', true],
    ['blog.google', true],
    ['bbc.co.uk', true],
    ['www.example.com.au', true],
    // A subdomain is not a site's own name: nobody types www.blog.cloudflare.com.
    ['blog.cloudflare.com', false],
    ['engineering.fb.com', false],
    ['blog.example.co.uk', false],
  ])('%s → %s', (host, expected) => {
    expect(hasWwwVariant(host)).toBe(expected);
  });
});
