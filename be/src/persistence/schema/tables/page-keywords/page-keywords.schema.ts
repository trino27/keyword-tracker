import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  pgTable,
  primaryKey,
  real,
} from 'drizzle-orm/pg-core';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { crawlRuns } from '../crawl-runs/crawl-runs.schema';
import { keywords } from '../keywords/keywords.schema';
import { pages } from '../pages/pages.schema';

/**
 * The keywords a page targets. A pair is never deleted: its position history hangs
 * off it. A re-crawl that no longer selects the keyword leaves the pair at its older
 * last_seen_run_id, which hides it without losing the history.
 */
export const pageKeywords = pgTable(
  'page_keywords',
  {
    pageId: bigint('page_id', { mode: 'number' })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    // No cascade: a keyword row is shared across users.
    keywordId: bigint('keyword_id', { mode: 'number' })
      .notNull()
      .references(() => keywords.id),
    // The keyword's score relative to the page's best one: the top keyword is 1.
    relevance: real('relevance').notNull(),
    // Cascade: a run is deleted only with its client, and everything it saw goes too.
    lastSeenRunId: bigint('last_seen_run_id', { mode: 'number' })
      .notNull()
      .references(() => crawlRuns.id, { onDelete: 'cascade' }),
    ...auditTimestampColumns(),
  },
  (t) => [
    primaryKey({ name: 'page_keywords_pk', columns: [t.pageId, t.keywordId] }),
    // Search: a matching term leads to its pages.
    index('page_keywords_keyword_id_idx').on(t.keywordId),
    // Every list, detail and history query joins on this column, and deleting a client
    // cascades crawl_runs -> page_keywords through it.
    index('page_keywords_last_seen_run_id_idx').on(t.lastSeenRunId),
    check(
      'page_keywords_relevance_range',
      sql`${t.relevance} > 0 and ${t.relevance} <= 1`,
    ),
  ],
);

export type PageKeywordDbModel = typeof pageKeywords.$inferSelect;
export type PageKeywordInsertModel = typeof pageKeywords.$inferInsert;
