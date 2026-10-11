import { sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  LCP_PHASES,
  type ILcpBreakdown,
  type TCwvSource,
  type TPageSpeedErrorCode,
  type TPageSpeedStatus,
} from '@app/contracts';

/** A page's `page_speed` row as the screens read it; null when the page has none. */
export interface IPageSpeedRow {
  status: TPageSpeedStatus;
  lastError: TPageSpeedErrorCode | null;
  lcpMs: number | null;
  lcpSource: TCwvSource | null;
  inpMs: number | null;
  inpSource: TCwvSource | null;
  cls: number | null;
  clsSource: TCwvSource | null;
  performanceScore: number | null;
  measuredAt: Date | null;
  ttfbMs: number | null;
  ttfbSource: TCwvSource | null;
  lcpGoodShare: number | null;
  lcpPoorShare: number | null;
  inpGoodShare: number | null;
  inpPoorShare: number | null;
  clsGoodShare: number | null;
  clsPoorShare: number | null;
  ttfbGoodShare: number | null;
  ttfbPoorShare: number | null;
  lcpBreakdown: ILcpBreakdown | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  /**
   * Lighthouse's share of the score: the size of its judged list and how many of those
   * failed — counted in SQL, so the list never carries the lists themselves. Both null
   * when the answer had no Lighthouse categories.
   */
  lighthouseApplicable: number | null;
  lighthouseFailed: number | null;
}

/** The raw columns a read selects through `PAGE_SPEED_COLUMNS`. */
export interface IPageSpeedColumns {
  ps_status: TPageSpeedStatus | null;
  ps_last_error: string | null;
  ps_lcp_ms: number | null;
  ps_lcp_source: TCwvSource | null;
  ps_inp_ms: number | null;
  ps_inp_source: TCwvSource | null;
  ps_cls: number | null;
  ps_cls_source: TCwvSource | null;
  ps_performance_score: number | null;
  ps_measured_at: string | Date | null;
  ps_ttfb_ms: number | null;
  ps_ttfb_source: TCwvSource | null;
  ps_lcp_good_share: number | null;
  ps_lcp_poor_share: number | null;
  ps_inp_good_share: number | null;
  ps_inp_poor_share: number | null;
  ps_cls_good_share: number | null;
  ps_cls_poor_share: number | null;
  ps_ttfb_good_share: number | null;
  ps_ttfb_poor_share: number | null;
  ps_lcp_breakdown_json: unknown;
  ps_seo_score: number | null;
  ps_accessibility_score: number | null;
  ps_lighthouse_applicable: number | null;
  ps_lighthouse_failed: number | null;
}

/**
 * The columns of `page_speed ps`, prefixed — for a read that LEFT JOINs it by page id,
 * one primary-key probe per page, in the statement it already runs.
 */
export const PAGE_SPEED_COLUMNS = sql`
  ps.status as ps_status, ps.last_error as ps_last_error,
  ps.lcp_ms as ps_lcp_ms, ps.lcp_source as ps_lcp_source,
  ps.inp_ms as ps_inp_ms, ps.inp_source as ps_inp_source,
  ps.cls as ps_cls, ps.cls_source as ps_cls_source,
  ps.performance_score as ps_performance_score, ps.measured_at as ps_measured_at,
  ps.ttfb_ms as ps_ttfb_ms, ps.ttfb_source as ps_ttfb_source,
  ps.lcp_good_share as ps_lcp_good_share, ps.lcp_poor_share as ps_lcp_poor_share,
  ps.inp_good_share as ps_inp_good_share, ps.inp_poor_share as ps_inp_poor_share,
  ps.cls_good_share as ps_cls_good_share, ps.cls_poor_share as ps_cls_poor_share,
  ps.ttfb_good_share as ps_ttfb_good_share, ps.ttfb_poor_share as ps_ttfb_poor_share,
  ps.lcp_breakdown_json as ps_lcp_breakdown_json,
  ps.seo_score as ps_seo_score, ps.accessibility_score as ps_accessibility_score,
  cardinality(ps.lighthouse_judged) as ps_lighthouse_applicable,
  ps.lighthouse_failed as ps_lighthouse_failed`;

/**
 * The stored breakdown, read through a schema rather than trusted: a shape the worker
 * wrote under an older Lighthouse reads as no breakdown, not as a broken screen.
 */
const lcpBreakdownSchema = z.object({
  element: z.object({ selector: z.string(), snippet: z.string() }).nullable(),
  phases: z.array(z.object({ phase: z.enum(LCP_PHASES), ms: z.number() })),
}) satisfies z.ZodType<ILcpBreakdown>;

const numberOrNull = (value: number | string | null): number | null =>
  value === null ? null : Number(value);

export function pageSpeedRowOf(row: IPageSpeedColumns): IPageSpeedRow | null {
  if (row.ps_status === null) return null;
  return {
    status: row.ps_status,
    // A catalogue code by construction: only the worker writes it, from the catalogue.
    lastError: row.ps_last_error as TPageSpeedErrorCode | null,
    lcpMs: numberOrNull(row.ps_lcp_ms),
    lcpSource: row.ps_lcp_source,
    inpMs: numberOrNull(row.ps_inp_ms),
    inpSource: row.ps_inp_source,
    cls: numberOrNull(row.ps_cls),
    clsSource: row.ps_cls_source,
    performanceScore: numberOrNull(row.ps_performance_score),
    measuredAt:
      row.ps_measured_at === null ? null : new Date(row.ps_measured_at),
    ttfbMs: numberOrNull(row.ps_ttfb_ms),
    ttfbSource: row.ps_ttfb_source,
    lcpGoodShare: numberOrNull(row.ps_lcp_good_share),
    lcpPoorShare: numberOrNull(row.ps_lcp_poor_share),
    inpGoodShare: numberOrNull(row.ps_inp_good_share),
    inpPoorShare: numberOrNull(row.ps_inp_poor_share),
    clsGoodShare: numberOrNull(row.ps_cls_good_share),
    clsPoorShare: numberOrNull(row.ps_cls_poor_share),
    ttfbGoodShare: numberOrNull(row.ps_ttfb_good_share),
    ttfbPoorShare: numberOrNull(row.ps_ttfb_poor_share),
    lcpBreakdown:
      lcpBreakdownSchema.safeParse(row.ps_lcp_breakdown_json).data ?? null,
    seoScore: numberOrNull(row.ps_seo_score),
    accessibilityScore: numberOrNull(row.ps_accessibility_score),
    lighthouseApplicable: numberOrNull(row.ps_lighthouse_applicable),
    lighthouseFailed: numberOrNull(row.ps_lighthouse_failed),
  };
}
