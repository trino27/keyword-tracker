import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  smallint,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { CWV_SOURCES, PAGE_SPEED_STATUSES } from '@app/contracts';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { pages } from '../pages/pages.schema';

// Exported from this file: drizzle-kit only emits CREATE TYPE for enums it finds in
// the globbed schema files.
export const pageSpeedStatusEnum = pgEnum(
  'page_speed_status_enum',
  PAGE_SPEED_STATUSES,
);
export const cwvSourceEnum = pgEnum('cwv_source_enum', CWV_SOURCES);

/**
 * One row per page: its PageSpeed queue entry AND the cache of its last SUCCESSFUL
 * measurement. Nobody reads a history (like seo_issues), so there is none. A failed
 * attempt writes the job columns only, so the last good measurement survives every
 * outage.
 */
export const pageSpeed = pgTable(
  'page_speed',
  {
    // The page IS the key: a second row per page would be a second answer to one question.
    pageId: bigint('page_id', { mode: 'number' })
      .primaryKey()
      .references(() => pages.id, { onDelete: 'cascade' }),
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
    ...auditTimestampColumns(),
  },
  (t) => [
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
  ],
);

export type PageSpeedDbModel = typeof pageSpeed.$inferSelect;
