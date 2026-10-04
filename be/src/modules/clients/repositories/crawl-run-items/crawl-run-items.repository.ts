import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRunItems } from '@persistence/schema/tables/crawl-run-items/crawl-run-items.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { ICrawlRunItemRecord } from '../../interfaces/client-record.interface';

@Injectable()
export class CrawlRunItemsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * A run's log in sitemap order, for a run the scope's user owns. The owner is in
   * the query: a run id belonging to someone else comes back empty rather than
   * relying on the caller having looked first, and that stays true when a second
   * caller appears.
   */
  listByRun(scope: IUserScope, runId: number): Promise<ICrawlRunItemRecord[]> {
    return this.db
      .select({
        sitemapPosition: crawlRunItems.sitemapPosition,
        url: crawlRunItems.url,
        status: crawlRunItems.status,
        reason: crawlRunItems.reason,
        httpStatus: crawlRunItems.httpStatus,
        pageId: crawlRunItems.pageId,
      })
      .from(crawlRunItems)
      .innerJoin(crawlRuns, eq(crawlRuns.id, crawlRunItems.runId))
      .innerJoin(
        clients,
        and(
          eq(clients.id, crawlRuns.clientId),
          eq(clients.userId, scope.userId),
        ),
      )
      .where(eq(crawlRunItems.runId, runId))
      .orderBy(asc(crawlRunItems.sitemapPosition));
  }

  /**
   * Replaces a run's log. Delete-then-insert because an earlier attempt of the same
   * run may have written part of it before it lost its lease.
   */
  async replaceForWorker(
    tx: Transaction,
    runId: number,
    items: ICrawlRunItemRecord[],
  ): Promise<void> {
    await tx.delete(crawlRunItems).where(eq(crawlRunItems.runId, runId));
    if (items.length === 0) return;
    await tx
      .insert(crawlRunItems)
      .values(items.map((item) => ({ ...item, runId })));
  }
}
