import { sessions } from '../tables/sessions/sessions.schema';
import { users } from '../tables/users/users.schema';

/**
 * Every table, as one object — what Drizzle's relational query API is typed by.
 *
 * A table that is not spread in here still migrates (drizzle-kit reads the
 * `*.schema.ts` glob) but is invisible to `db.query.*`.
 */
export const databaseSchema = {
  users,
  sessions,
};

export type DatabaseSchema = typeof databaseSchema;
