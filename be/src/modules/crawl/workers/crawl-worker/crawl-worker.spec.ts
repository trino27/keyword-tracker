import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import type { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import type { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import { CrawlWorker } from './crawl-worker';

const makeWorker = () => {
  let nextId = 1;
  let wake: () => void = () => undefined;
  const runs = {
    failAbandonedForWorker: jest.fn().mockResolvedValue(undefined),
    claimNextForWorker: jest.fn(() =>
      Promise.resolve({ id: nextId++, clientId: 1, attempts: 1 }),
    ),
    renewLeaseForWorker: jest.fn().mockResolvedValue(true),
  };
  const executor = {
    execute: jest.fn(
      (_run: unknown, _signal: AbortSignal) =>
        new Promise<void>(() => undefined),
    ),
  };
  const listener = {
    listen: jest.fn((_channel: string, onNotify: () => void) => {
      wake = onNotify;
      return Promise.resolve();
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('true') };
  const worker = new CrawlWorker(
    logger as unknown as PinoLogger,
    config as unknown as ConfigService,
    runs as unknown as ClientCrawlRunsService,
    executor,
    listener as unknown as PgNotificationListener,
  );
  return { worker, runs, executor, listener, wake: () => wake() };
};

describe('CrawlWorker', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('runs at most 2 executions at once', async () => {
    const { worker, executor } = makeWorker();

    await worker.start();
    await jest.advanceTimersByTimeAsync(10_000);

    expect(executor.execute).toHaveBeenCalledTimes(2);
  });

  it('wakes on a notification before the poll interval ends', async () => {
    const { worker, runs, executor, wake } = makeWorker();
    runs.claimNextForWorker.mockResolvedValue(null as never);
    executor.execute.mockResolvedValue(undefined);

    await worker.start();
    await jest.advanceTimersByTimeAsync(100);
    expect(executor.execute).not.toHaveBeenCalled();

    runs.claimNextForWorker.mockResolvedValueOnce({
      id: 42,
      clientId: 1,
      attempts: 1,
    });
    wake();
    await jest.advanceTimersByTimeAsync(1);

    expect(executor.execute).toHaveBeenCalledWith(
      { id: 42, clientId: 1, attempts: 1 },
      expect.any(AbortSignal),
    );
    await worker.stop();
  });

  it('stops claiming on shutdown', async () => {
    const { worker, runs, listener } = makeWorker();
    runs.claimNextForWorker.mockResolvedValue(null as never);

    await worker.start();
    await jest.advanceTimersByTimeAsync(10);
    await worker.stop();
    const claims = runs.claimNextForWorker.mock.calls.length;
    await jest.advanceTimersByTimeAsync(30_000);

    expect(runs.claimNextForWorker.mock.calls.length).toBe(claims);
    expect(listener.close).toHaveBeenCalled();
  });

  it('aborts the execution when the lease is lost to a newer attempt', async () => {
    const { worker, runs, executor } = makeWorker();
    runs.renewLeaseForWorker.mockResolvedValue(false);
    let signal: AbortSignal | undefined;
    executor.execute.mockImplementation((_run: unknown, s: AbortSignal) => {
      signal = s;
      return new Promise<void>(() => undefined);
    });

    await worker.start();
    await jest.advanceTimersByTimeAsync(10_001);

    expect(signal?.aborted).toBe(true);
  });

  it('does not start when CRAWL_WORKER_ENABLED is not "true"', async () => {
    const { worker, runs } = makeWorker();
    (
      worker as unknown as { config: { get: jest.Mock } }
    ).config.get.mockReturnValue('false');

    await worker.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(5_000);

    expect(runs.claimNextForWorker).not.toHaveBeenCalled();
  });
});
