import {
  fieldBandOf,
  type ICwvReading,
  type IPageSpeedSummary,
  type IVisitShare,
  type TCwvSource,
  type TFieldMetric,
} from '@app/contracts';
import type { IPageSpeedRow } from '../../repositories/page-speed/page-speed-read';

const shareOf = (
  good: number | null,
  poor: number | null,
): IVisitShare | null =>
  good === null || poor === null ? null : { good, poor };

const reading = (
  metric: TFieldMetric,
  value: number | null,
  source: TCwvSource | null,
  share: IVisitShare | null = null,
): ICwvReading | null =>
  value === null || source === null
    ? null
    : { value, band: fieldBandOf(metric, value), source, share };

/**
 * A page's PageSpeed row as the screens read it. Bands come from the thresholds at read
 * time — the same function the worker used to choose the finding, so a badge and its
 * issue agree. `lastError` is shown only once the page has been given up on: a row that
 * is merely waiting for its next try is "measuring", not "couldn't measure".
 */
export function pageSpeedSummaryOf(
  row: IPageSpeedRow | null,
): IPageSpeedSummary | null {
  if (!row) return null;
  const lcp = reading(
    'lcp',
    row.lcpMs,
    row.lcpSource,
    shareOf(row.lcpGoodShare, row.lcpPoorShare),
  );
  const cls = reading(
    'cls',
    row.cls,
    row.clsSource,
    shareOf(row.clsGoodShare, row.clsPoorShare),
  );
  const measured =
    row.measuredAt !== null &&
    lcp !== null &&
    cls !== null &&
    row.performanceScore !== null;
  return {
    status: row.status,
    measurement: measured
      ? {
          measuredAt: row.measuredAt!.toISOString(),
          lcp,
          inp: reading(
            'inp',
            row.inpMs,
            row.inpSource,
            shareOf(row.inpGoodShare, row.inpPoorShare),
          ),
          cls,
          performanceScore: row.performanceScore!,
          ttfb: reading(
            'ttfb',
            row.ttfbMs,
            row.ttfbSource,
            shareOf(row.ttfbGoodShare, row.ttfbPoorShare),
          ),
          lcpBreakdown: row.lcpBreakdown,
          seoScore: row.seoScore,
          accessibilityScore: row.accessibilityScore,
        }
      : null,
    lastError: row.status === 'failed' ? row.lastError : null,
  };
}
