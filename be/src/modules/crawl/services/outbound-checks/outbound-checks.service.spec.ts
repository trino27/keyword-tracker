import type { PinoLogger } from 'nestjs-pino';
import type {
  IHttpRequest,
  IHttpResponse,
  IHttpTransport,
} from '@infrastructure/remote-api/http-transport/http-transport.interface';
import { RemoteApiUnavailableError } from '@infrastructure/remote-api/remote-api.errors';
import { makeCheckInput } from '@modules/page-analysis/services/checks/_testing/make-check-input';
import { OUTBOUND_CHECK_LIMITS } from '../../constants/outbound-checks.constant';
import type { ICrawledPage } from '../../interfaces/crawled-page.interface';
import { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import {
  OutboundChecksService,
  type IOutboundLimits,
} from './outbound-checks.service';

type THandler = (
  request: IHttpRequest,
) => Promise<IHttpResponse> | IHttpResponse;

/** A transport that answers by handler, logs every URL and measures what is in flight. */
class FakeTransport implements IHttpTransport {
  readonly requests: string[] = [];
  inFlight = 0;
  maxInFlight = 0;
  readonly perHost = new Map<string, number>();
  maxPerHost = 0;

  constructor(private readonly handler: THandler) {}

  async send(request: IHttpRequest): Promise<IHttpResponse> {
    this.requests.push(request.url);
    const host = new URL(request.url).host;
    this.inFlight += 1;
    this.perHost.set(host, (this.perHost.get(host) ?? 0) + 1);
    this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
    this.maxPerHost = Math.max(this.maxPerHost, this.perHost.get(host)!);
    try {
      return await this.handler(request);
    } finally {
      this.inFlight -= 1;
      this.perHost.set(host, this.perHost.get(host)! - 1);
    }
  }
}

const ok = (
  body = '',
  headers: Record<string, string> = {},
): IHttpResponse => ({
  status: 200,
  headers,
  body: Buffer.from(body),
  ttfbMs: 1,
});
const status = (code: number): IHttpResponse => ({
  status: code,
  headers: {},
  body: Buffer.alloc(0),
  ttfbMs: 1,
});
const later = <T>(ms: number, value: T, signal: AbortSignal) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => resolve(value), ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    });
  });

/** robots.txt answers 404 everywhere unless the handler says otherwise. */
const withRobots =
  (handler: THandler, robots: Record<string, IHttpResponse> = {}): THandler =>
  (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/robots.txt')
      return robots[url.origin] ?? status(404);
    return handler(request);
  };

const post = (
  path: string,
  position: number,
  parsed: Partial<ICrawledPage['parsed']> = {},
): ICrawledPage => {
  const input = makeCheckInput({
    url: `https://a.example/${path}/`,
    finalUrl: `https://a.example/${path}/`,
    parsed: {
      canonicals: [`https://a.example/${path}/`],
      alternates: [],
      links: [],
      ...parsed,
    },
  });
  return {
    ...input,
    redirects: [...input.redirects],
    sitemapPosition: position,
    httpStatus: 200,
    responseMs: 10,
  };
};

