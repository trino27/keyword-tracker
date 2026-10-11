import type { TCwvBand } from './cwv-band.enum.js';
import type { TCwvMetric } from './cwv-metric.enum.js';
import type { TPageSpeedIssueCode } from '../seo/catalogue/issue-catalogues.constant.js';

/**
 * The one finding a metric outside the good band produces. Two codes per metric rather
 * than one with a varying severity, because a level comes from the catalogue, never from
 * the code that finds it.
 */
export const CWV_ISSUE_CODES = {
  lcp: {
    needsImprovement: 'CWV_LCP_NEEDS_IMPROVEMENT',
    poor: 'CWV_LCP_POOR',
  },
  inp: {
    needsImprovement: 'CWV_INP_NEEDS_IMPROVEMENT',
    poor: 'CWV_INP_POOR',
  },
  cls: {
    needsImprovement: 'CWV_CLS_NEEDS_IMPROVEMENT',
    poor: 'CWV_CLS_POOR',
  },
} as const satisfies Record<
  TCwvMetric,
  Record<Exclude<TCwvBand, 'good'>, TPageSpeedIssueCode>
>;
