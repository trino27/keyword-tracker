import type { TCwvBand } from './cwv-band.enum.js';
import type { TCwvMetric } from './cwv-metric.enum.js';
import type { TPsiStrategy } from './psi-strategy.enum.js';
import type { TPageSpeedIssueCodeOf } from '../seo/catalogue/issue-catalogues.constant.js';

/**
 * The one finding a metric outside the good band produces, per device. Two codes per
 * metric rather than one with a varying severity, because a level comes from the
 * catalogue, never from the code that finds it; and a code per device, because each
 * device's measurement replaces only its own findings.
 */
export const CWV_ISSUE_CODES = {
  mobile: {
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
  },
  desktop: {
    lcp: {
      needsImprovement: 'CWV_LCP_NEEDS_IMPROVEMENT_DESKTOP',
      poor: 'CWV_LCP_POOR_DESKTOP',
    },
    inp: {
      needsImprovement: 'CWV_INP_NEEDS_IMPROVEMENT_DESKTOP',
      poor: 'CWV_INP_POOR_DESKTOP',
    },
    cls: {
      needsImprovement: 'CWV_CLS_NEEDS_IMPROVEMENT_DESKTOP',
      poor: 'CWV_CLS_POOR_DESKTOP',
    },
  },
} as const satisfies {
  [S in TPsiStrategy]: Record<
    TCwvMetric,
    Record<Exclude<TCwvBand, 'good'>, TPageSpeedIssueCodeOf<S>>
  >;
};

/**
 * A Core Web Vitals code of either device: the leaves above. Not every pageSpeed code is
 * one — a measured diagnostic the worker writes from the same answer is not a band.
 */
export type TCwvIssueCode = {
  [S in TPsiStrategy]: {
    [M in TCwvMetric]: (typeof CWV_ISSUE_CODES)[S][M][Exclude<
      TCwvBand,
      'good'
    >];
  }[TCwvMetric];
}[TPsiStrategy];
