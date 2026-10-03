import { bigint, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { primaryId } from '../../_shared/columns/primary-id';
import { users } from '../users/users.schema';

export const clients = pgTable(
  'clients',
  {
    id: primaryId(),
    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    // The origin as entered (scheme added when missing). Crawling starts here.
    websiteUrl: varchar('website_url', { length: 2048 }).notNull(),
    // Lower-cased host, punycode, no leading "www." — what "the same website" means.
    siteKey: varchar('site_key', { length: 253 }).notNull(),
    ...auditTimestampColumns(),
  },
  (t) => [
    // One client per site per user; leading user_id also serves "list my clients".
    uniqueIndex('clients_user_id_site_key_uq').on(t.userId, t.siteKey),
  ],
);

export type ClientDbModel = typeof clients.$inferSelect;
export type ClientInsertModel = typeof clients.$inferInsert;
