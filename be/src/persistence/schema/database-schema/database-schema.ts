import { clients } from '../tables/clients/clients.schema';
import { crawlRunItems } from '../tables/crawl-run-items/crawl-run-items.schema';
import { crawlRuns } from '../tables/crawl-runs/crawl-runs.schema';
import { pages } from '../tables/pages/pages.schema';
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
  clients,
  crawlRuns,
  crawlRunItems,
  pages,
};

export type DatabaseSchema = typeof databaseSchema;
