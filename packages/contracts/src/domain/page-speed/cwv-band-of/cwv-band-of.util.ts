import type { TCwvBand } from '../cwv-band.enum.js';
import type { TCwvMetric } from '../cwv-metric.enum.js';
import { CWV_THRESHOLDS } from '../cwv-thresholds.constant.js';

/** The band a value falls in; both thresholds are inclusive, as Google publishes them. */
export function cwvBandOf(metric: TCwvMetric, value: number): TCwvBand {
  const { good, poor } = CWV_THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needsImprovement';
  return 'poor';
}
