import type { PinoLogger } from 'nestjs-pino';
import type {
  IHttpRequest,
  IHttpResponse,
  IHttpTransport,
} from '@infrastructure/remote-api/http-transport/http-transport.interface';
import { RemoteApiTimeoutError } from '@infrastructure/remote-api/remote-api.errors';
import { PsiClient } from './psi-client';

const KEY = 'AIza-test-key-never-in-a-url';

const makeClient = (answer: () => IHttpResponse | Error) => {
  const requests: IHttpRequest[] = [];
  const transport: IHttpTransport = {
    send: (request) => {
      requests.push(request);
      const outcome = answer();
      return outcome instanceof Error
        ? Promise.reject(outcome)
        : Promise.resolve(outcome);
    },
  };
  const logger = { debug: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const client = new PsiClient(transport, logger as unknown as PinoLogger, {
    sleep: () => Promise.resolve(),
  });
  return { client, requests, logger };
};

const ok = (status = 200): IHttpResponse => ({
  status,
  headers: { 'content-type': 'application/json' },
  body: Buffer.from('{}'),
  ttfbMs: 5,
});

describe('PsiClient', () => {
  it('sends the key in a header and never in the URL', async () => {
    const { client, requests, logger } = makeClient(() => ok());

    await client.runPagespeed('https://yoast.com/a/', KEY);

    expect(requests[0].headers['x-goog-api-key']).toBe(KEY);
    expect(requests[0].url).not.toContain(KEY);
    expect(requests[0].url).not.toMatch(/[?&]key=/);
    expect(JSON.stringify(logger.debug.mock.calls)).not.toContain(KEY);
  });

  /**
   * SPEED-016: Lighthouse's SEO and accessibility verdicts ride on the measurement's own
   * request, so they cost no quota of their own.
   */
  it('asks for mobile performance, SEO and accessibility in one request, with the page URL encoded', async () => {
    const { client, requests } = makeClient(() => ok());

    await client.runPagespeed('https://yoast.com/a b/?x=1', KEY);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fyoast.com%2Fa%20b%2F%3Fx%3D1&strategy=mobile&category=performance&category=seo&category=accessibility',
    );
  });

  it('one request, no retry, 90 s timeout', async () => {
    const timeout = jest.spyOn(AbortSignal, 'timeout');
    const { client, requests } = makeClient(() => ok(503));

    const result = await client.runPagespeed('https://yoast.com/a/', KEY);

    expect(requests).toHaveLength(1);
    expect(timeout).toHaveBeenCalledWith(90_000);
    expect(result).toMatchObject({ response: { status: 503 } });
    timeout.mockRestore();
  });

  it('hands a network failure back instead of throwing it', async () => {
    const { client } = makeClient(() => new RemoteApiTimeoutError('u'));

    const result = await client.runPagespeed('https://yoast.com/a/', KEY);

    expect('error' in result && result.error).toBeInstanceOf(
      RemoteApiTimeoutError,
    );
  });
});
