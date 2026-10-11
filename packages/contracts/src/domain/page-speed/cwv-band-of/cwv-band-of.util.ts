import type { TCwvBand } from '../cwv-band.enum.js';
import type { TCwvMetric } from '../cwv-metric.enum.js';
import {
  CWV_THRESHOLDS,
  FIELD_METRIC_THRESHOLDS,
  type TFieldMetric,
} from '../cwv-thresholds.constant.js';

/** The band a value falls in; both thresholds are inclusive, as Google publishes them. */
export function cwvBandOf(metric: TCwvMetric, value: number): TCwvBand {
  return bandOf(CWV_THRESHOLDS[metric], value);
}

/**
 * The same, for any metric Google reports from real visits — the Core Web Vitals and TTFB.
 * TTFB's band is shown, never turned into a finding: it is not a Core Web Vital.
 */
export function fieldBandOf(metric: TFieldMetric, value: number): TCwvBand {
  return bandOf(FIELD_METRIC_THRESHOLDS[metric], value);
}

function bandOf(
  { good, poor }: { good: number; poor: number },
  value: number,
): TCwvBand {
  if (value <= good) return 'good';
  if (value <= poor) return 'needsImprovement';
  return 'poor';
}
