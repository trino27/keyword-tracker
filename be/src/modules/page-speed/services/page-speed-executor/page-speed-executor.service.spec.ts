import type { PinoLogger } from 'nestjs-pino';
import { PageSpeedRuntimeState } from '@infrastructure/config/page-speed-settings/page-speed-runtime-state';
import { RemoteApiTimeoutError } from '@infrastructure/remote-api/remote-api.errors';
import type { PageSpeedResultsService } from '@modules/pages/services/page-speed-results/page-speed-results.service';
import { pageSpeedFixtureBody } from '../../_testing/read-page-speed-fixture';
import type { TPsiCallResult } from '../classify-psi-response/classify-psi-response';
import type { PsiClient } from '../psi-client/psi-client';
import { PageSpeedRateLimiter } from '../rate-limiter/page-speed-rate-limiter';
import { PageSpeedExecutorService } from './page-speed-executor.service';

const KEY = 'AIza-secret-test-key';

const answer = (status: number, fixture: string): TPsiCallResult => ({
  response: { status, headers: {}, body: pageSpeedFixtureBody(fixture) },
});

const setup = (result: TPsiCallResult, attempt = 1) => {
  const results = {
    completeForWorker: jest.fn().mockResolvedValue(true),
    recordFailureForWorker: jest.fn().mockResolvedValue(true),
    releaseForWorker: jest.fn().mockResolvedValue(true),
  };
  const psi = { runPagespeed: jest.fn().mockResolvedValue(result) };
  const limiter = new PageSpeedRateLimiter({
    now: () => 0,
    sleep: () => Promise.resolve(),
  });
  const runtime = new PageSpeedRuntimeState();
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const executor = new PageSpeedExecutorService(
    results as unknown as PageSpeedResultsService,
    psi as unknown as PsiClient,
    limiter,
    runtime,
    { apiKey: KEY },
    logger as unknown as PinoLogger,
  );
  const claim = { pageId: 42, attempt, url: 'https://yoast.com/a/' };
  const run = () => executor.execute(claim, new AbortController().signal);
  return { run, results, psi, limiter, runtime, logger, claim };
};

