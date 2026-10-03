import {
  bigint,
  jsonb,
  pgEnum,
  pgTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { SEO_ISSUE_SEVERITIES, type TSeoIssue } from '@app/contracts';
import { createdAtColumn } from '../../_shared/columns/created-at-column';
import { primaryId } from '../../_shared/columns/primary-id';
import { pages } from '../pages/pages.schema';

export const seoIssueSeverityEnum = pgEnum(
  'seo_issue_severity_enum',
  SEO_ISSUE_SEVERITIES,
);

/**
 * What the latest fetch of a page found wrong. Unlike keywords, issues have no
 * history: each fetch replaces the page's set.
 */
export const seoIssues = pgTable(
  'seo_issues',
  {
    id: primaryId(),
    pageId: bigint('page_id', { mode: 'number' })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    // A key of SEO_ISSUE_CATALOGUE; a set that grows with new rules, so varchar.
    code: varchar('code', { length: 64 }).notNull(),
    severity: seoIssueSeverityEnum('severity').notNull(),
    // What exactly is wrong. For a code the catalogue gives a bound, this is the
    // measurement the crawl made — the value AND the bounds it was judged against,
    // e.g. { value: 72, min: 30, max: 60 }, so the row explains its own verdict even
    // after the catalogue's numbers move.
    details: jsonb('details_json').$type<TSeoIssue['details']>().notNull(),
    createdAt: createdAtColumn(),
  },
  (t) => [uniqueIndex('seo_issues_page_id_code_uq').on(t.pageId, t.code)],
);

export type SeoIssueDbModel = typeof seoIssues.$inferSelect;
export type SeoIssueInsertModel = typeof seoIssues.$inferInsert;
