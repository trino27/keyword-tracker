import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { CRAWL_RUN_STATUSES, CRAWL_TRIGGERS } from '@app/contracts';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { primaryId } from '../../_shared/columns/primary-id';
import { clients } from '../clients/clients.schema';

// Exported from this file: drizzle-kit only emits CREATE TYPE for enums it finds in
// the globbed schema files.
export const crawlStatusEnum = pgEnum('crawl_status_enum', CRAWL_RUN_STATUSES);
export const crawlTriggerEnum = pgEnum('crawl_trigger_enum', CRAWL_TRIGGERS);

/**
 * A crawl run is also the queue entry: the worker claims `queued` rows (and running
 * rows whose lease expired) with FOR UPDATE SKIP LOCKED.
 */
export const crawlRuns = pgTable(
  'crawl_runs',
  {
    id: primaryId(),
    clientId: bigint('client_id', { mode: 'number' })
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    status: crawlStatusEnum('status').notNull().default('queued'),
    trigger: crawlTriggerEnum('trigger').notNull(),
    // Null until discovery selects a sitemap; the run log shows it.
    sitemapUrl: varchar('sitemap_url', { length: 2048 }),
    // Why that sitemap won, in words — "name 'blog' +3, 10/10 feed items +4".
    selectionReason: varchar('selection_reason', { length: 500 }),
    // URLs in the selected sitemap group after the same-site filter.
    pagesFound: integer('pages_found').notNull().default(0),
    // Posts crawled so far — the banner's "6 of 15".
    pagesDone: integer('pages_done').notNull().default(0),
    // A CRAWL_RUN_ERRORS key; null unless the run failed.
    errorCode: varchar('error_code', { length: 64 }),
    errorMessage: varchar('error_message', { length: 500 }),
    // Claim counter AND fencing token: only the executor of attempt N may finalize,
    // so a reclaimed run that also finishes late cannot write over the newer attempt.
    attempts: smallint('attempts').notNull().default(0),
    // The lease; a running run past it is reclaimable.
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: createdAtColumn(),
  },
  (t) => [
    // At most one active run per client: a double start is a 23505, not a race.
    uniqueIndex('crawl_runs_client_id_active_uq')
      .on(t.clientId)
      .where(sql`${t.status} in ('queued', 'running')`),
    // The claim query's ORDER BY created_at over claimable rows.
    index('crawl_runs_claim_idx')
      .on(t.createdAt)
      .where(sql`${t.status} in ('queued', 'running')`),
    // A client's latest run, and its latest succeeded/partial ("current") run.
    index('crawl_runs_client_id_created_at_idx').on(t.clientId, t.createdAt),
    index('crawl_runs_client_id_finished_at_idx')
      .on(t.clientId, t.finishedAt)
      .where(sql`${t.status} in ('succeeded', 'partial')`),
    check(
      'crawl_runs_finished_at_required',
      sql`${t.status} not in ('succeeded', 'partial', 'failed') or ${t.finishedAt} is not null`,
    ),
    check(
      'crawl_runs_started_at_required',
      sql`${t.status} = 'queued' or ${t.startedAt} is not null`,
    ),
    check(
      'crawl_runs_pages_nonnegative',
      sql`${t.pagesDone} >= 0 and ${t.pagesFound} >= 0`,
    ),
    check('crawl_runs_attempts_range', sql`${t.attempts} between 0 and 3`),
  ],
);

export type CrawlRunDbModel = typeof crawlRuns.$inferSelect;
export type CrawlRunInsertModel = typeof crawlRuns.$inferInsert;
