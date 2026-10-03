import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { crawlRunItems } from '@persistence/schema/tables/crawl-run-items/crawl-run-items.schema';
import type { ICrawlRunItemRecord } from '../../interfaces/client-record.interface';

@Injectable()
export class CrawlRunItemsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** A run's log in sitemap order. The caller has already checked ownership of the run. */
  listByRun(runId: number): Promise<ICrawlRunItemRecord[]> {
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
