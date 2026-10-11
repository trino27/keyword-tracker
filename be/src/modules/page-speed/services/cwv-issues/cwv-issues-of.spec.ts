import type { IExtractedMeasurement } from '../extract-measurement/extract-measurement';
import { cwvIssuesOf } from './cwv-issues-of';

const measurement = (
  overrides: Partial<IExtractedMeasurement> = {},
): IExtractedMeasurement => ({
  lcp: { value: 1200, source: 'url' },
  inp: { value: 100, source: 'url' },
  cls: { value: 0.01, source: 'url' },
  performanceScore: 95,
  ...overrides,
});

describe('cwvIssuesOf', () => {
  it('yields nothing for three good metrics', () => {
    expect(cwvIssuesOf('mobile', measurement())).toEqual([]);
  });

  it.each([
    ['lcp', 2500, null],
    ['lcp', 2501, 'CWV_LCP_NEEDS_IMPROVEMENT'],
    ['lcp', 4000, 'CWV_LCP_NEEDS_IMPROVEMENT'],
    ['lcp', 4001, 'CWV_LCP_POOR'],
    ['inp', 200, null],
    ['inp', 201, 'CWV_INP_NEEDS_IMPROVEMENT'],
    ['inp', 500, 'CWV_INP_NEEDS_IMPROVEMENT'],
    ['inp', 501, 'CWV_INP_POOR'],
    ['cls', 0.1, null],
    ['cls', 0.1001, 'CWV_CLS_NEEDS_IMPROVEMENT'],
    ['cls', 0.25, 'CWV_CLS_NEEDS_IMPROVEMENT'],
    ['cls', 0.2501, 'CWV_CLS_POOR'],
  ] as const)(
    'a metric outside the good band yields exactly its one code (%s %d → %s)',
    (metric, value, code) => {
      const issues = cwvIssuesOf(
        'mobile',
        measurement({ [metric]: { value, source: 'url' } }),
      );

      expect(issues.map((issue) => issue.code)).toEqual(code ? [code] : []);
    },
  );

  it('never yields two codes for one metric', () => {
    const issues = cwvIssuesOf(
      'mobile',
      measurement({
        lcp: { value: 9000, source: 'lab' },
        inp: { value: 900, source: 'origin' },
        cls: { value: 0.9, source: 'lab' },
      }),
    );

    expect(issues.map((issue) => issue.code)).toEqual([
      'CWV_LCP_POOR',
      'CWV_INP_POOR',
      'CWV_CLS_POOR',
    ]);
  });

  it('takes severity from the catalogue: poor is a warning, needs improvement a notice', () => {
    const [poor] = cwvIssuesOf(
      'mobile',
      measurement({ lcp: { value: 5000, source: 'url' } }),
    );
    const [middling] = cwvIssuesOf(
      'mobile',
      measurement({ lcp: { value: 3000, source: 'url' } }),
    );

    expect(poor.severity).toBe('warning');
    expect(middling.severity).toBe('notice');
  });

  /** Source never changes the level (D10); it travels with the finding instead. */
  it('carries the value, the bound it crossed and whose experience it is', () => {
    const [issue] = cwvIssuesOf(
      'mobile',
      measurement({ inp: { value: 320, source: 'origin' } }),
    );

    expect(issue).toEqual({
      code: 'CWV_INP_NEEDS_IMPROVEMENT',
      severity: 'notice',
      details: { value: 320, max: 200, source: 'origin' },
    });
  });

  /** Each device's replace deletes its own codes, so a desktop answer must write desktop's. */
  it('a desktop metric outside the good band yields its desktop code', () => {
    const issues = cwvIssuesOf(
      'desktop',
      measurement({
        lcp: { value: 3000, source: 'url' },
        cls: { value: 0.3, source: 'lab' },
      }),
    );

    expect(issues).toEqual([
      {
        code: 'CWV_LCP_NEEDS_IMPROVEMENT_DESKTOP',
        severity: 'notice',
        details: { value: 3000, max: 2500, source: 'url' },
      },
      {
        code: 'CWV_CLS_POOR_DESKTOP',
        severity: 'warning',
        details: { value: 0.3, max: 0.25, source: 'lab' },
      },
    ]);
  });

  it('says nothing about an INP Google has no data for', () => {
    expect(cwvIssuesOf('mobile', measurement({ inp: null }))).toEqual([]);
  });
});
