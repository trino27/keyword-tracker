import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  ACTIVE_CRAWL_RUN_STATUSES,
  CRAWL_RUN_ERRORS,
  CURRENT_CRAWL_RUN_STATUSES,
  type TCrawlTrigger,
} from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { CRAWL_QUEUED_CHANNEL } from '@shared/crawl-queue/crawl-queue.constant';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type {
  IClaimedRun,
  IClientRunSummary,
  IClientSeedState,
  ICrawlRunRecord,
  IRunDiscovery,
  IRunOutcome,
  IRunStatus,
  IRunTarget,
} from '../../interfaces/client-record.interface';

/** A run is given up after this many claims whose lease expired. */
export const MAX_CRAWL_ATTEMPTS = 3;

const runColumns = {
  id: crawlRuns.id,
  clientId: crawlRuns.clientId,
  status: crawlRuns.status,
  trigger: crawlRuns.trigger,
  sitemapUrl: crawlRuns.sitemapUrl,
  selectionReason: crawlRuns.selectionReason,
  pagesFound: crawlRuns.pagesFound,
  pagesDone: crawlRuns.pagesDone,
  errorCode: crawlRuns.errorCode,
  errorMessage: crawlRuns.errorMessage,
  attempts: crawlRuns.attempts,
  createdAt: crawlRuns.createdAt,
  startedAt: crawlRuns.startedAt,
  finishedAt: crawlRuns.finishedAt,
};

