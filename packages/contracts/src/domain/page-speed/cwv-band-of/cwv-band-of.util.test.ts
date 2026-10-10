import { describe, expect, it } from 'vitest';
import { cwvBandOf } from './cwv-band-of.util';

describe('cwvBandOf', () => {
  /** Google publishes both thresholds as inclusive: 2.5 s is still good, 4 s still needs work. */
  it.each([
    ['lcp', 0, 'good'],
    ['lcp', 2500, 'good'],
    ['lcp', 2501, 'needsImprovement'],
    ['lcp', 4000, 'needsImprovement'],
    ['lcp', 4001, 'poor'],
    ['inp', 200, 'good'],
    ['inp', 201, 'needsImprovement'],
    ['inp', 500, 'needsImprovement'],
    ['inp', 501, 'poor'],
    ['cls', 0.1, 'good'],
    ['cls', 0.1001, 'needsImprovement'],
    ['cls', 0.25, 'needsImprovement'],
    ['cls', 0.2501, 'poor'],
  ] as const)('%s %d is %s', (metric, value, band) => {
    expect(cwvBandOf(metric, value)).toBe(band);
  });
});
