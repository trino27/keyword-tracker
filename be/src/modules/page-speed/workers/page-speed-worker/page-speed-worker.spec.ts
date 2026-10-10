import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import type { IPageSpeedSettings } from '@infrastructure/config/page-speed-settings/page-speed-settings';
import type { PageSpeedResultsService } from '@modules/pages/services/page-speed-results/page-speed-results.service';
import type { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import type { PageSpeedExecutorService } from '../../services/page-speed-executor/page-speed-executor.service';
import { PageSpeedRateLimiter } from '../../services/rate-limiter/page-speed-rate-limiter';
import { PageSpeedWorker } from './page-speed-worker';

const makeWorker = (
  options: { flag?: string; apiKey?: string | null } = {},
) => {
  let nextPage = 1;
  const results = {
    failAbandonedForWorker: jest.fn().mockResolvedValue(0),
    claimNextForWorker: jest.fn(() =>
      Promise.resolve({
        pageId: nextPage++,
        attempt: 1,
        url: 'https://a.example/p/',
      }),
    ),
  };
  // In flight until the worker stops it, as a real measurement is.
  const executor = {
    execute: jest.fn(
      (_claim: unknown, signal: AbortSignal) =>
        new Promise<void>((resolve) =>
          signal.addEventListener('abort', () => resolve()),
        ),
    ),
  };
  const listener = {
    listen: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
  // A limiter that never waits, so the tests are about the worker, not the spacing.
  const limiter = new PageSpeedRateLimiter({
    now: () => 0,
    sleep: () => Promise.resolve(),
  });
  jest
    .spyOn(limiter, 'acquire')
    .mockImplementation(() => Promise.resolve(!limiter.isHalted));
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const config = { get: jest.fn().mockReturnValue(options.flag ?? 'true') };
  const settings: IPageSpeedSettings = {
    apiKey: options.apiKey === undefined ? 'k' : options.apiKey,
  };
  const worker = new PageSpeedWorker(
    logger as unknown as PinoLogger,
    config as unknown as ConfigService,
    settings,
    results as unknown as PageSpeedResultsService,
    executor as unknown as PageSpeedExecutorService,
    limiter,
    listener as unknown as PgNotificationListener,
  );
  return { worker, results, executor, listener, limiter, logger };
};

describe('PageSpeedWorker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('does not start without a key', async () => {
    const { worker, listener, logger } = makeWorker({ apiKey: null });

    await worker.onApplicationBootstrap();

    expect(listener.listen).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringMatching(/not configured/),
    );
  });

  it('does not start with the worker flag off', async () => {
    const { worker, listener } = makeWorker({ flag: 'false' });

    await worker.onApplicationBootstrap();

    expect(listener.listen).not.toHaveBeenCalled();
  });

  it('runs at most 2 measurements at once', async () => {
    const { worker, executor } = makeWorker();

    await worker.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(10_000);

    expect(executor.execute).toHaveBeenCalledTimes(2);
    await worker.stop();
  });

  it('a rejected key halts both slots and leaves the rows to the queue', async () => {
    const { worker, executor, results, limiter } = makeWorker();
    executor.execute.mockImplementation(() => {
      limiter.halt();
      return Promise.resolve();
    });

    await worker.start();
    await jest.advanceTimersByTimeAsync(60_000);

    // Each slot measured until the halt and claimed nothing after it.
    expect(results.claimNextForWorker.mock.calls.length).toBeLessThanOrEqual(2);
    expect(await worker.runOnce()).toBe(false);
    await worker.stop();
  });

  it('stops claiming on shutdown, and aborts what is in flight', async () => {
    const { worker, executor, listener } = makeWorker();
    let signal: AbortSignal | undefined;
    executor.execute.mockImplementation((_claim, s) => {
      signal = s;
      return new Promise<void>((resolve) =>
        s.addEventListener('abort', () => resolve()),
      );
    });

    await worker.start();
    await jest.advanceTimersByTimeAsync(10);
    await worker.stop();

    expect(signal?.aborted).toBe(true);
    expect(listener.close).toHaveBeenCalled();
  });
});
