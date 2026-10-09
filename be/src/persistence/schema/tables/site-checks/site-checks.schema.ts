import {
  bigint,
  jsonb,
  pgEnum,
  pgTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { SITE_CHECK_STATUSES } from '@app/contracts';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { primaryId } from '../../_shared/columns/primary-id';
import { crawlRuns } from '../crawl-runs/crawl-runs.schema';
import { seoIssueSeverityEnum } from '../seo-issues/seo-issues.schema';

export const siteCheckStatusEnum = pgEnum(
  'site_check_status_enum',
  SITE_CHECK_STATUSES,
);

/**
 * What one crawl concluded about the SITE — robots.txt, the sitemap, the host, how a
 * missing page answers — one row per catalogued site check, passed and skipped included,
 * so the run log can say what was checked and not only what failed. Belongs to the run:
 * each crawl is its own snapshot, and a run is deleted only with its client.
 */
export const siteChecks = pgTable(
  'site_checks',
  {
    id: primaryId(),
    runId: bigint('run_id', { mode: 'number' })
      .notNull()
      .references(() => crawlRuns.id, { onDelete: 'cascade' }),
    // A key of SITE_CHECK_CATALOGUE; a set that grows with new checks, so varchar.
    code: varchar('code', { length: 64 }).notNull(),
    status: siteCheckStatusEnum('status').notNull(),
    severity: seoIssueSeverityEnum('severity').notNull(),
    // The evidence a failure rests on; empty for a pass or a skip.
    details: jsonb('details_json').$type<Record<string, unknown>>().notNull(),
    createdAt: createdAtColumn(),
  },
  (t) => [uniqueIndex('site_checks_run_id_code_uq').on(t.runId, t.code)],
);

export type SiteCheckDbModel = typeof siteChecks.$inferSelect;
