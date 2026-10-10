import { Injectable } from '@nestjs/common';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { PAGE_SPEED_FRESH_FOR_MS } from '@shared/page-speed-queue/page-speed-queue.constant';
import { PageSpeedRepository } from '../../repositories/page-speed/page-speed.repository';

/**
 * Where pages enter the PageSpeed queue: the crawl's finalize transaction, and the seed's
 * one-off repair. There is no third door — no scheduler, no button (plan D4, D5).
 */
@Injectable()
export class PageSpeedQueueService {
  constructor(private readonly pageSpeed: PageSpeedRepository) {}

  /**
   * Queues the run's pages that have no measurement, a failed last attempt, or a
   * measurement at least a day old — inside the crawl's transaction, so a rolled-back
   * finalize queues nothing, and a woken slot always finds its rows.
   */
  async enqueueForWorker(
    tx: Transaction,
    pageIds: number[],
    now: Date,
  ): Promise<number> {
    const staleBefore = new Date(now.getTime() - PAGE_SPEED_FRESH_FOR_MS);
    const queued = await this.pageSpeed.enqueueForWorker(
      tx,
      pageIds,
      staleBefore,
    );
    if (queued > 0) await this.pageSpeed.notifyQueued(tx);
    return queued;
  }

  /** Every current page that has never been queued; idempotent. */
  async backfillForWorker(): Promise<number> {
    const queued = await this.pageSpeed.backfillCurrentForWorker();
    if (queued > 0) await this.pageSpeed.notifyQueued();
    return queued;
  }
}
