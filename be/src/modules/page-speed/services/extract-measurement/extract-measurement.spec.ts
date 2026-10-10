import { readPageSpeedFixture } from '../../_testing/read-page-speed-fixture';
import { extractMeasurement } from './extract-measurement';

describe('extractMeasurement', () => {
  it('takes URL field data when Google has it', () => {
    expect(
      extractMeasurement(readPageSpeedFixture('url-field.synthesized.json')),
    ).toEqual({
      lcp: { value: 3100, source: 'url' },
      inp: { value: 180, source: 'url' },
      // CrUX reports CLS × 100; the distributions' bounds (10, 25) say so.
      cls: { value: 0.02, source: 'url' },
      performanceScore: 72,
    });
  });

  /** PSI marks page data that is really the site's with origin_fallback. */
  it('reads an origin fallback as the whole site, not as the page', () => {
    expect(
      extractMeasurement(readPageSpeedFixture('origin-only.synthesized.json')),
    ).toEqual({
      lcp: { value: 2900, source: 'origin' },
      inp: { value: 210, source: 'origin' },
      cls: { value: 0.03, source: 'origin' },
      performanceScore: 48,
    });
  });

  it('falls back to the origin per metric', () => {
    const body = readPageSpeedFixture('url-field.synthesized.json') as {
      loadingExperience: { metrics: Record<string, unknown> };
    };
    delete body.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT;

    expect(extractMeasurement(body)?.inp).toEqual({
      value: 210,
      source: 'origin',
    });
    expect(extractMeasurement(body)?.lcp.source).toBe('url');
  });

  it('falls back to the lab for LCP and CLS, never for INP', () => {
    expect(
      extractMeasurement(readPageSpeedFixture('lab-only.synthesized.json')),
    ).toEqual({
      lcp: { value: 5210, source: 'lab' },
      inp: null,
      cls: { value: 0.18, source: 'lab' },
      performanceScore: 41,
    });
  });

  it('returns null without LCP or CLS from any source', () => {
    const body = readPageSpeedFixture('lab-only.synthesized.json') as {
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
    const body = readPageSpeedFixture('url-field.synthesized.json') as {
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
