import type { PinoLogger } from 'nestjs-pino';
import type { TPsiStrategy } from '@app/contracts';
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

const setup = (
  result: TPsiCallResult,
  attempt = 1,
  strategy: TPsiStrategy = 'mobile',
) => {
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
  const claim = { pageId: 42, strategy, attempt, url: 'https://yoast.com/a/' };
  const run = () => executor.execute(claim, new AbortController().signal);
  return { run, results, psi, limiter, runtime, logger, claim };
};

describe('PageSpeedExecutorService', () => {
  it("measures the page's final URL with the key, and writes the measurement with its findings", async () => {
    const { run, results, psi, claim } = setup(answer(200, 'url-field.json'));

    await run();

    expect(psi.runPagespeed).toHaveBeenCalledWith(
      'https://yoast.com/a/',
      'mobile',
      KEY,
      expect.any(AbortSignal),
    );
    expect(results.completeForWorker).toHaveBeenCalledWith(claim, {
      strategy: 'mobile',
      measurement: expect.objectContaining({
        lcpMs: 3025,
        lcpSource: 'url',
        inpMs: 212,
        inpSource: 'url',
        cls: 0.01,
        clsSource: 'url',
        performanceScore: 46,
      }) as unknown,
      speedFindings: [
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
      lighthouseFindings: [],
    });
  });

  /** SPEED-017/018/019: one answer, every part of it written in the one completion. */
  it('writes the Lighthouse record, the category scores, the diagnostics and the Lighthouse findings', async () => {
    const { run, results, claim } = setup(
      answer(200, 'lighthouse-url-field.json'),
    );

    await run();

    const [claimed, completion] = results.completeForWorker.mock.calls[0] as [
      unknown,
      {
        strategy: string;
        measurement: Record<string, unknown> & { lighthouseJudged: string[] };
        speedFindings: unknown[];
        lighthouseFindings: { code: string }[];
      },
    ];
    const {
      measurement: write,
      speedFindings: cwv,
      lighthouseFindings: lighthouse,
    } = completion;
    expect(claimed).toBe(claim);
    expect(completion.strategy).toBe('mobile');
    expect(write).toMatchObject({
      lighthouseFailed: 1,
      seoScore: 92,
      accessibilityScore: 94,
      ttfbMs: 652,
      ttfbSource: 'url',
      lcpGoodShare: 0.6487,
      lcpPoorShare: 0.1522,
      clsGoodShare: 0.8962,
      clsPoorShare: 0.019,
      lcpBreakdown: { phases: expect.any(Array) as unknown },
    });
    expect(write.lighthouseJudged).toContain('LH_ROBOTS_TXT');
    expect(cwv.length).toBeGreaterThan(0);
    expect(lighthouse.map(({ code }) => code)).toEqual(['LH_ROBOTS_TXT']);
  });

  /** D20: the record is absent, not empty, and its old findings go with it. */
  it('writes an answer without the categories with no Lighthouse record and no Lighthouse findings', async () => {
    const { run, results } = setup(answer(200, 'url-field.json'));

    await run();

    const [, { measurement: write, lighthouseFindings: lighthouse }] = results
      .completeForWorker.mock.calls[0] as [
      unknown,
      { measurement: Record<string, unknown>; lighthouseFindings: unknown[] },
    ];
    expect(write).toMatchObject({
      lighthouseJudged: null,
      lighthouseNotApplicable: null,
      lighthouseFailed: null,
      seoScore: null,
      accessibilityScore: null,
      lcpBreakdown: null,
    });
    expect(lighthouse).toEqual([]);
  });

  it('warns once per audit the catalogue does not know, however many pages report it', async () => {
    const body = JSON.parse(
      pageSpeedFixtureBody('lighthouse-url-field.json').toString('utf8'),
    ) as {
      lighthouseResult: {
        categories: { seo: { auditRefs: { id: string; weight: number }[] } };
        audits: Record<string, unknown>;
      };
    };
    body.lighthouseResult.categories.seo.auditRefs.push({
      id: 'new-seo-audit',
      weight: 1,
    });
    body.lighthouseResult.audits['new-seo-audit'] = {
      score: 1,
      scoreDisplayMode: 'binary',
    };
    const result: TPsiCallResult = {
      response: {
        status: 200,
        headers: {},
        body: Buffer.from(JSON.stringify(body)),
      },
    };
    const { run, logger, results } = setup(result);

    await run();
    await run();

    expect(results.completeForWorker).toHaveBeenCalledTimes(2);
    const warned = logger.warn.mock.calls.filter(([fields]) =>
      JSON.stringify(fields).includes('new-seo-audit'),
    );
    expect(warned).toHaveLength(1);
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

  /** Google's live answer for an empty error page. */
  it('a page that painted nothing fails as a page answering with an error', async () => {
    const { run, results, claim } = setup(answer(400, 'no-fcp.json'));

    await run();

    expect(results.recordFailureForWorker).toHaveBeenCalledWith(claim, {
      status: 'failed',
      lastError: 'PAGE_ERRORED',
    });
  });

  it("writes the site's figures as the whole site's, with findings saying so", async () => {
    const { run, results, claim } = setup(answer(200, 'origin-only.json'));

    await run();

    expect(results.completeForWorker).toHaveBeenCalledWith(claim, {
      strategy: 'mobile',
      measurement: expect.objectContaining({
        lcpMs: 3824,
        lcpSource: 'origin',
        inpMs: 231,
        inpSource: 'origin',
        cls: 0,
        clsSource: 'origin',
        performanceScore: 59,
      }) as unknown,
      speedFindings: [
        {
          code: 'CWV_LCP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 3824, max: 2500, source: 'origin' },
        },
        {
          code: 'CWV_INP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 231, max: 200, source: 'origin' },
        },
      ],
      lighthouseFindings: [],
    });
  });

  it('writes a lab-only page without INP and, when its lab figures are good, no findings', async () => {
    const { run, results, claim } = setup(answer(200, 'lab-only.json'));

    await run();

    expect(results.completeForWorker).toHaveBeenCalledWith(claim, {
      strategy: 'mobile',
      measurement: expect.objectContaining({
        lcpMs: 809,
        lcpSource: 'lab',
        inpMs: null,
        inpSource: null,
        cls: 0,
        clsSource: 'lab',
        performanceScore: 100,
      }) as unknown,
      speedFindings: [],
      lighthouseFindings: [],
    });
  });

  it('a mobile measurement stores the image finding beside its CWV findings', async () => {
    const { run, results } = setup(answer(200, 'image-delivery-failing.json'));

    await run();

    const [, completion] = results.completeForWorker.mock.calls[0] as [
      unknown,
      { speedFindings: { code: string; details: Record<string, unknown> }[] },
    ];
    const image = completion.speedFindings.find(
      ({ code }) => code === 'IMAGE_DELIVERY_INEFFICIENT',
    );
    expect(image?.details).toMatchObject({ value: 162_175, min: 102_400 });
    expect(
      completion.speedFindings.some(({ code }) => code.startsWith('CWV_')),
    ).toBe(true);
  });

  /**
   * Lighthouse speaks for mobile alone (lighthouse-checks D16): a desktop claim writes its
   * own Core Web Vitals codes and no Lighthouse record, whatever the answer holds.
   */
  it('a desktop claim completes the desktop arm with no Lighthouse record', async () => {
    const { run, results, psi, claim } = setup(
      answer(200, 'lighthouse-url-field.json'),
      1,
      'desktop',
    );

    await run();

    const [claimed, completion] = results.completeForWorker.mock.calls[0] as [
      unknown,
      {
        strategy: string;
        measurement: Record<string, unknown>;
        speedFindings: { code: string }[];
      },
    ];
    expect(psi.runPagespeed).toHaveBeenCalledWith(
      'https://yoast.com/a/',
      'desktop',
      KEY,
      expect.any(AbortSignal),
    );
    expect(claimed).toBe(claim);
    expect(completion.strategy).toBe('desktop');
    expect(completion).not.toHaveProperty('lighthouseFindings');
    expect(completion.measurement).toMatchObject({
      lighthouseJudged: null,
      lighthouseNotApplicable: null,
      lighthouseFailed: null,
      seoScore: null,
      accessibilityScore: null,
      ttfbMs: 652,
    });
    expect(completion.speedFindings.length).toBeGreaterThan(0);
    for (const { code } of completion.speedFindings)
      expect(code).toMatch(/_DESKTOP$/);
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
