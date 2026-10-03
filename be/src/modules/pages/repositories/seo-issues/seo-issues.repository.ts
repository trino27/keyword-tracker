import { Inject, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { TSeoIssueCode, TSeoIssueSeverity } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { seoIssues } from '@persistence/schema/tables/seo-issues/seo-issues.schema';

export interface INewSeoIssue {
  pageId: number;
  code: TSeoIssueCode;
  severity: TSeoIssueSeverity;
  details: Record<string, unknown>;
}

@Injectable()
export class SeoIssuesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Issues describe the latest fetch only: the fetched pages' sets are replaced whole. */
  async replaceForPagesForWorker(
    tx: Transaction,
    pageIds: number[],
    rows: INewSeoIssue[],
  ): Promise<void> {
    if (pageIds.length === 0) return;
    await tx.delete(seoIssues).where(inArray(seoIssues.pageId, pageIds));
    if (rows.length > 0) await tx.insert(seoIssues).values(rows);
  }
}
