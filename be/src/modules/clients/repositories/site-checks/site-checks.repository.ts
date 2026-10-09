import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { ISiteCheckResult, TSiteCheckCode } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import { crawlRuns } from '@persistence/schema/tables/crawl-runs/crawl-runs.schema';
import { siteChecks } from '@persistence/schema/tables/site-checks/site-checks.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';

@Injectable()
export class SiteChecksRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * A run's site checks, for a run the scope's user owns — the owner is in the query, so
   * another user's run id comes back empty rather than relying on a check before it.
   */
  async listByRun(
    scope: IUserScope,
    runId: number,
  ): Promise<ISiteCheckResult[]> {
    const rows = await this.db
      .select({
        code: siteChecks.code,
        status: siteChecks.status,
        severity: siteChecks.severity,
        details: siteChecks.details,
      })
      .from(siteChecks)
      .innerJoin(crawlRuns, eq(crawlRuns.id, siteChecks.runId))
      .innerJoin(
        clients,
        and(
          eq(clients.id, crawlRuns.clientId),
          eq(clients.userId, scope.userId),
        ),
      )
      .where(eq(siteChecks.runId, runId))
      .orderBy(asc(siteChecks.id));
    return rows.map((row) => ({ ...row, code: row.code as TSiteCheckCode }));
  }

  /**
   * Replaces a run's site checks. Delete-then-insert, because an earlier attempt of the
   * same run may have written them before it lost its lease.
   */
  async replaceForWorker(
    tx: Transaction,
    runId: number,
    checks: readonly ISiteCheckResult[],
  ): Promise<void> {
    await tx.delete(siteChecks).where(eq(siteChecks.runId, runId));
    if (checks.length === 0) return;
    await tx
      .insert(siteChecks)
      .values(checks.map((check) => ({ ...check, runId })));
  }
}
