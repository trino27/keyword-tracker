import { readPageSpeedFixture } from '../../_testing/read-page-speed-fixture';
import { extractDiagnostics, extractMeasurement } from './extract-measurement';

describe('extractMeasurement', () => {
  it('takes URL field data when Google has it', () => {
    expect(extractMeasurement(readPageSpeedFixture('url-field.json'))).toEqual({
      lcp: { value: 3025, source: 'url' },
      inp: { value: 212, source: 'url' },
      // CrUX reports CLS × 100 (the answer says 1); the distributions' bounds (10, 25) say so.
      cls: { value: 0.01, source: 'url' },
      performanceScore: 46,
    });
  });

  /** PSI marks page data that is really the site's with origin_fallback. */
  it('reads an origin fallback as the whole site, not as the page', () => {
    expect(
      extractMeasurement(readPageSpeedFixture('origin-only.json')),
    ).toEqual({
      lcp: { value: 3824, source: 'origin' },
      inp: { value: 231, source: 'origin' },
      cls: { value: 0, source: 'origin' },
      performanceScore: 59,
    });
  });

  it('falls back to the origin per metric', () => {
    const body = readPageSpeedFixture('url-field.json') as {
      loadingExperience: { metrics: Record<string, unknown> };
    };
    delete body.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT;

    expect(extractMeasurement(body)?.inp).toEqual({
      value: 231,
      source: 'origin',
    });
    expect(extractMeasurement(body)?.lcp.source).toBe('url');
  });

  it('reads a malformed field metric as absent, and still measures', () => {
    const body = readPageSpeedFixture('url-field.json') as {
      loadingExperience: { metrics: Record<string, unknown> };
    };
    body.loadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE = {
      percentile: 'slow',
    };
    body.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT = {};

    expect(extractMeasurement(body)).toMatchObject({
      lcp: { value: 3025, source: 'url' },
      inp: { value: 231, source: 'origin' },
    });
    expect(extractDiagnostics(body)?.ttfb?.source).not.toBe('url');
  });

  it('falls back to the lab for LCP and CLS, never for INP', () => {
    expect(extractMeasurement(readPageSpeedFixture('lab-only.json'))).toEqual({
      lcp: { value: 809, source: 'lab' },
      inp: null,
      cls: { value: 0, source: 'lab' },
      performanceScore: 100,
    });
  });

  it('returns null without LCP or CLS from any source', () => {
    const body = readPageSpeedFixture('lab-only.json') as {
      lighthouseResult: { audits: Record<string, unknown> };
    };
    delete body.lighthouseResult.audits['cumulative-layout-shift'];

    expect(extractMeasurement(body)).toBeNull();
  });

  it('returns null for a body that is not a PageSpeed result', () => {
    expect(extractMeasurement({ unexpected: true })).toBeNull();
    expect(extractMeasurement('not json at all')).toBeNull();
  });

  /** Should Google ever report CLS unscaled, the distributions would say 0.1 and 0.25. */
  it('reads CLS as is when its distribution bounds are unscaled', () => {
    const body = readPageSpeedFixture('url-field.json') as {
      loadingExperience: {
        metrics: {
          CUMULATIVE_LAYOUT_SHIFT_SCORE: {
            percentile: number;
            distributions: { min: number; max?: number }[];
          };
        };
      };
    };
    body.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE = {
      percentile: 0.05,
      distributions: [
        { min: 0, max: 0.1 },
        { min: 0.1, max: 0.25 },
        { min: 0.25 },
      ],
    };

    expect(extractMeasurement(body)?.cls).toEqual({
      value: 0.05,
      source: 'url',
    });
  });
});

describe('extractDiagnostics', () => {
  it("takes the page's field TTFB and each metric's good and poor shares from the page's data", () => {
    const diagnostics = extractDiagnostics(
      readPageSpeedFixture('lighthouse-url-field.json'),
    );

    expect(diagnostics?.ttfb).toEqual({ value: 652, source: 'url' });
    expect(diagnostics?.shares).toEqual({
      lcp: { good: 0.6487, poor: 0.1522 },
      inp: { good: 0.719, poor: 0.0553 },
      cls: { good: 0.8962, poor: 0.019 },
      ttfb: { good: 0.8011, poor: 0.0606 },
    });
  });

  /** A share is read where the value was read, so the two describe the same visits. */
  it("takes a metric's shares from the site when its value comes from the site", () => {
    const body = readPageSpeedFixture('lighthouse-url-field.json') as {
      loadingExperience: { metrics: Record<string, unknown> };
    };
    delete body.loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS;
    delete body.loadingExperience.metrics.EXPERIMENTAL_TIME_TO_FIRST_BYTE;

    const diagnostics = extractDiagnostics(body);

    expect(extractMeasurement(body)?.lcp.source).toBe('origin');
    expect(diagnostics?.shares.lcp).toEqual({ good: 0.5202, poor: 0.2315 });
    expect(diagnostics?.ttfb).toEqual({ value: 1485, source: 'origin' });
    expect(diagnostics?.shares.ttfb).toEqual({ good: 0.5884, poor: 0.1909 });
    expect(diagnostics?.shares.cls).toEqual({ good: 0.8962, poor: 0.019 });
  });

  it('has no TTFB and no shares without field data — never from the lab', () => {
    const diagnostics = extractDiagnostics(
      readPageSpeedFixture('lighthouse-lab-only.json'),
    );

    expect(diagnostics?.ttfb).toBeNull();
    expect(diagnostics?.shares).toEqual({
      lcp: null,
      inp: null,
      cls: null,
      ttfb: null,
    });
  });

  it('has no shares for a distribution that is not three bands', () => {
    const body = readPageSpeedFixture('lighthouse-url-field.json') as {
      loadingExperience: {
        metrics: Record<string, { distributions: unknown[] }>;
      };
    };
    body.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT.distributions.pop();

    expect(extractDiagnostics(body)?.shares.inp).toBeNull();
  });

  it('breaks an image LCP into four phases and names its element', () => {
    expect(
      extractDiagnostics(readPageSpeedFixture('lighthouse-url-field.json'))
        ?.lcpBreakdown,
    ).toEqual({
      element: {
        selector:
          'div.video-player > div.video-seo-embed-loader > picture.post__hero > img',
        snippet: expect.stringMatching(/^<img alt="" sizes=/) as string,
      },
      phases: [
        { phase: 'timeToFirstByte', ms: 6 },
        { phase: 'resourceLoadDelay', ms: 736 },
        { phase: 'resourceLoadDuration', ms: 43 },
        { phase: 'elementRenderDelay', ms: 1529 },
      ],
    });
  });

  it('breaks a text LCP into its two phases only', () => {
    expect(
      extractDiagnostics(readPageSpeedFixture('lighthouse-lab-only.json'))
        ?.lcpBreakdown,
    ).toEqual({
      element: { selector: 'body > div.container > p', snippet: '<p>' },
      phases: [
        { phase: 'timeToFirstByte', ms: 2 },
        { phase: 'elementRenderDelay', ms: 185 },
      ],
    });
  });

  /** The answers recorded before the app asked for more than performance. */
  it('has no breakdown when the answer has none, and still reads the field data', () => {
    const diagnostics = extractDiagnostics(
      readPageSpeedFixture('url-field.json'),
    );

    expect(diagnostics?.lcpBreakdown).toBeNull();
    expect(diagnostics?.ttfb?.source).toBe('url');
  });

  it('returns null for a body that is not a PageSpeed result', () => {
    expect(extractDiagnostics('not json at all')).toBeNull();
  });
});
