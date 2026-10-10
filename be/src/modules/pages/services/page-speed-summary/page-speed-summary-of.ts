import {
  cwvBandOf,
  type ICwvReading,
  type IPageSpeedSummary,
  type TCwvMetric,
  type TCwvSource,
} from '@app/contracts';
import type { IPageSpeedRow } from '../../repositories/page-speed/page-speed-read';

const reading = (
  metric: TCwvMetric,
  value: number | null,
  source: TCwvSource | null,
): ICwvReading | null =>
  value === null || source === null
    ? null
    : { value, band: cwvBandOf(metric, value), source };

/**
 * A page's PageSpeed row as the screens read it. Bands come from the thresholds at read
 * time — the same `cwvBandOf` the worker used to choose the finding, so a badge and its
 * issue agree. `lastError` is shown only once the page has been given up on: a row that
 * is merely waiting for its next try is "measuring", not "couldn't measure".
 */
export function pageSpeedSummaryOf(
  row: IPageSpeedRow | null,
): IPageSpeedSummary | null {
  if (!row) return null;
  const lcp = reading('lcp', row.lcpMs, row.lcpSource);
  const cls = reading('cls', row.cls, row.clsSource);
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
          inp: reading('inp', row.inpMs, row.inpSource),
          cls,
          performanceScore: row.performanceScore!,
        }
      : null,
    lastError: row.status === 'failed' ? row.lastError : null,
  };
}