@Injectable()
export class CrawlRunsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async insertQueued(
    tx: Transaction,
    clientId: number,
    trigger: TCrawlTrigger,
  ): Promise<ICrawlRunRecord> {
    const [row] = await tx
      .insert(crawlRuns)
      .values({ clientId, trigger })
      .returning(runColumns);
    return row;
  }

  /** Wakes the worker; delivered when the enqueuing transaction commits. */
  async notifyQueued(tx: Transaction, runId: number): Promise<void> {
    await tx.execute(
      sql`select pg_notify(${CRAWL_QUEUED_CHANNEL}, ${String(runId)})`,
    );
  }

  /**
   * Per client: the latest run (any status) and the page count of the current run —
   * the latest succeeded/partial one, whose `pages_done` IS its number of pages.
   *
   * The owner is in both queries: an id the user does not own contributes no runs, so
   * its summary stays the empty one seeded below.
   */
  async summariesForClients(
    scope: IUserScope,
    clientIds: number[],
  ): Promise<Map<number, IClientRunSummary>> {
    const summaries = new Map<number, IClientRunSummary>(
      clientIds.map((id) => [id, { latest: null, currentPageCount: 0 }]),
    );
    if (clientIds.length === 0) return summaries;

    const latest = await this.db
      .selectDistinctOn([crawlRuns.clientId], runColumns)
      .from(crawlRuns)
      .innerJoin(
        clients,
        and(
          eq(clients.id, crawlRuns.clientId),
          eq(clients.userId, scope.userId),
        ),
      )
      .where(inArray(crawlRuns.clientId, clientIds))
      .orderBy(
        crawlRuns.clientId,
        desc(crawlRuns.createdAt),
        desc(crawlRuns.id),
      );
    const current = await this.db
      .selectDistinctOn([crawlRuns.clientId], {
        clientId: crawlRuns.clientId,
        pagesDone: crawlRuns.pagesDone,
      })
      .from(crawlRuns)
      .innerJoin(
        clients,
        and(
          eq(clients.id, crawlRuns.clientId),
          eq(clients.userId, scope.userId),
        ),
      )
      .where(
        and(
          inArray(crawlRuns.clientId, clientIds),
          inArray(crawlRuns.status, [...CURRENT_CRAWL_RUN_STATUSES]),
        ),
      )
      .orderBy(
        crawlRuns.clientId,
        desc(crawlRuns.finishedAt),
        desc(crawlRuns.id),
      );

    for (const run of latest) {
      summaries.get(run.clientId)!.latest = run;
    }
    for (const run of current) {
      summaries.get(run.clientId)!.currentPageCount = run.pagesDone;
    }
    return summaries;
  }

  /** A run whose client belongs to the scope's user; null for missing and foreign alike. */
  async findOwned(
    scope: IUserScope,
    runId: number,
  ): Promise<ICrawlRunRecord | null> {
    const [row] = await this.db
      .select(runColumns)
      .from(crawlRuns)
      .innerJoin(clients, eq(clients.id, crawlRuns.clientId))
      .where(and(eq(crawlRuns.id, runId), eq(clients.userId, scope.userId)))
      .limit(1);
    return row ?? null;
  }

  // ── The queue. Every method below is unscoped (…ForWorker): the worker serves all users.

  /**
   * Claims the oldest claimable run in ONE statement: a queued run, or a running run
   * whose lease expired (its executor died). FOR UPDATE SKIP LOCKED lets several
   * workers claim concurrently without ever taking the same run.
   */
  async claimNextForWorker(leaseMs: number): Promise<IClaimedRun | null> {
    const result = await this.db.execute<{
      id: string | number;
      client_id: string | number;
      attempts: number;
    }>(sql`
      UPDATE crawl_runs
      SET status = 'running',
          attempts = attempts + 1,
          locked_until = now() + make_interval(secs => ${leaseMs / 1000}),
          started_at = coalesce(started_at, now())
      WHERE id = (
        SELECT id FROM crawl_runs
        WHERE (status = 'queued' OR (status = 'running' AND locked_until < now()))
          AND attempts < ${MAX_CRAWL_ATTEMPTS}
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1)
      RETURNING id, client_id, attempts`);
    const row = result.rows[0];
    return row
      ? {
          id: Number(row.id),
          clientId: Number(row.client_id),
          attempts: Number(row.attempts),
        }
      : null;
  }

  /** Runs whose lease expired on their last allowed attempt become failed. */
  async failAbandonedForWorker(): Promise<void> {
    await this.db
      .update(crawlRuns)
      .set({
        status: 'failed',
        errorCode: 'CRAWL_ABANDONED',
        errorMessage: CRAWL_RUN_ERRORS.CRAWL_ABANDONED.message,
        finishedAt: sql`now()`,
        lockedUntil: null,
      })
      .where(
        and(
          eq(crawlRuns.status, 'running'),
          sql`${crawlRuns.lockedUntil} < now()`,
          sql`${crawlRuns.attempts} >= ${MAX_CRAWL_ATTEMPTS}`,
        ),
      );
  }

  /**
   * Extends the lease. False when another attempt now owns the run — the caller has
   * been superseded and must stop.
   */
  async renewLeaseForWorker(
    runId: number,
    attempt: number,
    leaseMs: number,
  ): Promise<boolean> {
    const rows = await this.db
      .update(crawlRuns)
      .set({
        lockedUntil: sql`now() + make_interval(secs => ${leaseMs / 1000})`,
      })
      .where(this.ownedBy(runId, attempt))
      .returning({ id: crawlRuns.id });
    return rows.length > 0;
  }

  async recordDiscoveryForWorker(
    runId: number,
    attempt: number,
    discovery: IRunDiscovery,
  ): Promise<void> {
    await this.db
      .update(crawlRuns)
      .set(discovery)
      .where(this.ownedBy(runId, attempt));
  }

  async recordProgressForWorker(
    runId: number,
    attempt: number,
    pagesDone: number,
  ): Promise<void> {
    await this.db
      .update(crawlRuns)
      .set({ pagesDone })
      .where(this.ownedBy(runId, attempt));
  }

  /**
   * The fence of the finalize transaction: locks the run only if THIS attempt still
   * owns it. False → a newer attempt took over; the caller rolls back and writes nothing.
   */
  async lockForFinalizeForWorker(
    tx: Transaction,
    runId: number,
    attempt: number,
  ): Promise<boolean> {
    const rows = await tx
      .select({ id: crawlRuns.id })
      .from(crawlRuns)
      .where(this.ownedBy(runId, attempt))
      .for('update');
    return rows.length > 0;
  }

  async finalizeForWorker(
    tx: Transaction,
    runId: number,
    outcome: IRunOutcome,
  ): Promise<void> {
    await tx
      .update(crawlRuns)
      .set({ ...outcome, finishedAt: sql`now()`, lockedUntil: null })
      .where(eq(crawlRuns.id, runId));
  }

  async getRunTargetForWorker(runId: number): Promise<IRunTarget | null> {
    const [row] = await this.db
      .select({
        clientId: clients.id,
        websiteUrl: clients.websiteUrl,
        siteKey: clients.siteKey,
      })
      .from(crawlRuns)
      .innerJoin(clients, eq(clients.id, crawlRuns.clientId))
      .where(eq(crawlRuns.id, runId))
      .limit(1);
    return row ?? null;
  }

  /** Whether the client has pages to show, and the run in flight if there is one. */
  async seedStateForWorker(clientId: number): Promise<IClientSeedState> {
    const rows = await this.db
      .select({ id: crawlRuns.id, status: crawlRuns.status })
      .from(crawlRuns)
      .where(
        and(
          eq(crawlRuns.clientId, clientId),
          inArray(crawlRuns.status, [
            ...CURRENT_CRAWL_RUN_STATUSES,
            ...ACTIVE_CRAWL_RUN_STATUSES,
          ]),
        ),
      );
    const current: readonly string[] = CURRENT_CRAWL_RUN_STATUSES;
    return {
      hasCurrentRun: rows.some((row) => current.includes(row.status)),
      activeRunId:
        rows.find((row) => !current.includes(row.status))?.id ?? null,
    };
  }

  async findStatusForWorker(runId: number): Promise<IRunStatus | null> {
    const [row] = await this.db
      .select({ status: crawlRuns.status, errorCode: crawlRuns.errorCode })
      .from(crawlRuns)
      .where(eq(crawlRuns.id, runId))
      .limit(1);
    return row ?? null;
  }

  private ownedBy(runId: number, attempt: number) {
    return and(
      eq(crawlRuns.id, runId),
      eq(crawlRuns.status, 'running'),
      eq(crawlRuns.attempts, attempt),
    );
  }
}
