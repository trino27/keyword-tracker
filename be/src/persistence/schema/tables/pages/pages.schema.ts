import {
  bigint,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { primaryId } from '../../_shared/columns/primary-id';
import { clients } from '../clients/clients.schema';
import { crawlRuns } from '../crawl-runs/crawl-runs.schema';

export const pages = pgTable(
  'pages',
  {
    id: primaryId(),
    clientId: bigint('client_id', { mode: 'number' })
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    // The post's URL as the sitemap lists it — the identity a re-crawl upserts on.
    url: varchar('url', { length: 2048 }).notNull(),
    // Where the request ended after redirects.
    finalUrl: varchar('final_url', { length: 2048 }).notNull(),
    // Null: the page has no <title> in <head>.
    title: varchar('title', { length: 1000 }),
    metaDescription: varchar('meta_description', { length: 2000 }),
    h1: varchar('h1', { length: 1000 }),
    // BCP 47 tag from <html lang>; null when absent.
    lang: varchar('lang', { length: 35 }),
    // Words of the main content, not of the navigation around it.
    wordCount: integer('word_count').notNull(),
    httpStatus: smallint('http_status').notNull(),
    // Time to first byte, for SLOW_RESPONSE.
    responseMs: integer('response_ms').notNull(),
    htmlBytes: integer('html_bytes').notNull(),
    // 0-based position in the selected sitemap group — the list's secondary order.
    sitemapPosition: integer('sitemap_position').notNull(),
    // The run that last saw this page. Current = the client's latest succeeded/partial
    // run; a page a re-crawl no longer finds keeps its history but is hidden.
    lastSeenRunId: bigint('last_seen_run_id', { mode: 'number' })
      .notNull()
      .references(() => crawlRuns.id),
    // Last fetch; differs from created_at after a re-crawl.
    crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull(),
    ...auditTimestampColumns(),
  },
  (t) => [
    uniqueIndex('pages_client_id_url_uq').on(t.clientId, t.url),
    index('pages_client_id_last_seen_run_id_idx').on(
      t.clientId,
      t.lastSeenRunId,
    ),
    index('pages_last_seen_run_id_idx').on(t.lastSeenRunId),
  ],
);

export type PageDbModel = typeof pages.$inferSelect;
export type PageInsertModel = typeof pages.$inferInsert;
