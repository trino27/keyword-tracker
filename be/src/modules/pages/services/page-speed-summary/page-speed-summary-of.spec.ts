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
        lcp: { value: 3100, band: 'needsImprovement', source: 'url' },
        inp: { value: 180, band: 'good', source: 'origin' },
        cls: { value: 0.3, band: 'poor', source: 'lab' },
        performanceScore: 61,
      },
    });
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