describe('PageSpeedExecutorService', () => {
  it("measures the page's final URL with the key, and writes the measurement with its findings", async () => {
    const { run, results, psi, claim } = setup(answer(200, 'url-field.json'));

    await run();

    expect(psi.runPagespeed).toHaveBeenCalledWith(
      'https://yoast.com/a/',
      KEY,
      expect.any(AbortSignal),
    );
    expect(results.completeForWorker).toHaveBeenCalledWith(
      claim,
      expect.objectContaining({
        lcpMs: 3025,
        lcpSource: 'url',
        inpMs: 212,
        inpSource: 'url',
        cls: 0.01,
        clsSource: 'url',
        performanceScore: 46,
      }),
      [
        {
          code: 'CWV_LCP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 3025, max: 2500, source: 'url' },
        },
        {
          code: 'CWV_INP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 212, max: 200, source: 'url' },
        },
      ],
    );
  });

  it('a transient failure is retried later, with its attempt spent', async () => {
    const { run, results, claim } = setup(
      { error: new RemoteApiTimeoutError('u') },
      2,
    );
    const before = Date.now();

    await run();

    const [, write] = results.recordFailureForWorker.mock.calls[0] as [
      unknown,
      { status: string; lastError: string; nextAttemptAt: Date },
    ];
    expect(results.recordFailureForWorker).toHaveBeenCalledWith(
      claim,
      expect.objectContaining({
        status: 'queued',
        lastError: 'PSI_UNAVAILABLE',
      }),
    );
    // The 2nd failure waits 4 minutes.
    expect(write.nextAttemptAt.getTime() - before).toBeGreaterThanOrEqual(
      240_000,
    );
  });

  it('the 5th transient failure gives up on the page', async () => {
    const { run, results, claim } = setup(
      answer(503, 'server-error.synthesized.json'),
      5,
    );

    await run();

    expect(results.recordFailureForWorker).toHaveBeenCalledWith(claim, {
      status: 'failed',
      lastError: 'PSI_UNAVAILABLE',
    });
  });

  it('a permanent failure fails the page with its reason', async () => {
    const { run, results, claim } = setup(answer(400, 'failed-document.json'));

    await run();

    expect(results.recordFailureForWorker).toHaveBeenCalledWith(claim, {
      status: 'failed',
      lastError: 'PAGE_LOAD_FAILED',
    });
  });

  it('a 429 pauses every slot and releases the row without spending an attempt', async () => {
    const { run, results, limiter, claim } = setup(
      answer(429, 'rate-limited.json'),
    );
    const pause = jest.spyOn(limiter, 'pause');

    await run();

    // The recorded answer is a spent daily quota: an hour's pause (see the classifier).
    expect(pause).toHaveBeenCalledWith(3_600_000);
    expect(results.releaseForWorker).toHaveBeenCalledWith(
      claim,
      expect.any(Date),
    );
    expect(results.recordFailureForWorker).not.toHaveBeenCalled();
  });

  it('a rejected key halts the queue, marks the state and gives the row back', async () => {
    const { run, results, limiter, runtime, claim } = setup(
      answer(400, 'key-invalid.json'),
    );

    await run();

    expect(limiter.isHalted).toBe(true);
    expect(runtime.keyRejected).toBe(true);
    expect(results.releaseForWorker).toHaveBeenCalledWith(
      claim,
      expect.any(Date),
    );
  });

  it.each([
    ['a timeout', { error: new RemoteApiTimeoutError('u') }],
    ['a 429', answer(429, 'rate-limited.json')],
    ['a rejected key', answer(400, 'key-invalid.json')],
    ['a page Google could not load', answer(400, 'failed-document.json')],
  ] as const)(
    'a failure never calls completeForWorker (%s)',
    async (_, result) => {
      const { run, results } = setup(result);

      await run();

      expect(results.completeForWorker).not.toHaveBeenCalled();
    },
  );

  it('no log line and no stored error contains the key', async () => {
    for (const result of [
      answer(200, 'url-field.json'),
      answer(400, 'key-invalid.json'),
      answer(429, 'rate-limited.json'),
      { error: new RemoteApiTimeoutError('u') },
    ]) {
      const { run, results, logger } = setup(result);
      await run();
      const written = JSON.stringify([
        logger.info.mock.calls,
        logger.warn.mock.calls,
        logger.error.mock.calls,
        logger.debug.mock.calls,
        results.recordFailureForWorker.mock.calls,
        results.completeForWorker.mock.calls,
      ]);
      expect(written).not.toContain(KEY);
    }
  });

  it('a shutdown mid-call gives the row back with its attempt', async () => {
    const { results, psi, claim } = setup(answer(200, 'url-field.json'));
    const controller = new AbortController();
    psi.runPagespeed.mockImplementation(() => {
      controller.abort();
      return Promise.resolve({ error: new RemoteApiTimeoutError('u') });
    });
    const executor = new PageSpeedExecutorService(
      results as unknown as PageSpeedResultsService,
      psi as unknown as PsiClient,
      new PageSpeedRateLimiter(),
      new PageSpeedRuntimeState(),
      { apiKey: KEY },
      {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as PinoLogger,
    );

    await executor.execute(claim, controller.signal);

    expect(results.releaseForWorker).toHaveBeenCalled();
    expect(results.recordFailureForWorker).not.toHaveBeenCalled();
  });

  /** A bug or a database blip must not leave the row running until its lease expires. */
  it('an unexpected error is a failed attempt, never a row left running', async () => {
    const { run, results, claim, logger } = setup(
      answer(200, 'url-field.json'),
      2,
    );
    results.completeForWorker.mockRejectedValue(new Error('connection reset'));

    await run();

    expect(results.recordFailureForWorker).toHaveBeenCalledWith(
      claim,
      expect.objectContaining({
        status: 'queued',
        lastError: 'PSI_UNAVAILABLE',
      }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
