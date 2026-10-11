import type { IPageSpeedRow } from '../../repositories/page-speed/page-speed-read';
import { pageSpeedSummaryOf } from './page-speed-summary-of';

const MEASURED: IPageSpeedRow = {
  status: 'done',
  lastError: null,
  lcpMs: 3100,
  lcpSource: 'url',
  inpMs: 180,
  inpSource: 'origin',
  cls: 0.3,
  clsSource: 'lab',
  performanceScore: 61,
  measuredAt: new Date('2026-10-09T12:00:00Z'),
  ttfbMs: null,
  ttfbSource: null,
  lcpGoodShare: null,
  lcpPoorShare: null,
  inpGoodShare: null,
  inpPoorShare: null,
  clsGoodShare: null,
  clsPoorShare: null,
  ttfbGoodShare: null,
  ttfbPoorShare: null,
  lcpBreakdown: null,
  seoScore: null,
  accessibilityScore: null,
  lighthouseApplicable: null,
  lighthouseFailed: null,
};

const NEVER_MEASURED: IPageSpeedRow = {
  ...MEASURED,
  status: 'queued',
  lcpMs: null,
  lcpSource: null,
  inpMs: null,
  inpSource: null,
  cls: null,
  clsSource: null,
  performanceScore: null,
  measuredAt: null,
};

describe('pageSpeedSummaryOf', () => {
  it('a page never queued has no summary', () => {
    expect(pageSpeedSummaryOf(null)).toBeNull();
  });

  it("a summary carries each metric's band from the thresholds", () => {
    expect(pageSpeedSummaryOf(MEASURED)).toEqual({
      status: 'done',
      lastError: null,
      measurement: {
        measuredAt: '2026-10-09T12:00:00.000Z',
        lcp: {
          value: 3100,
          band: 'needsImprovement',
          source: 'url',
          share: null,
        },
        inp: { value: 180, band: 'good', source: 'origin', share: null },
        cls: { value: 0.3, band: 'poor', source: 'lab', share: null },
        performanceScore: 61,
        ttfb: null,
        lcpBreakdown: null,
        seoScore: null,
        accessibilityScore: null,
      },
    });
  });

  /** PAGES-017: the diagnostics travel with the measurement they came in. */
  it('carries the field TTFB with its own bands, each share, the breakdown and the category scores', () => {
    const breakdown = {
      element: { selector: 'main img', snippet: '<img alt="">' },
      phases: [{ phase: 'timeToFirstByte' as const, ms: 6 }],
    };
    const measurement = pageSpeedSummaryOf({
      ...MEASURED,
      ttfbMs: 620,
      ttfbSource: 'url',
      ttfbGoodShare: 0.8,
      ttfbPoorShare: 0.06,
      lcpGoodShare: 0.68,
      lcpPoorShare: 0.11,
      lcpBreakdown: breakdown,
      seoScore: 92,
      accessibilityScore: 78,
    })?.measurement;

    expect(measurement?.ttfb).toEqual({
      value: 620,
      band: 'good',
      source: 'url',
      share: { good: 0.8, poor: 0.06 },
    });
    expect(measurement?.lcp.share).toEqual({ good: 0.68, poor: 0.11 });
    expect(measurement?.lcpBreakdown).toEqual(breakdown);
    expect(measurement).toMatchObject({ seoScore: 92, accessibilityScore: 78 });
  });

  it("bands a TTFB of 1.9 s poor, by its own thresholds and not LCP's", () => {
    expect(
      pageSpeedSummaryOf({ ...MEASURED, ttfbMs: 1900, ttfbSource: 'origin' })
        ?.measurement?.ttfb?.band,
    ).toBe('poor');
  });

  it('a never-measured page has a null measurement', () => {
    expect(pageSpeedSummaryOf(NEVER_MEASURED)?.measurement).toBeNull();
  });

  it('INP without field data is null inside a measurement', () => {
    expect(
      pageSpeedSummaryOf({ ...MEASURED, inpMs: null, inpSource: null })
        ?.measurement?.inp,
    ).toBeNull();
  });

  /** A row waiting for its next try is still being measured, not failed. */
  it('lastError is null unless failed', () => {
    expect(
      pageSpeedSummaryOf({
        ...NEVER_MEASURED,
        status: 'queued',
        lastError: 'PSI_UNAVAILABLE',
      })?.lastError,
    ).toBeNull();
    expect(
      pageSpeedSummaryOf({
        ...MEASURED,
        status: 'failed',
        lastError: 'PAGE_LOAD_FAILED',
      }),
    ).toMatchObject({
      lastError: 'PAGE_LOAD_FAILED',
      measurement: { lcp: { value: 3100 } },
    });
  });
});
