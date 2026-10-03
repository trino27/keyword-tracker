import { index, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { primaryId } from '../../_shared/columns/primary-id';

/**
 * A global dictionary of normalized keyword terms. Shared by every user and client —
 * "seo audit" on two sites is one row — so nothing cascades from it and nothing
 * user-specific is stored here.
 */
export const keywords = pgTable(
  'keywords',
  {
    id: primaryId(),
    // Normalized as the extractor normalizes (NFKC, lower case, single spaces).
    term: varchar('term', { length: 200 }).notNull(),
    createdAt: createdAtColumn(),
  },
  (t) => [
    uniqueIndex('keywords_term_uq').on(t.term),
    // The list's search: term ILIKE '%term%'. Needs pg_trgm (migration 0005).
    index('keywords_term_trgm_idx').using('gin', t.term.op('gin_trgm_ops')),
  ],
);

export type KeywordDbModel = typeof keywords.$inferSelect;
export type KeywordInsertModel = typeof keywords.$inferInsert;
