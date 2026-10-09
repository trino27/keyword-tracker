import { Injectable } from '@nestjs/common';
import { parseWebsiteUrl, type TCrawlTrigger } from '@app/contracts';
import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { uniqueViolationConstraint } from '@persistence/errors/unique-violation.util';
import type {
  IClaimedRun,
  IClientRecord,
  IClientSeedState,
  ICrawlRunItemRecord,
  IRunDiscovery,
  IRunOutcome,
  IRunStatus,
  IRunTarget,
} from '../../interfaces/client-record.interface';
import { ClientsRepository } from '../../repositories/clients/clients.repository';
import type { ISiteCheckResult } from '@app/contracts';
import { SiteChecksRepository } from '../../repositories/site-checks/site-checks.repository';
import { CrawlRunItemsRepository } from '../../repositories/crawl-run-items/crawl-run-items.repository';
import { CrawlRunsRepository } from '../../repositories/crawl-runs/crawl-runs.repository';

const ACTIVE_RUN_INDEX = 'crawl_runs_client_id_active_uq';

export interface ISeedClient {
  userId: number;
  name: string;
  websiteUrl: string;
}

/**
 * The crawl queue as the worker and the seed see it. Every method is unscoped
 * (`…ForWorker`) — the worker serves every user — and ESLint keeps them out of
 * controllers. Exported by ClientsModule; the clients module still owns the tables.
 */
@Injectable()
export class ClientCrawlRunsService {
  constructor(
    private readonly clients: ClientsRepository,
    private readonly runs: CrawlRunsRepository,
    private readonly items: CrawlRunItemsRepository,
    private readonly siteChecks: SiteChecksRepository,
    private readonly transactions: TransactionRunner,
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

  /**
   * Writes the run's log, its site checks and its outcome; call only after
   * lockForFinalizeForWorker held.
   */
  async finalizeForWorker(
    tx: Transaction,
    runId: number,
    outcome: IRunOutcome,
    items: ICrawlRunItemRecord[],
    siteChecks: readonly ISiteCheckResult[] = [],
  ): Promise<void> {
    await this.items.replaceForWorker(tx, runId, items);
    await this.siteChecks.replaceForWorker(tx, runId, siteChecks);
    await this.runs.finalizeForWorker(tx, runId, outcome);
  }

  // ── The seed.

  /** Creates the client, or returns the existing one for the same user and site. */
  async upsertClientForWorker(client: ISeedClient): Promise<IClientRecord> {
    const website = parseWebsiteUrl(client.websiteUrl);
    if (!website.ok) {
      throw new InvariantViolationException(
        `Seed website "${client.websiteUrl}" is not valid: ${website.reason}`,
      );
    }
    return this.clients.upsertForWorker({
      userId: client.userId,
      name: client.name,
      websiteUrl: website.origin,
      siteKey: website.siteKey,
    });
  }

  getSeedStateForWorker(clientId: number): Promise<IClientSeedState> {
    return this.runs.seedStateForWorker(clientId);
  }

  getRunStatusForWorker(runId: number): Promise<IRunStatus | null> {
    return this.runs.findStatusForWorker(runId);
  }

  /**
   * Queues a run and wakes the worker. When a run is already queued or running —
   * someone pressed "re-crawl" a moment ago — that run is the answer.
   */
  async enqueueForWorker(
    clientId: number,
    trigger: TCrawlTrigger,
  ): Promise<number> {
    try {
      return await this.transactions.run(async (tx) => {
        const run = await this.runs.insertQueued(tx, clientId, trigger);
        await this.runs.notifyQueued(tx, run.id);
        return run.id;
      });
    } catch (error: unknown) {
      if (uniqueViolationConstraint(error) !== ACTIVE_RUN_INDEX) throw error;
      const { activeRunId } = await this.runs.seedStateForWorker(clientId);
      if (activeRunId === null) throw error;
      return activeRunId;
    }
  }
}
