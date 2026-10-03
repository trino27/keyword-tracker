import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  foreignKey,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { pageKeywords } from '../page-keywords/page-keywords.schema';

/**
 * A page's position for one keyword at one instant. The largest table by far
 * (~65 000 seeded rows), and the one both history reads scan.
 */
export const rankSnapshots = pgTable(
  'rank_snapshots',
  {
    pageId: bigint('page_id', { mode: 'number' }).notNull(),
    keywordId: bigint('keyword_id', { mode: 'number' }).notNull(),
    // When the position was observed — an instant, UTC. The seed captures at 12:00 UTC
    // daily, which keeps the UTC date and the Toronto date the same.
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
    position: smallint('position').notNull(),
    // When the row was written; differs from captured_at for every seeded row.
    createdAt: createdAtColumn(),
  },
  (t) => [
    // Serves both reads: the latest position per pair (a backward index scan) and a
    // page's history over a range.
    primaryKey({
      name: 'rank_snapshots_pk',
      columns: [t.pageId, t.keywordId, t.capturedAt],
    }),
    // A snapshot cannot exist for a pair the page does not have.
    foreignKey({
      name: 'rank_snapshots_page_keyword_fk',
      columns: [t.pageId, t.keywordId],
      foreignColumns: [pageKeywords.pageId, pageKeywords.keywordId],
    }).onDelete('cascade'),
    check(
      'rank_snapshots_position_range',
      sql`${t.position} between 1 and 100`,
    ),
  ],
);

export type RankSnapshotDbModel = typeof rankSnapshots.$inferSelect;
export type RankSnapshotInsertModel = typeof rankSnapshots.$inferInsert;
