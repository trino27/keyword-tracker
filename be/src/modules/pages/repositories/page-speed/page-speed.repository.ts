import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { TPageSpeedErrorCode } from '@app/contracts';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { pageSpeed } from '@persistence/schema/tables/page-speed/page-speed.schema';
import { CURRENT_RUN_STATUSES_SQL } from '@persistence/sql/current-run-statuses';
import type {
  IClaimedPageSpeed,
  IPageSpeedJobWrite,
  IPageSpeedMeasurementWrite,
} from '../../interfaces/page-speed.interface';
import {
  PAGE_SPEED_MAX_ATTEMPTS,
  PAGE_SPEED_QUEUED_CHANNEL,
} from '@shared/page-speed-queue/page-speed-queue.constant';

/**
 * The PageSpeed queue and its cache, one row per page. Every method is unscoped
 * (…ForWorker): the crawl, the seed and the worker serve every user. The screens read
 * the row through their own repositories.
 */
@Injectable()
export class PageSpeedRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Queues the pages a crawl has just made current, in the crawl's own transaction: a
   * page with no row, one whose last attempt failed, or one measured at least
   * `staleBefore` ago. A queued or running row is left alone, and no branch touches the
   * measurement, so a re-queued page keeps showing its old figures until new ones land.
   * Returns how many rows were inserted or re-queued.
   */
  async enqueueForWorker(
    tx: Transaction,
    pageIds: number[],
    staleBefore: Date,
  ): Promise<number> {
    if (pageIds.length === 0) return 0;
    const result = await tx.execute(sql`
      insert into page_speed (page_id)
      select unnest(${`{${pageIds.join(',')}}`}::bigint[])
      on conflict (page_id) do update
        set status = 'queued', attempts = 0, next_attempt_at = now(),
            locked_until = null, last_error = null, updated_at = now()
        where page_speed.status = 'failed'
           or (page_speed.status = 'done'
               and page_speed.measured_at <= ${staleBefore.toISOString()}::timestamptz)`);
    return result.rowCount ?? 0;
  }

  /**
   * Queues every page on its client's current run that has never had a row — the seed's
   * repair for a database crawled before PageSpeed existed. Idempotent: a second run
   * inserts nothing.
   */
  async backfillCurrentForWorker(): Promise<number> {
    const result = await this.db.execute(sql`
      insert into page_speed (page_id)
      select p.id from pages p
      where p.last_seen_run_id = (
        select r.id from crawl_runs r
        where r.client_id = p.client_id and r.status in (${CURRENT_RUN_STATUSES_SQL})
        order by r.finished_at desc, r.id desc
        limit 1)
      on conflict (page_id) do nothing`);
    return result.rowCount ?? 0;
  }

  /** Wakes the worker; delivered when the enqueuing transaction commits. */
  async notifyQueued(tx: Transaction | Database = this.db): Promise<void> {
    await tx.execute(sql`select pg_notify(${PAGE_SPEED_QUEUED_CHANNEL}, '')`);
  }

  /**
   * Claims the next due row in ONE statement: a queued row whose not-before time has
   * come, or a running row whose lease expired. Only pages still on their client's
   * current run are claimed — a URL the latest crawl dropped costs no quota; a later
   * crawl that finds it again re-queues it. FOR UPDATE SKIP LOCKED: two slots never
   * take the same row.
   *
   * Fair, not first-in-first-out: the user served longest ago goes first, then, within
   * that user, the client served longest ago, then the oldest row. "Served" is the
   * latest claim of any of their rows (a claim stamps `updated_at`; a queued row is not
   * served), so one user's backlog of hundreds of pages takes turns with a client added
   * a minute ago instead of standing in front of it.
   */
  async claimNextForWorker(leaseMs: number): Promise<IClaimedPageSpeed | null> {
    const result = await this.db.execute<{
      page_id: string | number;
      attempts: number;
      final_url: string;
    }>(sql`
      with due as (
        select q.page_id, q.next_attempt_at, qp.client_id, qc.user_id
        from page_speed q
        join pages qp on qp.id = q.page_id
        join clients qc on qc.id = qp.client_id
        where ((q.status = 'queued' and q.next_attempt_at <= now())
               or (q.status = 'running' and q.locked_until < now()))
          and q.attempts < ${PAGE_SPEED_MAX_ATTEMPTS}
          and qp.last_seen_run_id = (
            select r.id from crawl_runs r
            where r.client_id = qp.client_id and r.status in (${CURRENT_RUN_STATUSES_SQL})
            order by r.finished_at desc, r.id desc
            limit 1)
      ),
      served as (
        select sp.client_id, sc.user_id, max(s.updated_at) as served_at
        from page_speed s
        join pages sp on sp.id = s.page_id
        join clients sc on sc.id = sp.client_id
        where s.status <> 'queued'
          and sc.user_id in (select d.user_id from due d)
        group by sp.client_id, sc.user_id
      ),
      next as (
        select q.page_id from page_speed q
        join due d on d.page_id = q.page_id
        left join served cs on cs.client_id = d.client_id
        left join (
          select user_id, max(served_at) as served_at from served group by user_id
        ) us on us.user_id = d.user_id
        order by us.served_at nulls first, cs.served_at nulls first,
                 d.next_attempt_at, d.page_id
        for update of q skip locked
        limit 1
      )
      update page_speed ps
      set status = 'running',
          attempts = ps.attempts + 1,
          locked_until = now() + make_interval(secs => ${leaseMs / 1000}),
          updated_at = clock_timestamp()
      from pages p, next
      where p.id = ps.page_id
        and ps.page_id = next.page_id
      returning ps.page_id, ps.attempts, p.final_url`);
    const row = result.rows[0];
    return row
      ? {
          pageId: Number(row.page_id),
          attempt: Number(row.attempts),
          url: row.final_url,
        }
      : null;
  }

  /** Rows whose lease expired on their last allowed attempt are given up on. */
  async failAbandonedForWorker(): Promise<number> {
    const rows = await this.db
      .update(pageSpeed)
      .set({
        status: 'failed',
        lastError: 'ABANDONED' satisfies TPageSpeedErrorCode,
        lockedUntil: null,
      })
      .where(
        and(
          eq(pageSpeed.status, 'running'),
          sql`${pageSpeed.lockedUntil} < now()`,
          sql`${pageSpeed.attempts} >= ${PAGE_SPEED_MAX_ATTEMPTS}`,
        ),
      )
      .returning({ pageId: pageSpeed.pageId });
    return rows.length;
  }

  /**
   * Writes a measurement and marks the row done — in the caller's transaction, beside the
   * page's speed findings. False when another attempt now owns the row: a stale attempt
   * writes nothing.
   */
  async completeForWorker(
    tx: Transaction,
    pageId: number,
    attempt: number,
    measurement: IPageSpeedMeasurementWrite,
  ): Promise<boolean> {
    const rows = await tx
      .update(pageSpeed)
      .set({
        ...measurement,
        status: 'done',
        lastError: null,
        lockedUntil: null,
      })
      .where(this.ownedBy(pageId, attempt))
      .returning({ pageId: pageSpeed.pageId });
    return rows.length > 0;
  }

  /** A failed attempt: try again later, or give up. Never touches the measurement. */
  async recordFailureForWorker(
    pageId: number,
    attempt: number,
    write: IPageSpeedJobWrite,
  ): Promise<boolean> {
    const rows = await this.db
      .update(pageSpeed)
      .set({
        status: write.status,
        lastError: write.lastError,
        lockedUntil: null,
        ...(write.nextAttemptAt ? { nextAttemptAt: write.nextAttemptAt } : {}),
      })
      .where(this.ownedBy(pageId, attempt))
      .returning({ pageId: pageSpeed.pageId });
    return rows.length > 0;
  }

  /**
   * Gives the row back without spending its attempt — for a 429 or a rejected key, which
   * are not the page's failure (plan D25). Under the fence: only the attempt that holds
   * the row can give it back, so a newer claim is never undone.
   */
  async releaseForWorker(
    pageId: number,
    attempt: number,
    notBefore: Date,
  ): Promise<boolean> {
    const rows = await this.db
      .update(pageSpeed)
      .set({
        status: 'queued',
        attempts: sql`${pageSpeed.attempts} - 1`,
        nextAttemptAt: notBefore,
        lockedUntil: null,
      })
      .where(this.ownedBy(pageId, attempt))
      .returning({ pageId: pageSpeed.pageId });
    return rows.length > 0;
  }

  private ownedBy(pageId: number, attempt: number) {
    return and(
      eq(pageSpeed.pageId, pageId),
      eq(pageSpeed.status, 'running'),
      eq(pageSpeed.attempts, attempt),
    );
  }
}
