import { clients } from '../tables/clients/clients.schema';
import { crawlRunItems } from '../tables/crawl-run-items/crawl-run-items.schema';
import { crawlRuns } from '../tables/crawl-runs/crawl-runs.schema';
import { keywords } from '../tables/keywords/keywords.schema';
import { pageKeywords } from '../tables/page-keywords/page-keywords.schema';
import { pages } from '../tables/pages/pages.schema';
import { seoIssues } from '../tables/seo-issues/seo-issues.schema';
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
  keywords,
  pageKeywords,
  seoIssues,
};

export type DatabaseSchema = typeof databaseSchema;
