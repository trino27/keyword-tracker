import type { PinoLogger } from 'nestjs-pino';
import type {
  IHttpRequest,
  IHttpResponse,
  IHttpTransport,
} from './http-transport/http-transport.interface';
import { RemoteApiCore } from './remote-api.core';
import {
  RemoteApiForbiddenAddressError,
  RemoteApiTimeoutError,
  RemoteApiTooManyRedirectsError,
} from './remote-api.errors';

type TScript = (request: IHttpRequest) => IHttpResponse | Error;

const respond = (
  status: number,
  headers: Record<string, string> = {},
  body = '',
): IHttpResponse => ({ status, headers, body: Buffer.from(body), ttfbMs: 5 });

const makeCore = (script: TScript) => {
  const requests: IHttpRequest[] = [];
  const sleeps: number[] = [];
  const transport: IHttpTransport = {
    send: (request) => {
      requests.push(request);
      const outcome = script(request);
      return outcome instanceof Error
        ? Promise.reject(outcome)
        : Promise.resolve(outcome);
    },
  };
  const logger = { debug: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const core = new RemoteApiCore(transport, logger as unknown as PinoLogger, {
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  });
  return { core, requests, sleeps };
};

const get = (core: RemoteApiCore, url: string) =>
  core.get(url, { maxBytes: 1024 * 1024 });

describe('RemoteApiCore', () => {
  it('sends the bot user agent', async () => {
    const { core, requests } = makeCore(() => respond(200));

    await get(core, 'https://example.com/');

    expect(requests[0].headers['user-agent']).toMatch(
      /^SeoKeywordTrackerBot\/1\.0/,
    );
  });

  it('follows redirects and reports the final URL', async () => {
    const { core } = makeCore((request) =>
      request.url === 'https://example.com/a'
        ? respond(301, { location: '/b' })
        : respond(200, {}, 'done'),
    );

    const response = await get(core, 'https://example.com/a');

    expect(response).toMatchObject({
      status: 200,
      url: 'https://example.com/a',
      finalUrl: 'https://example.com/b',
      redirected: true,
    });
  });

  it('refuses the 6th redirect', async () => {
    let hop = 0;
    const { core } = makeCore(() => respond(302, { location: `/r${++hop}` }));

    await expect(get(core, 'https://example.com/r0')).rejects.toBeInstanceOf(
      RemoteApiTooManyRedirectsError,
    );
  });

  it('refuses a redirect to a private IP literal without requesting it', async () => {
    const { core, requests } = makeCore(() =>
      respond(302, { location: 'http://169.254.169.254/latest/meta-data' }),
    );

    await expect(get(core, 'https://example.com/')).rejects.toBeInstanceOf(
      RemoteApiForbiddenAddressError,
    );
    expect(requests).toHaveLength(1);
  });

  it('retries a 503 and returns the following 200', async () => {
    let calls = 0;
    const { core } = makeCore(() =>
      ++calls === 1 ? respond(503) : respond(200),
    );

    await expect(get(core, 'https://example.com/')).resolves.toMatchObject({
      status: 200,
    });
    expect(calls).toBe(2);
  });

  it('does not retry a 404', async () => {
    let calls = 0;
    const { core } = makeCore(() => {
      calls += 1;
      return respond(404);
    });

    await expect(get(core, 'https://example.com/')).resolves.toMatchObject({
      status: 404,
    });
    expect(calls).toBe(1);
  });

  it('waits what Retry-After asks before retrying a 429', async () => {
    let calls = 0;
    const { core, sleeps } = makeCore(() =>
      ++calls === 1 ? respond(429, { 'retry-after': '2' }) : respond(200),
    );

    await get(core, 'https://example.com/');

    expect(sleeps).toEqual([2_000]);
  });

  it('gives up after 2 retries of a timeout', async () => {
    let calls = 0;
    const { core } = makeCore(() => {
      calls += 1;
      return new RemoteApiTimeoutError('https://example.com/');
    });

    await expect(get(core, 'https://example.com/')).rejects.toBeInstanceOf(
      RemoteApiTimeoutError,
    );
    expect(calls).toBe(3);
  });

  it.each([
    'ftp://example.com/',
    'https://u:p@example.com/',
    'http://10.0.0.1/',
  ])('refuses %s before any request', async (url) => {
    const { core, requests } = makeCore(() => respond(200));

    await expect(get(core, url)).rejects.toBeInstanceOf(
      RemoteApiForbiddenAddressError,
    );
    expect(requests).toHaveLength(0);
  });
});
