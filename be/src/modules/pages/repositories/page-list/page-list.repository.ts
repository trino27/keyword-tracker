import { Inject, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import {
  CURRENT_CRAWL_RUN_STATUSES,
  type TSeoIssueSeverity,
} from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';

export interface IPageListFilter {
  clientId?: number;
  /** ILIKE patterns, already escaped and wrapped in `%`; both or neither. */
  search?: { urlPattern: string; termPattern: string };
}

export interface IPageListRow {
  id: number;
  url: string;
  title: string | null;
  clientId: number;
  clientName: string;
  checksApplicable: number;
  checksFailed: number;
}

export interface IPageKeywordRow {
  pageId: number;
  keywordId: number;
  term: string;
  relevance: number;
  latestPosition: number | null;
  latestCapturedAt: Date | null;
}

export interface IIssueCountRow {
  pageId: number;
  severity: TSeoIssueSeverity;
  count: number;
}

interface ISliceRow extends Record<string, unknown> {
  id: string;
  url: string;
  title: string | null;
  client_id: string;
  client_name: string;
  checks_applicable: number;
  checks_failed: number;
}

interface IKeywordRow extends Record<string, unknown> {
  page_id: string;
  keyword_id: string;
  term: string;
  relevance: number;
  latest_position: number | null;
  latest_captured_at: string | Date | null;
}

interface IIssueRow extends Record<string, unknown> {
  page_id: string;
  severity: TSeoIssueSeverity;
  count: string;
}

const CURRENT_STATUSES = sql.join(
  CURRENT_CRAWL_RUN_STATUSES.map((status) => sql`${status}`),
  sql`, `,
);

/**
 * The pages list, in four statements whatever the page size (§10.7): the slice, the
 * total, the slice's keywords with their latest position, the slice's issue counts.
 * Every statement filters by the scope's user. "Current" = on the client's latest
 * succeeded or partial run; a page a later crawl no longer found is not listed.
 */
@Injectable()
export class PageListRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async listSlice(
    scope: IUserScope,
    filter: IPageListFilter,
    limit: number,
    offset: number,
  ): Promise<IPageListRow[]> {
    const { rows } = await this.db.execute<ISliceRow>(sql`
      ${this.currentPages(scope, filter)}
      select p.id, p.url, p.title, p.checks_applicable, p.checks_failed,
             c.id as client_id, c.name as client_name
      from current_pages p
      join clients c on c.id = p.client_id
      order by c.name, c.id, p.sitemap_position, p.id
      limit ${limit} offset ${offset}
    `);
    return rows.map((row) => ({
      id: Number(row.id),
      url: row.url,
      title: row.title,
      clientId: Number(row.client_id),
      clientName: row.client_name,
      checksApplicable: Number(row.checks_applicable),
      checksFailed: Number(row.checks_failed),
    }));
  }

  async countMatching(
    scope: IUserScope,
    filter: IPageListFilter,
  ): Promise<number> {
    const { rows } = await this.db.execute<{ total: string }>(sql`
      ${this.currentPages(scope, filter)}
      select count(*) as total from current_pages
    `);
    return Number(rows[0].total);
  }

  /** The current pairs of these pages, each with its latest snapshot (one index probe). */
  async keywordsForPages(
    scope: IUserScope,
    pageIds: number[],
  ): Promise<IPageKeywordRow[]> {
    if (pageIds.length === 0) return [];
    const { rows } = await this.db.execute<IKeywordRow>(sql`
      select pk.page_id, k.id as keyword_id, k.term, pk.relevance,
             latest.position as latest_position, latest.captured_at as latest_captured_at
      from pages p
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      join page_keywords pk on pk.page_id = p.id and pk.last_seen_run_id = p.last_seen_run_id
      join keywords k on k.id = pk.keyword_id
      left join lateral (
        select s.position, s.captured_at
        from rank_snapshots s
        where s.page_id = pk.page_id and s.keyword_id = pk.keyword_id
        order by s.captured_at desc
        limit 1
      ) latest on true
      where p.id in (${sql.join(
        pageIds.map((id) => sql`${id}`),
        sql`, `,
      )})
      order by pk.page_id, pk.relevance desc, k.term
    `);
    return rows.map((row) => ({
      pageId: Number(row.page_id),
      keywordId: Number(row.keyword_id),
      term: row.term,
      relevance: Number(row.relevance),
      latestPosition:
        row.latest_position === null ? null : Number(row.latest_position),
      latestCapturedAt:
        row.latest_captured_at === null
          ? null
          : new Date(row.latest_captured_at),
    }));
  }

  async issueCountsForPages(
    scope: IUserScope,
    pageIds: number[],
  ): Promise<IIssueCountRow[]> {
    if (pageIds.length === 0) return [];
    const { rows } = await this.db.execute<IIssueRow>(sql`
      select i.page_id, i.severity, count(*) as count
      from seo_issues i
      join pages p on p.id = i.page_id
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      where i.page_id in (${sql.join(
        pageIds.map((id) => sql`${id}`),
        sql`, `,
      )})
      group by i.page_id, i.severity
    `);
    return rows.map((row) => ({
      pageId: Number(row.page_id),
      severity: row.severity,
      count: Number(row.count),
    }));
  }

  /** `with current_pages as (…)`: the scope's current pages, filtered. */
  private currentPages(scope: IUserScope, filter: IPageListFilter): SQL {
    const byClient =
      filter.clientId === undefined
        ? sql``
        : sql`and c.id = ${filter.clientId}`;
    const bySearch = filter.search
      ? sql`and (
          p.url ilike ${filter.search.urlPattern}
          or exists (
            select 1
            from page_keywords pk
            join keywords k on k.id = pk.keyword_id
            where pk.page_id = p.id
              and pk.last_seen_run_id = p.last_seen_run_id
              and k.term ilike ${filter.search.termPattern}
          )
        )`
      : sql``;
    return sql`
      with current_runs as (
        select distinct on (r.client_id) r.id, r.client_id
        from crawl_runs r
        join clients c on c.id = r.client_id
        where c.user_id = ${scope.userId}
          and r.status in (${CURRENT_STATUSES})
          ${byClient}
        order by r.client_id, r.finished_at desc, r.id desc
      ),
      current_pages as (
        select p.*
        from current_runs cr
        join pages p on p.client_id = cr.client_id and p.last_seen_run_id = cr.id
        where true ${bySearch}
      )
    `;
  }
}
