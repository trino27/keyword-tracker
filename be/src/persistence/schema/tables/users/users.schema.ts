import { sql } from 'drizzle-orm';
import { check, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { primaryId } from '../../_shared/columns/primary-id';

export const users = pgTable(
  'users',
  {
    id: primaryId(),
    // Stored lower-cased by the auth service; the CHECK makes a mixed-case duplicate
    // unrepresentable, so "Manager@x.com" and "manager@x.com" can never both exist.
    email: varchar('email', { length: 254 }).notNull(),
    // `scrypt$N$r$p$salt$hash`: the parameters travel with the hash so they can be raised later.
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    // IANA name, validated with Intl at write. Every calendar day the user sees is in it.
    timeZone: varchar('time_zone', { length: 64 }).notNull(),
    ...auditTimestampColumns(),
  },
  (t) => [
    uniqueIndex('users_email_uq').on(t.email),
    check('users_email_lowercase', sql`${t.email} = lower(${t.email})`),
  ],
);

export type UserDbModel = typeof users.$inferSelect;
export type UserInsertModel = typeof users.$inferInsert;
