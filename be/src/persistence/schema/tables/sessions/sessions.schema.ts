import {
  bigint,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { byteaColumn } from '../../_shared/columns/bytea-column';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { primaryId } from '../../_shared/columns/primary-id';
import { users } from '../users/users.schema';

export const sessions = pgTable(
  'sessions',
  {
    id: primaryId(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // sha256 of the token. The token itself exists only in the cookie, so a copy of this
    // table is not a set of working sessions.
    tokenHash: byteaColumn('token_hash').notNull(),
    // Sliding: pushed forward on use, at most once per touch interval.
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAtColumn(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('sessions_token_hash_uq').on(t.tokenHash),
    index('sessions_user_id_idx').on(t.userId),
    // Serves the purge of expired sessions on every login.
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);

export type SessionDbModel = typeof sessions.$inferSelect;
export type SessionInsertModel = typeof sessions.$inferInsert;
