import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type { PageSpeedRepository } from '../../repositories/page-speed/page-speed.repository';
import { PageSpeedQueueService } from './page-speed-queue.service';

const tx = { tx: true } as unknown as Transaction;

const setup = (queued: number) => {
  const repository = {
    enqueueForWorker: jest.fn().mockResolvedValue(queued),
    backfillCurrentForWorker: jest.fn().mockResolvedValue(queued),
    notifyQueued: jest.fn().mockResolvedValue(undefined),
  };
  const service = new PageSpeedQueueService(
    repository as unknown as PageSpeedRepository,
  );
  return { service, repository };
};

describe('PageSpeedQueueService', () => {
  it('asks for pages measured a full day before now, in the given transaction', async () => {
    const { service, repository } = setup(2);
    const now = new Date('2026-10-10T12:00:00Z');

    await service.enqueueForWorker(tx, [1, 2], now);

    expect(repository.enqueueForWorker).toHaveBeenCalledWith(
      tx,
      [1, 2],
      new Date('2026-10-09T12:00:00Z'),
    );
    expect(repository.notifyQueued).toHaveBeenCalledWith(tx);
  });

  it('wakes nobody when nothing was queued', async () => {
    const { service, repository } = setup(0);

    await service.enqueueForWorker(tx, [1], new Date());
    await service.backfillForWorker();

    expect(repository.notifyQueued).not.toHaveBeenCalled();
  });

  it('reports what the backfill queued', async () => {
    const { service } = setup(30);

    expect(await service.backfillForWorker()).toBe(30);
  });
});
