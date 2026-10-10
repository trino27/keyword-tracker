import type { TCwvMetric } from './cwv-metric.enum.js';

/**
 * Google's published thresholds, judged at the 75th percentile of real visits, both
 * inclusive: a value at `good` is good, a value at `poor` still only needs improvement.
 * LCP and INP in milliseconds, CLS unitless. Read on 2026-10-10 from web.dev (LCP, INP,
 * CLS) and "About PageSpeed Insights", which publish the same table.
 *
 * The one place these numbers live: the badge's band, the finding's code and the
 * catalogue's bound are all derived from it.
 */
export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  inp: { good: 200, poor: 500 },
  cls: { good: 0.1, poor: 0.25 },
} as const satisfies Record<TCwvMetric, { good: number; poor: number }>;
