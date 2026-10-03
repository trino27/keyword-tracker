import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  varchar,
} from 'drizzle-orm/pg-core';
import { CRAWL_ITEM_STATUSES } from '@app/contracts';
import { crawlRuns } from '../crawl-runs/crawl-runs.schema';
import { pages } from '../pages/pages.schema';

export const crawlItemStatusEnum = pgEnum(
  'crawl_item_status_enum',
  CRAWL_ITEM_STATUSES,
);

/**
 * Every sitemap entry a run considered, in sitemap order, with what happened to it.
 * The run log in the UI is built from these rows, so "the first 15 posts in sitemap
 * order" — and why a listing page was skipped — is visible, not asserted.
 */
export const crawlRunItems = pgTable(
  'crawl_run_items',
  {
    runId: bigint('run_id', { mode: 'number' })
      .notNull()
      .references(() => crawlRuns.id, { onDelete: 'cascade' }),
    sitemapPosition: integer('sitemap_position').notNull(),
    url: varchar('url', { length: 2048 }).notNull(),
    status: crawlItemStatusEnum('status').notNull(),
    // Plain words; null only for crawled items.
    reason: varchar('reason', { length: 300 }),
    // Null: not fetched, or no response at all.
    httpStatus: smallint('http_status'),
    pageId: bigint('page_id', { mode: 'number' }).references(() => pages.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [
    primaryKey({
      name: 'crawl_run_items_pk',
      columns: [t.runId, t.sitemapPosition],
    }),
    check(
      'crawl_run_items_page_required',
      sql`${t.status} <> 'crawled' or ${t.pageId} is not null`,
    ),
    check(
      'crawl_run_items_reason_required',
      sql`${t.status} = 'crawled' or ${t.reason} is not null`,
    ),
  ],
);

export type CrawlRunItemDbModel = typeof crawlRunItems.$inferSelect;
export type CrawlRunItemInsertModel = typeof crawlRunItems.$inferInsert;
