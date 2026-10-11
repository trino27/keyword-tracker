import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  type TSeoIssue,
  type TSeoIssueCode,
  type TSeoIssueSeverity,
  type TPsiStrategy,
} from '@app/contracts';
import { CURRENT_RUN_STATUSES_SQL } from '@persistence/sql/current-run-statuses';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import {
  PAGE_SPEED_COLUMNS,
  pageSpeedColumns,
  pageSpeedRowOf,
  type IDesktopPageSpeedColumns,
  type IPageSpeedColumns,
  type IPageSpeedRow,
} from '../page-speed/page-speed-read';
import {
  LIGHTHOUSE_SCORE_POINTS_LATERAL,
  SCORE_POINTS_LATERAL,
  lighthousePointsOf,
  type ILighthousePoints,
  type ILighthousePointsColumns,
} from '../page-score/score-points';

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
  responseMs: number;
  checksApplicable: number;
  checksFailed: number;
  /** The score's weighed denominator and what the failed checks cost. */
  pointsPossible: number;
  pointsLost: number;
  /** Lighthouse's, null until the page is measured with its categories. */
  lighthousePoints: ILighthousePoints | null;
  /** Null together when the page's last crawl predates per-check recording. */
  checksJudged: TSeoIssueCode[] | null;
  checksNotApplicable: TSeoIssueCode[] | null;
  /**
   * Lighthouse's record from the page's measurement, null together when the page was
   * never measured with Lighthouse's categories. Read here, not in `PAGE_SPEED_COLUMNS`:
   * only the detail lists checks, so only the detail carries the lists.
   */
  lighthouseJudged: TSeoIssueCode[] | null;
  lighthouseNotApplicable: TSeoIssueCode[] | null;
  crawledAt: Date;
  clientId: number;
  clientName: string;
  clientWebsiteUrl: string;
  /** Pages on the client's current run — the denominator of "on 5 of 15 pages". */
  clientCurrentPages: number;
  /** Each device's row; the score and Lighthouse's lists read the mobile one. */
  pageSpeedByStrategy: Record<TPsiStrategy, IPageSpeedRow | null>;
}

/**
 * A stored finding, as the catalogue types it, with how many of the client's current
 * pages carry the same code. The cast in `issuesForPage` is the trust boundary:
 * `details_json` is whatever the crawl that wrote it stored, and this is the one place
 * it becomes a typed value.
 */
export type TIssueRecord = TSeoIssue & { pagesAffected: number };

export interface IHistoryRow {
  keywordId: number;
  term: string;
  capturedAt: Date | null;
  position: number | null;
}

interface IPageRow
  extends
    Record<string, unknown>,
    IPageSpeedColumns,
    IDesktopPageSpeedColumns,
    ILighthousePointsColumns {
  id: string;
  url: string;
  final_url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  lang: string | null;
  word_count: number;
  http_status: number;
  response_ms: number;
  checks_applicable: number;
  checks_failed: number;
  points_possible: string;
  points_lost: string;
  checks_judged: string[] | null;
  checks_not_applicable: string[] | null;
  lighthouse_judged: string[] | null;
  lighthouse_not_applicable: string[] | null;
  crawled_at: string | Date;
  client_id: string;
  client_name: string;
  client_website_url: string;
  client_current_pages: string;
}

interface IHistoryDbRow extends Record<string, unknown> {
  keyword_id: string;
  term: string;
  captured_at: string | Date | null;
  position: number | null;
}

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
             p.word_count, p.http_status, p.response_ms,
             p.checks_applicable, p.checks_failed,
             pts.points_possible, pts.points_lost,
             lpts.lighthouse_applicable, lpts.lighthouse_failed,
             lpts.lighthouse_points_possible, lpts.lighthouse_points_lost,
             p.checks_judged, p.checks_not_applicable, p.crawled_at,
             ps.lighthouse_judged, ps.lighthouse_not_applicable,
             c.id as client_id, c.name as client_name, c.website_url as client_website_url,
             (select count(*) from pages sib
               where sib.client_id = p.client_id
                 and sib.last_seen_run_id = p.last_seen_run_id) as client_current_pages,
             ${PAGE_SPEED_COLUMNS}, ${pageSpeedColumns('psd')}
      from pages p
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      cross join lateral (${SCORE_POINTS_LATERAL}) pts
      -- The mobile row: the summary, Lighthouse's checks and the score read it.
      left join page_speed ps on ps.page_id = p.id and ps.strategy = 'mobile'
      -- The desktop row, for the Speed block's other tab alone.
      left join page_speed psd on psd.page_id = p.id and psd.strategy = 'desktop'
      left join lateral (${LIGHTHOUSE_SCORE_POINTS_LATERAL}) lpts on true
      where p.id = ${pageId}
        and p.last_seen_run_id = (
          select r.id from crawl_runs r
          where r.client_id = p.client_id and r.status in (${CURRENT_RUN_STATUSES_SQL})
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
      responseMs: Number(row.response_ms),
      checksApplicable: Number(row.checks_applicable),
      checksFailed: Number(row.checks_failed),
      pointsPossible: Number(row.points_possible),
      pointsLost: Number(row.points_lost),
      lighthousePoints: lighthousePointsOf(row),
      // Cast, like `details_json` below: the driver hands back plain strings, and this
      // is the one place a stored code becomes a catalogue code.
      checksJudged: (row.checks_judged ?? null) as TSeoIssueCode[] | null,
      checksNotApplicable: (row.checks_not_applicable ?? null) as
        TSeoIssueCode[] | null,
      lighthouseJudged: (row.lighthouse_judged ?? null) as
        TSeoIssueCode[] | null,
      lighthouseNotApplicable: (row.lighthouse_not_applicable ?? null) as
        TSeoIssueCode[] | null,
      crawledAt: new Date(row.crawled_at),
      clientId: Number(row.client_id),
      clientName: row.client_name,
      clientWebsiteUrl: row.client_website_url,
      clientCurrentPages: Number(row.client_current_pages),
      pageSpeedByStrategy: {
        mobile: pageSpeedRowOf(row),
        desktop: pageSpeedRowOf(row, 'psd'),
      },
    };
  }

  /**
   * The owner is in the join, not in the caller. `findCurrentPage` checks it too, but a
   * second caller — or a reorder inside one — would silently remove that, which is the
   * arrangement `practices/be/security-patterns` exists to forbid.
   *
   * `pages_affected` counts the client's CURRENT pages carrying the same code, this one
   * included — one more join, no new round trip. A finding on one page is that page's
   * problem; a finding on most of them is the template's, and that is the difference the
   * screen exists to show.
   */
  async issuesForPage(
    scope: IUserScope,
    pageId: number,
  ): Promise<TIssueRecord[]> {
    const { rows } = await this.db.execute<{
      code: TSeoIssueCode;
      severity: TSeoIssueSeverity;
      details_json: Record<string, unknown>;
      pages_affected: string;
    }>(sql`
      select i.code, i.severity, i.details_json,
             (select count(distinct sib.id)
                from pages sib
                join seo_issues si on si.page_id = sib.id and si.code = i.code
               where sib.client_id = p.client_id
                 and sib.last_seen_run_id = p.last_seen_run_id) as pages_affected
      from seo_issues i
      join pages p on p.id = i.page_id
      join clients c on c.id = p.client_id and c.user_id = ${scope.userId}
      where i.page_id = ${pageId}
    `);
    return rows.map(
      (row) =>
        ({
          code: row.code,
          severity: row.severity,
          details: row.details_json,
          pagesAffected: Number(row.pages_affected),
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
