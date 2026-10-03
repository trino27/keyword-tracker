import type { PinoLogger } from 'nestjs-pino';
import type { TCrawlRunStatus } from '@app/contracts';
import type { UserAccountsService } from '@modules/auth/services/user-accounts/user-accounts.service';
import type { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import type { PositionSeedService } from '../position-seed/position-seed.service';
import { SeedFailedError } from './seed-failed.error';
import { SeedRunner } from './seed-runner.service';

const setup = (options: {
  hasCurrentRun?: boolean;
  activeRunId?: number | null;
  statuses?: TCrawlRunStatus[];
  total?: number;
}) => {
  const statuses = [...(options.statuses ?? ['succeeded'])];
  const runs = {
    upsertClientForWorker: jest.fn((client: { name: string }) =>
      Promise.resolve({ id: 1, name: client.name }),
    ),
    getSeedStateForWorker: () =>
      Promise.resolve({
        hasCurrentRun: options.hasCurrentRun ?? false,
        activeRunId: options.activeRunId ?? null,
      }),
    enqueueForWorker: jest.fn(() => Promise.resolve(77)),
    getRunStatusForWorker: () =>
      Promise.resolve({
        status: statuses.length > 1 ? statuses.shift()! : statuses[0],
        errorCode: 'SITEMAP_NOT_FOUND',
      }),
  };
  const accounts = {
    upsertUserForWorker: jest.fn(() => Promise.resolve({ id: 5 })),
  } as unknown as UserAccountsService;
  const positions = {
    fillForWorker: () =>
      Promise.resolve({
        pairs: 180,
        days: 365,
        rowsAdded: 0,
        total: options.total ?? 65_700,
      }),
  } as unknown as PositionSeedService;
  const logger = { info: jest.fn(), warn: jest.fn() };
  const sleeps: number[] = [];
  const runner = new SeedRunner(
    accounts,
    runs as unknown as ClientCrawlRunsService,
    positions,
    logger as unknown as PinoLogger,
    {
      sleep: (ms) => {
        sleeps.push(ms);
        return Promise.resolve();
      },
      now: () => new Date('2026-10-03T15:00:00Z'),
    },
  );
  return { runner, runs, accounts, sleeps };
};

const seed = (runner: SeedRunner, positionsOnly = false) =>
  runner.run({ password: 'demo-password', positionsOnly });

describe('SeedRunner', () => {
  it('does not enqueue for a client that already has pages', async () => {
    const { runner, runs } = setup({ hasCurrentRun: true });

    const report = await seed(runner);

    expect(runs.enqueueForWorker).not.toHaveBeenCalled();
    expect(report.crawls.map((crawl) => crawl.status)).toEqual([
      'skipped',
      'skipped',
    ]);
  });

  it('enqueues a seed crawl and polls until it ends', async () => {
    const { runner, runs, sleeps } = setup({
      statuses: ['queued', 'running', 'succeeded'],
    });

    const report = await seed(runner);

    expect(runs.enqueueForWorker).toHaveBeenCalledWith(1, 'seed');
    expect(report.crawls[0]).toEqual({
      client: 'Semrush',
      runId: 77,
      status: 'succeeded',
    });
    expect(sleeps).toEqual([2_000, 2_000]);
  });

  it('waits for a run already in flight instead of enqueueing another', async () => {
    const { runner, runs } = setup({ activeRunId: 12 });

    const report = await seed(runner);

    expect(runs.enqueueForWorker).not.toHaveBeenCalled();
    expect(report.crawls[0].runId).toBe(12);
  });

  it('fails with the crawl’s error code', async () => {
    const { runner } = setup({ statuses: ['failed'] });

    await expect(seed(runner)).rejects.toThrow(
      new SeedFailedError('The crawl of Semrush failed (SITEMAP_NOT_FOUND).'),
    );
  });

  it('fails when fewer than 50 000 snapshots exist after filling', async () => {
    const { runner } = setup({ total: 49_999 });

    await expect(seed(runner)).rejects.toBeInstanceOf(SeedFailedError);
  });

  it('with positionsOnly touches no account and no crawl', async () => {
    const { runner, runs, accounts } = setup({});

    const report = await seed(runner, true);

    expect(accounts.upsertUserForWorker).not.toHaveBeenCalled();
    expect(runs.upsertClientForWorker).not.toHaveBeenCalled();
    expect(report.crawls).toEqual([]);
  });
});
