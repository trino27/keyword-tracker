import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  CWV_SOURCES,
  PAGE_SPEED_STATUSES,
  PSI_STRATEGIES,
  type ILcpBreakdown,
} from '@app/contracts';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { pages } from '../pages/pages.schema';

// Exported from this file: drizzle-kit only emits CREATE TYPE for enums it finds in
// the globbed schema files.
export const pageSpeedStatusEnum = pgEnum(
  'page_speed_status_enum',
  PAGE_SPEED_STATUSES,
);
export const cwvSourceEnum = pgEnum('cwv_source_enum', CWV_SOURCES);
// Postgres sorts an enum by its declaration order, PSI_STRATEGIES' order, and the claim
// takes a client's mobile rows first by it: reordering the array reorders the queue.
export const psiStrategyEnum = pgEnum('psi_strategy_enum', PSI_STRATEGIES);

/**
 * One row per page AND device: its PageSpeed queue entry AND the cache of its last
 * SUCCESSFUL measurement on that device. Nobody reads a history (like seo_issues), so there is none. A failed
 * attempt writes the job columns only, so the last good measurement survives every
 * outage.
 */
export const pageSpeed = pgTable(
  'page_speed',
  {
    // No longer the key alone: page and device together are one question.
    pageId: bigint('page_id', { mode: 'number' })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    // The device the job and the answer are for. No default: an insert that forgets it is
    // refused rather than silently queued as mobile, where the desktop row would never
    // appear. 0016 added it with a default that filled every existing row — all of them
    // were mobile answers — and 0018 dropped the default.
    strategy: psiStrategyEnum('strategy').notNull(),
    // queued → running → done | failed; a transient failure returns to queued.
    status: pageSpeedStatusEnum('status').notNull().default('queued'),
    // Claim counter AND fencing token, as on crawl_runs: only attempt N writes N's outcome.
    attempts: smallint('attempts').notNull().default(0),
    // Not before: the backoff after a transient failure, the pause after a 429.
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // The lease of the attempt in flight; a running row past it is reclaimable.
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    // A PAGE_SPEED_ERRORS key: why the last attempt did not produce a measurement.
    lastError: varchar('last_error', { length: 64 }),
    // ── The last successful measurement. All null = never measured (CHECK below).
    lcpMs: integer('lcp_ms'),
    lcpSource: cwvSourceEnum('lcp_source'),
    // Null with its source when Google has no field INP for the page or the site.
    inpMs: integer('inp_ms'),
    inpSource: cwvSourceEnum('inp_source'),
    // Unitless; only compared against band thresholds, never for equality.
    cls: real('cls'),
    clsSource: cwvSourceEnum('cls_source'),
    // Lighthouse's lab performance score, 0..100 — a caption on the Speed block.
    performanceScore: smallint('performance_score'),
    measuredAt: timestamp('measured_at', { withTimezone: true }),
    // ── Lighthouse's SEO and accessibility verdicts from the same answer, as the crawl
    // records its own on `pages`: the codes judged, the codes that did not apply, and how
    // many judged ones failed (the failures themselves are rows in seo_issues). All three
    // null = the answer had no such categories, which is no measurement error: the Core
    // Web Vitals above are stored regardless. Mobile only (lighthouse-checks D16).
    lighthouseJudged: varchar('lighthouse_judged', { length: 64 }).array(),
    lighthouseNotApplicable: varchar('lighthouse_not_applicable', {
      length: 64,
    }).array(),
    lighthouseFailed: smallint('lighthouse_failed'),
    // Lighthouse's SEO and accessibility category scores, 0..100 — lab captions.
    seoScore: smallint('seo_score'),
    accessibilityScore: smallint('accessibility_score'),
    // Real visitors' time to first byte, from the page's data or the site's; never the
    // lab, whose TTFB is the first phase of the LCP breakdown below.
    ttfbMs: integer('ttfb_ms'),
    ttfbSource: cwvSourceEnum('ttfb_source'),
    // The share of real visits in the good and the poor band, per metric, from the same
    // source as the metric's value; the needs-improvement share is what is left.
    lcpGoodShare: real('lcp_good_share'),
    lcpPoorShare: real('lcp_poor_share'),
    inpGoodShare: real('inp_good_share'),
    inpPoorShare: real('inp_poor_share'),
    clsGoodShare: real('cls_good_share'),
    clsPoorShare: real('cls_poor_share'),
    ttfbGoodShare: real('ttfb_good_share'),
    ttfbPoorShare: real('ttfb_poor_share'),
    // Where the lab LCP's time went: two phases for a text block, four for an image, and
    // an HTML snippet of Lighthouse's length — a shape DDL would fight, so jsonb, read and
    // written through one zod schema.
    lcpBreakdown: jsonb('lcp_breakdown_json').$type<ILcpBreakdown>(),
    ...auditTimestampColumns(),
  },
  (t) => [
    // A second row for one page and device would be a second answer to one question.
    primaryKey({ name: 'page_speed_pk', columns: [t.pageId, t.strategy] }),
    // The claim's ORDER BY next_attempt_at over claimable rows.
    index('page_speed_claim_idx')
      .on(t.nextAttemptAt)
      .where(sql`${t.status} in ('queued', 'running')`),
    // 5 = PAGE_SPEED_MAX_ATTEMPTS; the int-spec refuses 6, which is what ties them.
    check('page_speed_attempts_range', sql`${t.attempts} between 0 and 5`),
    check(
      'page_speed_running_is_leased',
      sql`${t.status} <> 'running' or ${t.lockedUntil} is not null`,
    ),
    check(
      'page_speed_failed_says_why',
      sql`${t.status} <> 'failed' or ${t.lastError} is not null`,
    ),
    check(
      'page_speed_done_is_measured',
      sql`${t.status} <> 'done' or ${t.measuredAt} is not null`,
    ),
    // A measurement is whole or absent: half of one would render a badge with no date.
    check(
      'page_speed_measurement_whole',
      sql`(${t.measuredAt} is null) = (${t.lcpMs} is null)
        and (${t.measuredAt} is null) = (${t.lcpSource} is null)
        and (${t.measuredAt} is null) = (${t.cls} is null)
        and (${t.measuredAt} is null) = (${t.clsSource} is null)
        and (${t.measuredAt} is null) = (${t.performanceScore} is null)`,
    ),
    // INP may be absent inside a measurement, but never half-present or orphaned.
    check(
      'page_speed_inp_pair',
      sql`(${t.inpMs} is null) = (${t.inpSource} is null)
        and (${t.inpMs} is null or ${t.measuredAt} is not null)`,
    ),
    // Lighthouse has no INP; a lab INP would be TBT under another name.
    check(
      'page_speed_inp_field_only',
      sql`${t.inpSource} is null or ${t.inpSource} <> 'lab'`,
    ),
    check(
      'page_speed_values_range',
      sql`(${t.lcpMs} is null or ${t.lcpMs} >= 0)
        and (${t.inpMs} is null or ${t.inpMs} >= 0)
        and (${t.cls} is null or ${t.cls} >= 0)
        and (${t.performanceScore} is null or ${t.performanceScore} between 0 and 100)`,
    ),
    // Nothing below survives without the measurement it came with.
    check(
      'page_speed_extras_need_measurement',
      sql`${t.measuredAt} is not null or (
        ${t.lighthouseJudged} is null and ${t.seoScore} is null
        and ${t.accessibilityScore} is null and ${t.ttfbMs} is null
        and ${t.ttfbGoodShare} is null and ${t.lcpGoodShare} is null
        and ${t.inpGoodShare} is null and ${t.clsGoodShare} is null
        and ${t.lcpBreakdown} is null)`,
    ),
    // The Lighthouse record is the three together or none: a judged list without its
    // not-applicable one would turn a skipped audit into a passed one.
    check(
      'page_speed_lighthouse_sets_together',
      sql`(${t.lighthouseJudged} is null) = (${t.lighthouseNotApplicable} is null)
        and (${t.lighthouseJudged} is null) = (${t.lighthouseFailed} is null)`,
    ),
    check(
      'page_speed_lighthouse_sets_disjoint',
      sql`${t.lighthouseJudged} is null
          or not (${t.lighthouseJudged} && ${t.lighthouseNotApplicable})`,
    ),
    // The score's Lighthouse share is failed of cardinality(judged); a duplicate would
    // inflate the denominator, as on pages (array_is_clean, migration 0009).
    check(
      'page_speed_lighthouse_judged_clean',
      sql`array_is_clean(${t.lighthouseJudged})`,
    ),
    check(
      'page_speed_lighthouse_not_applicable_clean',
      sql`array_is_clean(${t.lighthouseNotApplicable})`,
    ),
    check(
      'page_speed_lighthouse_failed_range',
      sql`${t.lighthouseFailed} is null or ${t.lighthouseFailed}
          between 0 and cardinality(${t.lighthouseJudged})`,
    ),
    check(
      'page_speed_category_scores_range',
      sql`(${t.seoScore} is null or ${t.seoScore} between 0 and 100)
        and (${t.accessibilityScore} is null or ${t.accessibilityScore} between 0 and 100)`,
    ),
    check(
      'page_speed_ttfb_pair',
      sql`(${t.ttfbMs} is null) = (${t.ttfbSource} is null)
        and (${t.ttfbMs} is null or ${t.ttfbMs} >= 0)`,
    ),
    check(
      'page_speed_ttfb_field_only',
      sql`${t.ttfbSource} is null or ${t.ttfbSource} <> 'lab'`,
    ),
    // Each pair set together, each share a fraction, and good + poor at most every visit
    // — up to real's precision, so Google's own 0.8011 + 0.1989 is not refused.
    check(
      'page_speed_shares_range',
      sql`(${t.lcpGoodShare} is null) = (${t.lcpPoorShare} is null)
        and (${t.inpGoodShare} is null) = (${t.inpPoorShare} is null)
        and (${t.clsGoodShare} is null) = (${t.clsPoorShare} is null)
        and (${t.ttfbGoodShare} is null) = (${t.ttfbPoorShare} is null)
        and coalesce(${t.lcpGoodShare} >= 0 and ${t.lcpPoorShare} >= 0
          and ${t.lcpGoodShare} + ${t.lcpPoorShare} <= 1.0001, true)
        and coalesce(${t.inpGoodShare} >= 0 and ${t.inpPoorShare} >= 0
          and ${t.inpGoodShare} + ${t.inpPoorShare} <= 1.0001, true)
        and coalesce(${t.clsGoodShare} >= 0 and ${t.clsPoorShare} >= 0
          and ${t.clsGoodShare} + ${t.clsPoorShare} <= 1.0001, true)
        and coalesce(${t.ttfbGoodShare} >= 0 and ${t.ttfbPoorShare} >= 0
          and ${t.ttfbGoodShare} + ${t.ttfbPoorShare} <= 1.0001, true)`,
    ),
    // A share is a property of real visits: none for a lab value or an absent metric. The
    // coalesce matters: `null in (…)` is null, and a CHECK lets null through.
    check(
      'page_speed_shares_field_only',
      sql`(${t.lcpGoodShare} is null or coalesce(${t.lcpSource} in ('url', 'origin'), false))
        and (${t.inpGoodShare} is null or coalesce(${t.inpSource} in ('url', 'origin'), false))
        and (${t.clsGoodShare} is null or coalesce(${t.clsSource} in ('url', 'origin'), false))
        and (${t.ttfbGoodShare} is null or coalesce(${t.ttfbSource} in ('url', 'origin'), false))`,
    ),
    // Lighthouse's SEO and accessibility verdicts come from mobile alone (lighthouse-checks
    // D16): the desktop request asks for performance only, so a desktop row with a verdict
    // or a category score is a writer's bug, refused here.
    check(
      'page_speed_lighthouse_mobile_only',
      sql`${t.strategy} = 'mobile' or (
        ${t.lighthouseJudged} is null and ${t.lighthouseNotApplicable} is null
        and ${t.lighthouseFailed} is null
        and ${t.seoScore} is null and ${t.accessibilityScore} is null)`,
    ),
  ],
);

export type PageSpeedDbModel = typeof pageSpeed.$inferSelect;
