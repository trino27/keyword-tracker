import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { primaryId } from '../../_shared/columns/primary-id';
import { clients } from '../clients/clients.schema';
import { crawlRuns } from '../crawl-runs/crawl-runs.schema';

export const pages = pgTable(
  'pages',
  {
    id: primaryId(),
    clientId: bigint('client_id', { mode: 'number' })
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    // The post's URL as the sitemap lists it — the identity a re-crawl upserts on.
    url: varchar('url', { length: 2048 }).notNull(),
    // Where the request ended after redirects.
    finalUrl: varchar('final_url', { length: 2048 }).notNull(),
    // Null: the page has no <title> in <head>.
    title: varchar('title', { length: 1000 }),
    metaDescription: varchar('meta_description', { length: 2000 }),
    h1: varchar('h1', { length: 1000 }),
    // BCP 47 tag from <html lang>; null when absent.
    lang: varchar('lang', { length: 35 }),
    // Words of the main content, not of the navigation around it.
    wordCount: integer('word_count').notNull(),
    httpStatus: smallint('http_status').notNull(),
    // Time to first byte of the crawler's single fetch. A fact of the crawl, never a
    // verdict: the same site answered in 41 ms and 1728 ms minutes apart (field study,
    // practices/search-engines/references/field-study-2026-10.md, finding 3).
    responseMs: integer('response_ms').notNull(),
    htmlBytes: integer('html_bytes').notNull(),
    // 0-based position in the selected sitemap group — the list's secondary order.
    sitemapPosition: integer('sitemap_position').notNull(),
    // The run that last saw this page. Current = the client's latest succeeded/partial
    // run; a page a re-crawl no longer finds keeps its history but is hidden.
    // Cascade: a run is deleted only with its client, and everything it saw goes too.
    lastSeenRunId: bigint('last_seen_run_id', { mode: 'number' })
      .notNull()
      .references(() => crawlRuns.id, { onDelete: 'cascade' }),
    // How many catalogue checks could be judged on this page, and how many of them failed.
    // Written by the same act that writes the page's issues, because applicability is only
    // knowable while the parsed page is in hand — this row holds no canonical, no Open Graph
    // and no JSON-LD, so it cannot be recovered later. The score is applicable-minus-failed
    // over applicable, derived at read time.
    checksApplicable: smallint('checks_applicable').notNull(),
    checksFailed: smallint('checks_failed').notNull(),
    // WHICH checks ran, and which could not be judged — disjoint, and together the
    // catalogue as of that crawl. The counts above say how many; only these say which,
    // and the difference is what lets a later read tell a check the catalogue gained
    // since from one this page passed. Written by the same upsert as the counts, for
    // the same reason they are written here: nothing in this row can answer it later.
    //
    // Null means the last crawl predates this record, not that nothing was skipped.
    // Phase 2 drops the nulls once every client has been re-crawled.
    checksJudged: varchar('checks_judged', { length: 64 }).array(),
    checksNotApplicable: varchar('checks_not_applicable', {
      length: 64,
    }).array(),
    // Last fetch; differs from created_at after a re-crawl.
    crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull(),
    ...auditTimestampColumns(),
  },
  (t) => [
    uniqueIndex('pages_client_id_url_uq').on(t.clientId, t.url),
    // The list's search: url ILIKE '%term%'. Needs pg_trgm (migration 0005).
    index('pages_url_trgm_idx').using('gin', t.url.op('gin_trgm_ops')),
    index('pages_client_id_last_seen_run_id_idx').on(
      t.clientId,
      t.lastSeenRunId,
    ),
    index('pages_last_seen_run_id_idx').on(t.lastSeenRunId),
    // The score divides by checks_applicable, so a zero denominator is impossible here
    // rather than guarded for at every read.
    check('pages_checks_applicable_positive', sql`${t.checksApplicable} > 0`),
    // And a score can therefore never exceed 100 or fall below 0.
    check(
      'pages_checks_failed_range',
      sql`${t.checksFailed} >= 0 and ${t.checksFailed} <= ${t.checksApplicable}`,
    ),
    // A row records both lists or neither; half of the pair would read as "nothing was
    // skipped" and quietly turn a skipped check into a passed one.
    check(
      'pages_checks_sets_together',
      sql`(${t.checksJudged} is null) = (${t.checksNotApplicable} is null)`,
    ),
    // The tie the counts alone could not have: the denominator IS the judged list's
    // length, enforced here rather than trusted. It names no catalogue size, so it
    // survives the catalogue growing.
    check(
      'pages_checks_judged_matches_applicable',
      sql`${t.checksJudged} is null
          or ${t.checksApplicable} = cardinality(${t.checksJudged})`,
    ),
    // A code in both lists would render with two statuses on the same screen.
    check(
      'pages_checks_sets_disjoint',
      sql`${t.checksJudged} is null
          or not (${t.checksJudged} && ${t.checksNotApplicable})`,
    ),
    // Distinctness is NOT here: PostgreSQL forbids a subquery in a CHECK, and
    // "this array has no duplicates" has no subquery-free spelling. One pass over
    // SEO_ISSUE_CODES cannot emit a code twice, and the registry spec pins that.
    check(
      'pages_checks_codes_nonempty',
      sql`(${t.checksJudged} is null or not ('' = any(${t.checksJudged})))
          and (${t.checksNotApplicable} is null
               or not ('' = any(${t.checksNotApplicable})))`,
    ),
  ],
);

export type PageDbModel = typeof pages.$inferSelect;
export type PageInsertModel = typeof pages.$inferInsert;
