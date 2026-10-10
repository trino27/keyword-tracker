import { z } from 'zod';
import type { TCwvSource } from '@app/contracts';

/** One Core Web Vital as it will be stored: the value and whose experience it is. */
export interface ICwvValue<TSource extends TCwvSource = TCwvSource> {
  value: number;
  source: TSource;
}

/** What one PageSpeed answer says about a page (plan D1). */
export interface IExtractedMeasurement {
  lcp: ICwvValue;
  /** Null: Google has no real-visitor responsiveness data for the page or the site. */
  inp: ICwvValue<'url' | 'origin'> | null;
  cls: ICwvValue;
  /** Lighthouse's lab performance score, 0..100. */
  performanceScore: number;
}

const fieldMetricSchema = z.object({
  percentile: z.number(),
  distributions: z
    .array(z.object({ min: z.number(), max: z.number().optional() }))
    .optional(),
});

const loadingExperienceSchema = z.object({
  metrics: z
    .object({
      LARGEST_CONTENTFUL_PAINT_MS: fieldMetricSchema.optional(),
      INTERACTION_TO_NEXT_PAINT: fieldMetricSchema.optional(),
      CUMULATIVE_LAYOUT_SHIFT_SCORE: fieldMetricSchema.optional(),
    })
    .optional(),
  origin_fallback: z.boolean().optional(),
});

const auditSchema = z.object({ numericValue: z.number().optional() });

/** Exactly the paths read below; everything else in the answer is ignored. */
const pageSpeedResultSchema = z.object({
  loadingExperience: loadingExperienceSchema.optional(),
  originLoadingExperience: loadingExperienceSchema.optional(),
  lighthouseResult: z
    .object({
      audits: z
        .object({
          'largest-contentful-paint': auditSchema.optional(),
          'cumulative-layout-shift': auditSchema.optional(),
        })
        .optional(),
      categories: z
        .object({
          performance: z
            .object({ score: z.number().nullable().optional() })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

type TFieldMetric = z.infer<typeof fieldMetricSchema>;
type TFieldKey = keyof NonNullable<
  z.infer<typeof loadingExperienceSchema>['metrics']
>;

/**
 * Per metric, independently: the page's own field data, else the whole site's, else
 * Lighthouse's lab run — and for INP no lab step, since a lab run never interacts with
 * the page. Null when no source has LCP or CLS, or Lighthouse produced no score: there
 * is no measurement to store whole.
 *
 * `loadingExperience` with `origin_fallback` is the site's data under the page's name,
 * so it counts as `origin`, never as `url`.
 */
export function extractMeasurement(
  body: unknown,
): IExtractedMeasurement | null {
  const parsed = pageSpeedResultSchema.safeParse(body);
  if (!parsed.success) return null;
  const result = parsed.data;

  const page = result.loadingExperience?.origin_fallback
    ? undefined
    : result.loadingExperience?.metrics;
  const origin = result.originLoadingExperience?.metrics;
  const audits = result.lighthouseResult?.audits;

  const field = (key: TFieldKey): ICwvValue<'url' | 'origin'> | null => {
    const own = page?.[key];
    if (own) return { value: own.percentile, source: 'url' };
    const site = origin?.[key];
    return site ? { value: site.percentile, source: 'origin' } : null;
  };

  const lcpField = field('LARGEST_CONTENTFUL_PAINT_MS');
  const labLcp = audits?.['largest-contentful-paint']?.numericValue;
  const lcp: ICwvValue | null =
    lcpField ??
    (labLcp === undefined ? null : { value: labLcp, source: 'lab' });

  const clsField = field('CUMULATIVE_LAYOUT_SHIFT_SCORE');
  const clsFieldMetric =
    clsField &&
    (clsField.source === 'url' ? page : origin)?.CUMULATIVE_LAYOUT_SHIFT_SCORE;
  const labCls = audits?.['cumulative-layout-shift']?.numericValue;
  const cls: ICwvValue | null =
    clsField && clsFieldMetric
      ? { value: unscaledCls(clsFieldMetric), source: clsField.source }
      : labCls === undefined
        ? null
        : { value: labCls, source: 'lab' };

  const score = result.lighthouseResult?.categories?.performance?.score;
  if (!lcp || !cls || score === null || score === undefined) return null;

  const inp = field('INTERACTION_TO_NEXT_PAINT');
  return {
    lcp: { value: Math.round(lcp.value), source: lcp.source },
    inp: inp && { value: Math.round(inp.value), source: inp.source },
    cls: { value: round(cls.value, 4), source: cls.source },
    performanceScore: Math.round(score * 100),
  };
}

/**
 * CrUX reports a CLS percentile × 100 (5 means 0.05), and its distribution bounds give the
 * scale away: 10 and 25 rather than 0.1 and 0.25. Reading the scale from the answer keeps
 * a change on Google's side from multiplying every page's CLS by a hundred silently.
 */
function unscaledCls(metric: TFieldMetric): number {
  const firstBound = metric.distributions?.[0]?.max;
  const scale = firstBound !== undefined && firstBound <= 1 ? 1 : 100;
  return metric.percentile / scale;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
