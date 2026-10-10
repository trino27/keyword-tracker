import { PAGE_SPEED_ERROR_CODES } from '@app/contracts';
import {
  RemoteApiTimeoutError,
  RemoteApiTooLargeError,
  RemoteApiUnavailableError,
} from '@infrastructure/remote-api/remote-api.errors';
import { pageSpeedFixtureBody } from '../../_testing/read-page-speed-fixture';
import { classifyPsiResponse, type TPsiOutcome } from './classify-psi-response';

const answer = (
  status: number,
  fixture: string,
  headers: Record<string, string> = {},
) => ({ response: { status, headers, body: pageSpeedFixtureBody(fixture) } });

const raw = (status: number, body: string) => ({
  response: { status, headers: {}, body: Buffer.from(body) },
});

const NOW = new Date('2026-10-10T12:00:00Z').getTime();
const classify = (input: Parameters<typeof classifyPsiResponse>[0]) =>
  classifyPsiResponse(input, NOW);

describe('classifyPsiResponse', () => {
  it('a timeout or a network failure is transient', () => {
    expect(classify({ error: new RemoteApiTimeoutError('u') })).toEqual({
      kind: 'transient',
      error: 'PSI_UNAVAILABLE',
    });
    expect(
      classify({ error: new RemoteApiUnavailableError('u', new Error('x')) }),
    ).toMatchObject({ kind: 'transient' });
  });

  it('an outbound refusal of ours is the address being refused', () => {
    expect(classify({ error: new RemoteApiTooLargeError('u', 1) })).toEqual({
      kind: 'permanent',
      error: 'PSI_REJECTED',
    });
  });

  it('rethrows what is not an outbound failure — a bug must not look like Google', () => {
    expect(() => classify({ error: new TypeError('boom') })).toThrow('boom');
  });

  /** A burst over the per-minute rate, as Google words it. */
  const PER_MINUTE = JSON.stringify({
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      message:
        "Quota exceeded for quota metric 'Queries' and limit 'Queries per minute' of service 'pagespeedonline.googleapis.com'.",
      details: [
        {
          reason: 'RATE_LIMIT_EXCEEDED',
          metadata: { quota_limit: 'defaultPerMinutePerProject' },
        },
      ],
    },
  });

  it('a 429 pauses for the default when Google names no Retry-After', () => {
    expect(classify(raw(429, PER_MINUTE))).toEqual({
      kind: 'rateLimited',
      pauseMs: 60_000,
    });
  });

  it('a 429 pauses as long as Retry-After asks, in seconds or as a date', () => {
    const withRetryAfter = (value: string) => ({
      response: {
        status: 429,
        headers: { 'retry-after': value },
        body: Buffer.from(PER_MINUTE),
      },
    });
    expect(classify(withRetryAfter('120'))).toEqual({
      kind: 'rateLimited',
      pauseMs: 120_000,
    });
    expect(
      classify(withRetryAfter(new Date(NOW + 30_000).toUTCString())),
    ).toEqual({ kind: 'rateLimited', pauseMs: 30_000 });
  });

  /**
   * Recorded: a keyless request, whose DAILY quota is zero. Retrying a spent day every
   * minute would ask Google all day for nothing, so the pause is an hour.
   */
  it('a spent daily quota pauses for an hour', () => {
    expect(classify(answer(429, 'rate-limited.json'))).toEqual({
      kind: 'rateLimited',
      pauseMs: 3_600_000,
    });
  });

  it('a quota answer is a rate limit whatever its status', () => {
    expect(
      classify(
        raw(
          403,
          JSON.stringify({
            error: {
              code: 403,
              status: 'PERMISSION_DENIED',
              errors: [{ reason: 'dailyLimitExceeded' }],
            },
          }),
        ),
      ),
    ).toMatchObject({ kind: 'rateLimited' });
  });

  /** Recorded: a well-formed key Google does not know, sent in the header. */
  it('a rejected key halts the queue rather than failing the page', () => {
    expect(classify(answer(400, 'key-invalid.json'))).toEqual({
      kind: 'keyRejected',
    });
  });

  it.each(['SERVICE_DISABLED', 'API_KEY_HTTP_REFERRER_BLOCKED'])(
    'a key Google refuses for %s is rejected too',
    (reason) => {
      expect(
        classify(
          raw(
            403,
            JSON.stringify({
              error: {
                code: 403,
                status: 'PERMISSION_DENIED',
                details: [{ reason }],
              },
            }),
          ),
        ),
      ).toEqual({ kind: 'keyRejected' });
    },
  );

  it('names a page Google could not load', () => {
    expect(classify(answer(500, 'failed-document.synthesized.json'))).toEqual({
      kind: 'permanent',
      error: 'PAGE_LOAD_FAILED',
    });
  });

  it('names a page that answered Google with an error', () => {
    expect(classify(answer(500, 'errored-document.synthesized.json'))).toEqual({
      kind: 'permanent',
      error: 'PAGE_ERRORED',
    });
  });

  it('any other Lighthouse error is Google refusing the address', () => {
    expect(
      classify(
        raw(
          500,
          JSON.stringify({
            error: { message: 'Lighthouse returned error: NOT_HTML. …' },
          }),
        ),
      ),
    ).toEqual({ kind: 'permanent', error: 'PSI_REJECTED' });
  });

  it('a 5xx without a Lighthouse error is transient', () => {
    expect(classify(answer(503, 'server-error.synthesized.json'))).toEqual({
      kind: 'transient',
      error: 'PSI_UNAVAILABLE',
    });
  });

  it('another 4xx is Google refusing the address', () => {
    expect(classify(raw(400, '{"error":{"message":"Invalid url"}}'))).toEqual({
      kind: 'permanent',
      error: 'PSI_REJECTED',
    });
  });

  it('a 200 is a measurement', () => {
    expect(classify(answer(200, 'url-field.synthesized.json'))).toMatchObject({
      kind: 'measured',
      measurement: { lcp: { value: 3100, source: 'url' } },
    });
  });

  it('a 200 with nothing to measure says so', () => {
    expect(classify(raw(200, '{"loadingExperience":{}}'))).toEqual({
      kind: 'permanent',
      error: 'NO_MEASUREMENT',
    });
  });

  /**
   * The catalogue declares, the classifier produces: every error a screen can show has a
   * case producing it. ABANDONED is the exception by design — only an expired lease
   * writes it, and the repository int-spec pins that.
   */
  it.each(PAGE_SPEED_ERROR_CODES.filter((code) => code !== 'ABANDONED'))(
    'produces %s from some answer',
    (code) => {
      const inputs: Parameters<typeof classifyPsiResponse>[0][] = [
        { error: new RemoteApiTimeoutError('u') },
        answer(500, 'failed-document.synthesized.json'),
        answer(500, 'errored-document.synthesized.json'),
        raw(400, '{"error":{"message":"Invalid url"}}'),
        raw(200, '{}'),
      ];
      const produced = inputs
        .map((input) => classify(input))
        .flatMap((outcome: TPsiOutcome) =>
          'error' in outcome ? [outcome.error] : [],
        );

      expect(produced).toContain(code);
    },
  );
});