const service = (
  transport: IHttpTransport,
  limits: Partial<IOutboundLimits> = {},
) =>
  new OutboundChecksService(
    new SiteHttpClient(
      transport,
      {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as unknown as PinoLogger,
      { sleep: () => Promise.resolve() },
    ),
    { ...OUTBOUND_CHECK_LIMITS, ...limits },
  );

const check = (
  transport: IHttpTransport,
  pages: ICrawledPage[],
  limits: Partial<IOutboundLimits> = {},
  robots = RobotsPolicy.allowAll(),
) =>
  service(transport, limits).check({
    pages,
    robots,
    robotsOrigin: 'https://a.example',
    signal: AbortSignal.timeout(10_000),
  });

const links = (...urls: string[]) => ({ links: urls });

describe('OutboundChecksService', () => {
  it('checks at most 300 link URLs and marks the rest unchecked: budget', async () => {
    const transport = new FakeTransport(withRobots(() => ok()));

    const facts = await check(
      transport,
      [
        post(
          'p',
          0,
          links(
            'https://b.example/1',
            'https://b.example/2',
            'https://b.example/3',
          ),
        ),
      ],
      { maxLinkUrls: 2 },
    );

    expect(facts.links.get('https://b.example/3')).toEqual({
      kind: 'unchecked',
      reason: 'budget',
    });
    expect(facts.links.get('https://b.example/2')).toMatchObject({
      kind: 'answered',
      status: 200,
    });
  });

  it('orders by sitemap position, then document order', async () => {
    const transport = new FakeTransport(withRobots(() => ok()));

    const facts = await check(
      transport,
      [
        post('second', 1, links('https://b.example/late')),
        post(
          'first',
          0,
          links('https://b.example/early', 'https://b.example/next'),
        ),
      ],
      { maxLinkUrls: 2 },
    );

    expect(facts.links.get('https://b.example/late')).toMatchObject({
      kind: 'unchecked',
    });
    expect(facts.links.get('https://b.example/next')).toMatchObject({
      kind: 'answered',
    });
  });

  it("builds a run page's outcome from its own fetch, without a request", async () => {
    const transport = new FakeTransport(withRobots(() => ok()));
    const target = post('target', 1);

    const facts = await check(transport, [
      post('p', 0, links('https://a.example/target/#top')),
      target,
    ]);

    expect(facts.links.get('https://a.example/target/')).toEqual({
      kind: 'answered',
      status: 200,
      redirects: [],
      finalUrl: 'https://a.example/target/',
    });
    expect(transport.requests).not.toContain('https://a.example/target/');
  });

  it("keeps a run page's redirect when the link names the address before its slash", async () => {
    const transport = new FakeTransport(withRobots(() => ok()));
    const target: ICrawledPage = {
      ...post('target', 1),
      url: 'https://a.example/target',
      redirects: [{ url: 'https://a.example/target', status: 301 }],
    };

    const facts = await check(transport, [
      post('p', 0, links('https://a.example/target')),
      target,
    ]);

    expect(facts.links.get('https://a.example/target')).toEqual({
      kind: 'answered',
      status: 200,
      redirects: [{ url: 'https://a.example/target', status: 301 }],
      finalUrl: 'https://a.example/target/',
    });
  });

  it('reads at most 30 documents, canonical targets first', async () => {
    const transport = new FakeTransport(
      withRobots(() =>
        ok('<html><head><meta name="robots" content="noindex"></head></html>', {
          'content-type': 'text/html',
        }),
      ),
    );

    const facts = await check(
      transport,
      [
        post('p', 0, {
          canonicals: ['https://b.example/original/'],
          alternates: [{ lang: 'de', href: 'https://b.example/de/' }],
        }),
      ],
      { maxDocuments: 1 },
    );

    expect(facts.documents.get('https://b.example/original/')).toMatchObject({
      outcome: { kind: 'answered', status: 200 },
      page: { noindex: true },
    });
    expect(facts.documents.get('https://b.example/de/')?.outcome).toEqual({
      kind: 'unchecked',
      reason: 'budget',
    });
  });

  it('never has more than 8 in flight, nor more than 2 for one host', async () => {
    const transport = new FakeTransport(
      withRobots((request) => later(20, ok(), request.signal)),
    );
    const urls = ['b', 'c', 'd', 'e', 'f', 'g'].flatMap((host) =>
      [1, 2, 3].map((n) => `https://${host}.example/${n}`),
    );

    await check(transport, [post('p', 0, links(...urls))]);

    expect(transport.maxInFlight).toBeLessThanOrEqual(8);
    expect(transport.maxPerHost).toBeLessThanOrEqual(2);
    expect(transport.maxInFlight).toBeGreaterThan(2);
  });

  it('asks each URL once, without retry, however many posts link to it', async () => {
    const transport = new FakeTransport(withRobots(() => status(503)));

    const facts = await check(transport, [
      post('p', 0, links('https://b.example/x')),
      post('q', 1, links('https://b.example/x')),
    ]);

    expect(
      transport.requests.filter((url) => url === 'https://b.example/x'),
    ).toHaveLength(1);
    expect(facts.links.get('https://b.example/x')).toMatchObject({
      kind: 'answered',
      status: 503,
    });
  });

  it('stops at the deadline and marks the rest unchecked: deadline', async () => {
    const transport = new FakeTransport(
      withRobots((request) => later(500, ok(), request.signal)),
    );

    const facts = await check(
      transport,
      [post('p', 0, links('https://b.example/1', 'https://c.example/1'))],
      { deadlineMs: 50 },
    );

    expect([...facts.links.values()]).toEqual([
      { kind: 'unchecked', reason: 'deadline' },
      { kind: 'unchecked', reason: 'deadline' },
    ]);
  });

  it("fetches each external host's robots.txt once", async () => {
    const transport = new FakeTransport(withRobots(() => ok()));

    await check(transport, [
      post(
        'p',
        0,
        links(
          'https://b.example/1',
          'https://b.example/2',
          'https://b.example/3',
        ),
      ),
    ]);

    expect(
      transport.requests.filter(
        (url) => url === 'https://b.example/robots.txt',
      ),
    ).toHaveLength(1);
  });

  it('never requests a disallowed URL', async () => {
    const transport = new FakeTransport(
      withRobots(() => ok(), {
        'https://b.example': ok('User-agent: *\nDisallow: /private/'),
      }),
    );

    const facts = await check(
      transport,
      [
        post(
          'p',
          0,
          links('https://b.example/private/x', 'https://a.example/hidden/'),
        ),
      ],
      {},
      RobotsPolicy.parse(
        'https://a.example/robots.txt',
        'User-agent: *\nDisallow: /hidden/',
      ),
    );

    expect(facts.links.get('https://b.example/private/x')).toEqual({
      kind: 'unchecked',
      reason: 'robots',
    });
    expect(facts.links.get('https://a.example/hidden/')).toEqual({
      kind: 'unchecked',
      reason: 'robots',
    });
    expect(transport.requests).not.toContain('https://b.example/private/x');
    expect(transport.requests).not.toContain('https://a.example/hidden/');
  });

  it("reads the posts' host's own robots.txt when the run's file does not govern it", async () => {
    const transport = new FakeTransport(
      withRobots(() => ok(), {
        'https://www.a.example': ok('User-agent: *\nDisallow: /drafts/'),
      }),
    );

    const facts = await check(
      transport,
      [post('p', 0, links('https://www.a.example/drafts/x'))],
      {},
      RobotsPolicy.parse('https://a.example/robots.txt', 'User-agent: *\n'),
    );

    expect(facts.links.get('https://www.a.example/drafts/x')).toEqual({
      kind: 'unchecked',
      reason: 'robots',
    });
    expect(transport.requests).toContain('https://www.a.example/robots.txt');
    expect(transport.requests).not.toContain('https://www.a.example/drafts/x');
  });

  it("asks another host's robots.txt once, never retried", async () => {
    const transport = new FakeTransport(
      withRobots(() => ok(), { 'https://b.example': status(503) }),
    );

    await check(transport, [post('p', 0, links('https://b.example/x'))]);

    expect(
      transport.requests.filter(
        (url) => url === 'https://b.example/robots.txt',
      ),
    ).toHaveLength(1);
  });

  it('marks a link whose robots.txt the deadline cut short unchecked: deadline', async () => {
    const transport = new FakeTransport((request) =>
      new URL(request.url).pathname === '/robots.txt'
        ? later(500, status(404), request.signal)
        : ok(),
    );

    const facts = await check(
      transport,
      [post('p', 0, links('https://b.example/x'))],
      { deadlineMs: 50 },
    );

    expect(facts.links.get('https://b.example/x')).toEqual({
      kind: 'unchecked',
      reason: 'deadline',
    });
  });

  it('spends no request on a link no check reads', async () => {
    const transport = new FakeTransport(withRobots(() => ok()));

    const facts = await check(transport, [
      post(
        'p',
        0,
        links(
          'https://a.example/cdn-cgi/l/email-protection',
          'https://staging.a.example/x',
          'https://b.example/x',
        ),
      ),
    ]);

    expect([...facts.links.keys()]).toEqual(['https://b.example/x']);
    expect(
      transport.requests.filter((url) => !url.endsWith('/robots.txt')),
    ).toEqual(['https://b.example/x']);
  });

  it('treats an unreachable robots.txt as disallowing the host', async () => {
    const transport = new FakeTransport(
      withRobots(() => ok(), { 'https://b.example': status(503) }),
    );

    const facts = await check(transport, [
      post('p', 0, links('https://b.example/x')),
    ]);

    expect(facts.links.get('https://b.example/x')).toEqual({
      kind: 'unchecked',
      reason: 'robots',
    });
  });

  it('a host refusing every connection leaves outcomes, not an error', async () => {
    const transport = new FakeTransport((request) => {
      if (new URL(request.url).host === 'down.example')
        throw new RemoteApiUnavailableError(
          request.url,
          new Error('ECONNREFUSED'),
        );
      return withRobots(() => ok())(request);
    });

    const facts = await check(transport, [
      post('p', 0, links('https://down.example/x')),
    ]);

    // robots.txt could not be read either, so the host is not asked at all.
    expect(facts.links.get('https://down.example/x')).toEqual({
      kind: 'unchecked',
      reason: 'robots',
    });
  });

  it('a link that cannot be reached is a failure with its kind', async () => {
    const transport = new FakeTransport(
      withRobots((request) => {
        throw new RemoteApiUnavailableError(
          request.url,
          new Error('ECONNRESET'),
        );
      }),
    );

    const facts = await check(transport, [
      post('p', 0, links('https://b.example/x')),
    ]);

    expect(facts.links.get('https://b.example/x')).toEqual({
      kind: 'failed',
      failure: 'network',
    });
  });
});
