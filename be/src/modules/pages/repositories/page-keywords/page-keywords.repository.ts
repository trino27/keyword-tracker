import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { pageKeywords } from '@persistence/schema/tables/page-keywords/page-keywords.schema';

export interface IUpsertPageKeyword {
  pageId: number;
  keywordId: number;
  relevance: number;
  lastSeenRunId: number;
}

@Injectable()
export class PageKeywordsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Upserts a run's pairs. A surviving pair gets the new relevance and run; a pair the
   * run did not select is left as it was — older run, history intact. Never deletes.
   */
  async upsertManyForWorker(
    tx: Transaction,
    rows: IUpsertPageKeyword[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await tx
      .insert(pageKeywords)
      .values(rows)
      .onConflictDoUpdate({
        target: [pageKeywords.pageId, pageKeywords.keywordId],
        set: {
          relevance: sql`excluded.relevance`,
          lastSeenRunId: sql`excluded.last_seen_run_id`,
          updatedAt: new Date(),
        },
      });
  }
}
