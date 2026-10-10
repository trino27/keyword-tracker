import {
  CWV_ISSUE_CODES,
  CWV_METRICS,
  SEO_ISSUE_CATALOGUE,
  cwvBandOf,
  type TPageSpeedSeoIssue,
} from '@app/contracts';
import type { IExtractedMeasurement } from '../extract-measurement/extract-measurement';

/**
 * The speed findings a measurement produces: for each metric outside the good band,
 * exactly the one code of its band, with the level the catalogue gives that code and the
 * bound copied from it. A good metric — or an INP Google has no data for — yields none.
 *
 * The badge on the screen calls the same `cwvBandOf`, so a coloured badge and its finding
 * cannot disagree (plan I16).
 */
export function cwvIssuesOf(
  measurement: IExtractedMeasurement,
): TPageSpeedSeoIssue[] {
  const issues: TPageSpeedSeoIssue[] = [];
  for (const metric of CWV_METRICS) {
    const reading = measurement[metric];
    if (!reading) continue;
    const band = cwvBandOf(metric, reading.value);
    if (band === 'good') continue;
    const code = CWV_ISSUE_CODES[metric][band];
    const entry = SEO_ISSUE_CATALOGUE[code];
    issues.push({
      code,
      severity: entry.severity,
      details: { value: reading.value, max: entry.max, source: reading.source },
    });
  }
  return issues;
}
