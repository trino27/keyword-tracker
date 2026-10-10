import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  type TSeoIssue,
  type TSeoIssueSeverity,
  type TSiteCheckCode,
} from '@app/contracts';
import { CURRENT_RUN_STATUSES_SQL } from '@persistence/sql/current-run-statuses';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type { IPageFinding } from '../../interfaces/page-finding.interface';

/** The crawl a report is a snapshot of: the client's latest succeeded or partial run. */
export interface ICurrentRun {
  runId: number;
  finishedAt: Date;
  pages: number;
}

/** Everything the report reads, from one consistent view of the database. */
export interface IReportSnapshot {
  run: ICurrentRun | null;
  pageFindings: IPageFinding[];
  siteFindings: ISiteFinding[];
}

type TReader = Database | Transaction;

export interface ISiteFinding {
  code: TSiteCheckCode;
  severity: TSeoIssueSeverity;
  details: Record<string, unknown>;
}

/**
 * The report's reads — a read model over three owners' tables (pages, clients, site
 * checks), so it owns none of them. Every statement joins `clients` on the scope's user:
 * the owner is in the query, never only in the caller (data isolation).
 */
@Injectable()
export class IssueReportRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * The current run, its pages' findings and its failed site checks, read in ONE
   * read-only, repeatable-read transaction — so the report is a snapshot in fact, not
   * three reads a finishing crawl could fall between.
   */
  snapshot(scope: IUserScope, clientId: number): Promise<IReportSnapshot> {
    return this.db.transaction(
      async (tx) => {
        const run = await this.currentRun(scope, clientId, tx);
        if (!run) return { run, pageFindings: [], siteFindings: [] };
        const pageFindings = await this.pageFindings(
          scope,
          clientId,
          run.runId,
          tx,
        );
        const siteFindings = await this.failedSiteChecks(scope, run.runId, tx);
        return { run, pageFindings, siteFindings };
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );
  }

  /**
   * The client's current run — never a newer FAILED one, whose site checks describe a
   * crawl whose pages are not the ones listed. Null: no crawl has finished yet.
   */
  async currentRun(
    scope: IUserScope,
    clientId: number,
    reader: TReader = this.db,
  ): Promise<ICurrentRun | null> {
    const { rows } = await reader.execute<{
      id: string;
      finished_at: string | Date;
      pages: string;
    }>(sql`
      select r.id, r.finished_at,
             (select count(*) from pages p where p.last_seen_run_id = r.id) as pages
      from crawl_runs r
      join clients c on c.id = r.client_id and c.user_id = ${scope.userId}
      where r.client_id = ${clientId} and r.status in (${CURRENT_RUN_STATUSES_SQL})
      order by r.finished_at desc, r.id desc
      limit 1
    `);
    const row = rows[0];
    return row
      ? {
          runId: Number(row.id),
          finishedAt: new Date(row.finished_at),
          pages: Number(row.pages),
        }
      : null;
  }

  /** Every finding on the run's pages — crawl and speed — with when speed was measured. */
  async pageFindings(
    scope: IUserScope,
    clientId: number,
    runId: number,
    reader: TReader = this.db,
  ): Promise<IPageFinding[]> {
    const { rows } = await reader.execute<{
      code: TSeoIssue['code'];
      severity: TSeoIssueSeverity;
      details_json: Record<string, unknown>;
      page_id: string;
      url: string;
      title: string | null;
      measured_at: string | Date | null;
    }>(sql`
      select i.code, i.severity, i.details_json,
             p.id as page_id, p.url, p.title, ps.measured_at
      from seo_issues i
      join pages p on p.id = i.page_id
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      left join page_speed ps on ps.page_id = p.id
      where p.client_id = ${clientId} and p.last_seen_run_id = ${runId}
      order by p.sitemap_position, p.id, i.code
    `);
    return rows.map((row) => ({
      // The trust boundary, as in the page detail: details_json is what the writer stored.
      issue: {
        code: row.code,
        severity: row.severity,
        details: row.details_json,
      } as TSeoIssue,
      page: { id: Number(row.page_id), url: row.url, title: row.title },
      measuredAt: row.measured_at === null ? null : new Date(row.measured_at),
    }));
  }

  /** The run's FAILED site checks; a pass or a skip is not an issue. */
  async failedSiteChecks(
    scope: IUserScope,
    runId: number,
    reader: TReader = this.db,
  ): Promise<ISiteFinding[]> {
    const { rows } = await reader.execute<{
      code: TSiteCheckCode;
      severity: TSeoIssueSeverity;
      details_json: Record<string, unknown>;
    }>(sql`
      select s.code, s.severity, s.details_json
      from site_checks s
      join crawl_runs r on r.id = s.run_id
      join clients c on c.id = r.client_id and c.user_id = ${scope.userId}
      where s.run_id = ${runId} and s.status = 'failed'
      order by s.code
    `);
    return rows.map((row) => ({
      code: row.code,
      severity: row.severity,
      details: row.details_json,
    }));
  }
}
