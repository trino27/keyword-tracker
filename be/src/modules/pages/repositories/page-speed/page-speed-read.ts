import { sql } from 'drizzle-orm';
import type {
  TCwvSource,
  TPageSpeedErrorCode,
  TPageSpeedStatus,
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
  ps.performance_score as ps_performance_score, ps.measured_at as ps_measured_at`;

export function pageSpeedRowOf(row: IPageSpeedColumns): IPageSpeedRow | null {
  if (row.ps_status === null) return null;
  return {
    status: row.ps_status,
    // A catalogue code by construction: only the worker writes it, from the catalogue.
    lastError: row.ps_last_error as TPageSpeedErrorCode | null,
    lcpMs: row.ps_lcp_ms === null ? null : Number(row.ps_lcp_ms),
    lcpSource: row.ps_lcp_source,
    inpMs: row.ps_inp_ms === null ? null : Number(row.ps_inp_ms),
    inpSource: row.ps_inp_source,
    cls: row.ps_cls === null ? null : Number(row.ps_cls),
    clsSource: row.ps_cls_source,
    performanceScore:
      row.ps_performance_score === null
        ? null
        : Number(row.ps_performance_score),
    measuredAt:
      row.ps_measured_at === null ? null : new Date(row.ps_measured_at),
  };
}
