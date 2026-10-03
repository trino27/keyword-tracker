import { Injectable } from '@nestjs/common';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type {
  IClaimedRun,
  ICrawlRunItemRecord,
  IRunDiscovery,
  IRunOutcome,
  IRunTarget,
} from '../../interfaces/client-record.interface';
import { CrawlRunItemsRepository } from '../../repositories/crawl-run-items/crawl-run-items.repository';
import { CrawlRunsRepository } from '../../repositories/crawl-runs/crawl-runs.repository';

/**
 * The crawl queue as the worker and the seed see it. Every method is unscoped
 * (`…ForWorker`) — the worker serves every user — and ESLint keeps them out of
 * controllers. Exported by ClientsModule; the clients module still owns the tables.
 */
@Injectable()
export class ClientCrawlRunsService {
  constructor(
    private readonly runs: CrawlRunsRepository,
    private readonly items: CrawlRunItemsRepository,
  ) {}

  claimNextForWorker(leaseMs: number): Promise<IClaimedRun | null> {
    return this.runs.claimNextForWorker(leaseMs);
  }

  failAbandonedForWorker(): Promise<void> {
    return this.runs.failAbandonedForWorker();
  }

  renewLeaseForWorker(
    runId: number,
    attempt: number,
    leaseMs: number,
  ): Promise<boolean> {
    return this.runs.renewLeaseForWorker(runId, attempt, leaseMs);
  }

  getRunTargetForWorker(runId: number): Promise<IRunTarget | null> {
    return this.runs.getRunTargetForWorker(runId);
  }

  recordDiscoveryForWorker(
    runId: number,
    attempt: number,
    discovery: IRunDiscovery,
  ): Promise<void> {
    return this.runs.recordDiscoveryForWorker(runId, attempt, discovery);
  }

  recordProgressForWorker(
    runId: number,
    attempt: number,
    pagesDone: number,
  ): Promise<void> {
    return this.runs.recordProgressForWorker(runId, attempt, pagesDone);
  }

  /** Inside the finalize transaction: true only while this attempt still owns the run. */
  lockForFinalizeForWorker(
    tx: Transaction,
    runId: number,
    attempt: number,
  ): Promise<boolean> {
    return this.runs.lockForFinalizeForWorker(tx, runId, attempt);
  }

  /** Writes the run's log and outcome; call only after lockForFinalizeForWorker held. */
  async finalizeForWorker(
    tx: Transaction,
    runId: number,
    outcome: IRunOutcome,
    items: ICrawlRunItemRecord[],
  ): Promise<void> {
    await this.items.replaceForWorker(tx, runId, items);
    await this.runs.finalizeForWorker(tx, runId, outcome);
  }
}
