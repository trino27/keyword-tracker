import { sql, type SQL } from 'drizzle-orm';
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

/** The raw columns a read selects through `PAGE_SPEED_COLUMNS` (the `ps` alias). */
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

/** The alias a read joins `page_speed` under: `ps` the mobile row, `psd` the desktop one. */
export type TPageSpeedAlias = 'ps' | 'psd';

/** The same columns under the desktop alias, for the detail's second join. */
export type IDesktopPageSpeedColumns = {
  [
    K in keyof IPageSpeedColumns as K extends `ps_${infer R}`
      ? `psd_${R}`
      : never
  ]: IPageSpeedColumns[K];
};

/** Each column's expression over the alias, and the name it is read back by. */
const COLUMNS: readonly [expression: string, name: string][] = [
  ['status', 'status'],
  ['last_error', 'last_error'],
  ['lcp_ms', 'lcp_ms'],
  ['lcp_source', 'lcp_source'],
  ['inp_ms', 'inp_ms'],
  ['inp_source', 'inp_source'],
  ['cls', 'cls'],
  ['cls_source', 'cls_source'],
  ['performance_score', 'performance_score'],
  ['measured_at', 'measured_at'],
  ['ttfb_ms', 'ttfb_ms'],
  ['ttfb_source', 'ttfb_source'],
  ['lcp_good_share', 'lcp_good_share'],
  ['lcp_poor_share', 'lcp_poor_share'],
  ['inp_good_share', 'inp_good_share'],
  ['inp_poor_share', 'inp_poor_share'],
  ['cls_good_share', 'cls_good_share'],
  ['cls_poor_share', 'cls_poor_share'],
  ['ttfb_good_share', 'ttfb_good_share'],
  ['ttfb_poor_share', 'ttfb_poor_share'],
  ['lcp_breakdown_json', 'lcp_breakdown_json'],
  ['seo_score', 'seo_score'],
  ['accessibility_score', 'accessibility_score'],
  ['cardinality(%.lighthouse_judged)', 'lighthouse_applicable'],
  ['lighthouse_failed', 'lighthouse_failed'],
];

/**
 * The columns of `page_speed <alias>`, prefixed with the alias — for a read that LEFT
 * JOINs it by its whole key, one primary-key probe per page, in the statement it already
 * runs. The alias is a literal union, so the raw SQL built from it cannot carry input.
 */
export function pageSpeedColumns(alias: TPageSpeedAlias): SQL {
  return sql.raw(
    COLUMNS.map(([expression, name]) => {
      const column = expression.includes('%')
        ? expression.replace('%', alias)
        : `${alias}.${expression}`;
      return `${column} as ${alias}_${name}`;
    }).join(', '),
  );
}

/** The mobile row's columns, as the list and the score read them. */
export const PAGE_SPEED_COLUMNS = pageSpeedColumns('ps');

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

/**
 * A row read back from the columns of one alias; null when the join found no row. The
 * desktop row comes back through the same reader as the mobile one, renamed, so the two
 * cannot be read differently.
 */
export function pageSpeedRowOf(
  columns: IPageSpeedColumns | IDesktopPageSpeedColumns,
  alias: TPageSpeedAlias = 'ps',
): IPageSpeedRow | null {
  const row = (
    alias === 'ps'
      ? columns
      : Object.fromEntries(
          Object.entries(columns).map(([key, value]) => [
            key.replace(/^psd_/, 'ps_'),
            value,
          ]),
        )
  ) as IPageSpeedColumns;
  if (row.ps_status === null || row.ps_status === undefined) return null;
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
