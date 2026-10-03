import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  CURRENT_CRAWL_RUN_STATUSES,
  type TSeoIssue,
  type TSeoIssueCode,
  type TSeoIssueSeverity,
} from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';

export interface ICurrentPageRecord {
  id: number;
  url: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  lang: string | null;
  wordCount: number;
  httpStatus: number;
  crawledAt: Date;
  clientId: number;
  clientName: string;
  clientWebsiteUrl: string;
}

/**
 * A stored finding, as the catalogue types it. The cast in `issuesForPage` is the
 * trust boundary: `details_json` is whatever the crawl that wrote it stored, and this
 * is the one place it becomes a typed value.
 */
export type TIssueRecord = TSeoIssue;

export interface IHistoryRow {
  keywordId: number;
  term: string;
  capturedAt: Date | null;
  position: number | null;
}

interface IPageRow extends Record<string, unknown> {
  id: string;
  url: string;
  final_url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  lang: string | null;
  word_count: number;
  http_status: number;
  crawled_at: string | Date;
  client_id: string;
  client_name: string;
  client_website_url: string;
}

interface IHistoryDbRow extends Record<string, unknown> {
  keyword_id: string;
  term: string;
  captured_at: string | Date | null;
  position: number | null;
}

const CURRENT_STATUSES = sql.join(
  CURRENT_CRAWL_RUN_STATUSES.map((status) => sql`${status}`),
  sql`, `,
);

@Injectable()
export class PageDetailRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * The page if the scope's user owns it AND it is on its client's current run. A
   * page a re-crawl no longer found is history, not a page: null, like a missing one.
   */
  async findCurrentPage(
    scope: IUserScope,
    pageId: number,
  ): Promise<ICurrentPageRecord | null> {
    const { rows } = await this.db.execute<IPageRow>(sql`
      select p.id, p.url, p.final_url, p.title, p.meta_description, p.h1, p.lang,
             p.word_count, p.http_status, p.crawled_at,
             c.id as client_id, c.name as client_name, c.website_url as client_website_url
      from pages p
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      where p.id = ${pageId}
        and p.last_seen_run_id = (
          select r.id from crawl_runs r
          where r.client_id = p.client_id and r.status in (${CURRENT_STATUSES})
          order by r.finished_at desc, r.id desc
          limit 1
        )
    `);
    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      url: row.url,
      finalUrl: row.final_url,
      title: row.title,
      metaDescription: row.meta_description,
      h1: row.h1,
      lang: row.lang,
      wordCount: Number(row.word_count),
      httpStatus: Number(row.http_status),
      crawledAt: new Date(row.crawled_at),
      clientId: Number(row.client_id),
      clientName: row.client_name,
      clientWebsiteUrl: row.client_website_url,
    };
  }

  /** Call only for a page `findCurrentPage` returned. */
  async issuesForPage(pageId: number): Promise<TIssueRecord[]> {
    const { rows } = await this.db.execute<{
      code: TSeoIssueCode;
      severity: TSeoIssueSeverity;
      details_json: Record<string, unknown>;
    }>(sql`
      select code, severity, details_json from seo_issues where page_id = ${pageId}
    `);
    return rows.map(
      (row) =>
        ({
          code: row.code,
          severity: row.severity,
          details: row.details_json,
        }) as TIssueRecord,
    );
  }

  /**
   * Every current keyword of the page with its snapshots in `[fromUtc, toUtcExclusive)` —
   * one primary-key range scan per pair. A keyword without a point in the range still
   * comes back, once, with a null point.
   */
  async historyForPage(
    scope: IUserScope,
    pageId: number,
    fromUtc: string,
    toUtcExclusive: string,
  ): Promise<IHistoryRow[]> {
    const { rows } = await this.db.execute<IHistoryDbRow>(sql`
      select pk.keyword_id, k.term, s.captured_at, s.position
      from pages p
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      join page_keywords pk on pk.page_id = p.id and pk.last_seen_run_id = p.last_seen_run_id
      join keywords k on k.id = pk.keyword_id
      left join rank_snapshots s
        on s.page_id = pk.page_id
       and s.keyword_id = pk.keyword_id
       and s.captured_at >= ${fromUtc}
       and s.captured_at < ${toUtcExclusive}
      where p.id = ${pageId}
      order by pk.relevance desc, k.term, s.captured_at
    `);
    return rows.map((row) => ({
      keywordId: Number(row.keyword_id),
      term: row.term,
      capturedAt: row.captured_at === null ? null : new Date(row.captured_at),
      position: row.position === null ? null : Number(row.position),
    }));
  }
}
