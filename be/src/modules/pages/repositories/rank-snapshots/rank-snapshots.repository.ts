import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { CURRENT_CRAWL_RUN_STATUSES } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import { rankSnapshots } from '@persistence/schema/tables/rank-snapshots/rank-snapshots.schema';

export interface INewSnapshot {
  pageId: number;
  keywordId: number;
  capturedAt: Date;
  position: number;
}

/** A pair the user can currently see, with where its position history stops. */
export interface ICurrentPairRecord {
  pageId: number;
  keywordId: number;
  url: string;
  term: string;
  relevance: number;
  lastCapturedAt: Date | null;
  lastPosition: number | null;
}

interface ICurrentPairRow extends Record<string, unknown> {
  page_id: string;
  keyword_id: string;
  url: string;
  term: string;
  relevance: number;
  last_captured_at: Date | null;
  last_position: number | null;
}

@Injectable()
export class RankSnapshotsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Inserts what is new; a row already there (same pair, same instant) is kept as is. */
  async insertManyForWorker(rows: INewSnapshot[]): Promise<number> {
    if (rows.length === 0) return 0;
    const result = await this.db
      .insert(rankSnapshots)
      .values(rows)
      .onConflictDoNothing();
    return result.rowCount ?? 0;
  }

  async countForWorker(): Promise<number> {
    return this.db.$count(rankSnapshots);
  }

  /**
   * Every pair on every client's current run — the latest succeeded or partial one —
   * across all users, with its last stored snapshot. Pairs and pages a re-crawl no
   * longer found are not current and get no new positions.
   */
  async listCurrentPairsForWorker(): Promise<ICurrentPairRecord[]> {
    const statuses = sql.join(
      CURRENT_CRAWL_RUN_STATUSES.map((status) => sql`${status}`),
      sql`, `,
    );
    const { rows } = await this.db.execute<ICurrentPairRow>(sql`
      with current_runs as (
        select distinct on (client_id) id, client_id
        from crawl_runs
        where status in (${statuses})
        order by client_id, finished_at desc, id desc
      )
      select p.id as page_id, pk.keyword_id, p.url, k.term, pk.relevance,
             last.captured_at as last_captured_at, last.position as last_position
      from current_runs cr
      join pages p on p.client_id = cr.client_id and p.last_seen_run_id = cr.id
      join page_keywords pk on pk.page_id = p.id and pk.last_seen_run_id = cr.id
      join keywords k on k.id = pk.keyword_id
      left join lateral (
        select rs.captured_at, rs.position
        from rank_snapshots rs
        where rs.page_id = pk.page_id and rs.keyword_id = pk.keyword_id
        order by rs.captured_at desc
        limit 1
      ) last on true
      order by p.id, pk.keyword_id
    `);
    return rows.map((row) => ({
      pageId: Number(row.page_id),
      keywordId: Number(row.keyword_id),
      url: row.url,
      term: row.term,
      relevance: Number(row.relevance),
      lastCapturedAt: row.last_captured_at
        ? new Date(row.last_captured_at)
        : null,
      lastPosition:
        row.last_position === null ? null : Number(row.last_position),
    }));
  }
}
