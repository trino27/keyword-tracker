import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { CURRENT_CRAWL_RUN_STATUSES, type TCrawlTrigger } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type {
  IClientRunSummary,
  ICrawlRunRecord,
} from '../../interfaces/client-record.interface';

/** The channel the crawl worker listens on; NOTIFY is delivered only on commit. */
export const CRAWL_QUEUED_CHANNEL = 'crawl_run_queued';

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
   */
  async summariesForClients(
    clientIds: number[],
  ): Promise<Map<number, IClientRunSummary>> {
    const summaries = new Map<number, IClientRunSummary>(
      clientIds.map((id) => [id, { latest: null, currentPageCount: 0 }]),
    );
    if (clientIds.length === 0) return summaries;

    const latest = await this.db
      .selectDistinctOn([crawlRuns.clientId], runColumns)
      .from(crawlRuns)
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
}
