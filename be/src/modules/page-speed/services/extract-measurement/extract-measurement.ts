import { z } from 'zod';
import {
  LCP_PHASES,
  type ILcpBreakdown,
  type TCwvSource,
  type TLcpPhase,
} from '@app/contracts';

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

/** The share of real visits in Google's good band and in its poor one. */
export interface IVisitShares {
  good: number;
  poor: number;
}

/** What one PageSpeed answer says beyond the Core Web Vitals (lighthouse-checks D7, D8). */
export interface IExtractedDiagnostics {
  /** Real visitors' time to first byte; null without field data — never the lab (D8). */
  ttfb: ICwvValue<'url' | 'origin'> | null;
  /** Per metric, from the same data as its value; null for a lab value or none. */
  shares: Record<'lcp' | 'inp' | 'cls' | 'ttfb', IVisitShares | null>;
  lcpBreakdown: ILcpBreakdown | null;
}

const fieldMetricSchema = z.object({
  percentile: z.number(),
  distributions: z
    .array(
      z.object({
        min: z.number(),
        max: z.number().optional(),
        proportion: z.number().optional(),
      }),
    )
    .optional(),
});

/**
 * One metric Google reports in an odd shape reads as that metric absent — the next
 * source answers for it — not as an answer with no measurement at all: a malformed TTFB,
 * a diagnostic, would otherwise have failed the page NO_MEASUREMENT.
 */
const optionalFieldMetric = fieldMetricSchema.optional().catch(undefined);

const loadingExperienceSchema = z.object({
  metrics: z
    .object({
      LARGEST_CONTENTFUL_PAINT_MS: optionalFieldMetric,
      INTERACTION_TO_NEXT_PAINT: optionalFieldMetric,
      CUMULATIVE_LAYOUT_SHIFT_SCORE: optionalFieldMetric,
      EXPERIMENTAL_TIME_TO_FIRST_BYTE: optionalFieldMetric,
    })
    .optional(),
  origin_fallback: z.boolean().optional(),
});

const auditSchema = z.object({ numericValue: z.number().optional() });

/**
 * `lcp-breakdown-insight` (Lighthouse 13): a table of phases and the element's node, in
 * `details.items`. Each item is told apart by what it holds rather than by its position,
 * so a reordered list still reads, and an unrecognised one reads as no breakdown rather
 * than as a failed measurement.
 */
const breakdownAuditSchema = z.object({
  details: z
    .object({
      items: z.array(
        z.looseObject({
          items: z
            .array(z.looseObject({ subpart: z.string(), duration: z.number() }))
            .optional(),
          type: z.string().optional(),
          selector: z.string().optional(),
          snippet: z.string().optional(),
        }),
      ),
    })
    .optional(),
});

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
          // An answer whose breakdown does not read as one still measures: `.catch`.
          'lcp-breakdown-insight': breakdownAuditSchema
            .optional()
            .catch(undefined),
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
type TPageSpeedResult = z.infer<typeof pageSpeedResultSchema>;

/** A metric's real-visitor figure, from the page's data or else the site's. */
interface IFieldReading {
  value: number;
  source: 'url' | 'origin';
  metric: TFieldMetric;
}

/**
 * Per metric, the page's own field data, else the whole site's. `loadingExperience` with
 * `origin_fallback` is the site's data under the page's name, so it counts as `origin`,
 * never as `url`. Both extractions read the field through this one function, which is what
 * keeps a share beside the value it was measured with: the two describe the same visits.
 */
function fieldReader(result: TPageSpeedResult) {
  const page = result.loadingExperience?.origin_fallback
    ? undefined
    : result.loadingExperience?.metrics;
  const origin = result.originLoadingExperience?.metrics;
  return (key: TFieldKey): IFieldReading | null => {
    const own = page?.[key];
    if (own) return { value: own.percentile, source: 'url', metric: own };
    const site = origin?.[key];
    return site
      ? { value: site.percentile, source: 'origin', metric: site }
      : null;
  };
}

/**
 * Per metric, independently: the page's own field data, else the whole site's, else
 * Lighthouse's lab run — and for INP no lab step, since a lab run never interacts with
 * the page. Null when no source has LCP or CLS, or Lighthouse produced no score: there
 * is no measurement to store whole.
 */
export function extractMeasurement(
  body: unknown,
): IExtractedMeasurement | null {
  const parsed = pageSpeedResultSchema.safeParse(body);
  if (!parsed.success) return null;
  const result = parsed.data;
  const read = fieldReader(result);
  const audits = result.lighthouseResult?.audits;

  const lcpField = read('LARGEST_CONTENTFUL_PAINT_MS');
  const labLcp = audits?.['largest-contentful-paint']?.numericValue;
  const lcp: ICwvValue | null = lcpField
    ? { value: lcpField.value, source: lcpField.source }
    : labLcp === undefined
      ? null
      : { value: labLcp, source: 'lab' };

  const clsField = read('CUMULATIVE_LAYOUT_SHIFT_SCORE');
  const labCls = audits?.['cumulative-layout-shift']?.numericValue;
  const cls: ICwvValue | null = clsField
    ? { value: unscaledCls(clsField.metric), source: clsField.source }
    : labCls === undefined
      ? null
      : { value: labCls, source: 'lab' };

  const score = result.lighthouseResult?.categories?.performance?.score;
  if (!lcp || !cls || score === null || score === undefined) return null;

  const inp = read('INTERACTION_TO_NEXT_PAINT');
  return {
    lcp: { value: Math.round(lcp.value), source: lcp.source },
    inp: inp && { value: Math.round(inp.value), source: inp.source },
    cls: { value: round(cls.value, 4), source: cls.source },
    performanceScore: Math.round(score * 100),
  };
}

/**
 * The field TTFB, the good and poor shares of visits for each metric, and where the lab
 * LCP's time went. None of it is needed for a measurement to be stored, so an answer
 * without it gives nulls, never a failure. A metric whose value comes from the lab has no
 * shares: whenever `extractMeasurement` took a value from the field, this takes the shares
 * from that same data.
 */
export function extractDiagnostics(
  body: unknown,
): IExtractedDiagnostics | null {
  const parsed = pageSpeedResultSchema.safeParse(body);
  if (!parsed.success) return null;
  const read = fieldReader(parsed.data);

  const sharesOf = (key: TFieldKey): IVisitShares | null => {
    const reading = read(key);
    return reading && visitShares(reading.metric);
  };
  const ttfb = read('EXPERIMENTAL_TIME_TO_FIRST_BYTE');

  return {
    ttfb: ttfb && { value: Math.round(ttfb.value), source: ttfb.source },
    shares: {
      lcp: sharesOf('LARGEST_CONTENTFUL_PAINT_MS'),
      inp: sharesOf('INTERACTION_TO_NEXT_PAINT'),
      cls: sharesOf('CUMULATIVE_LAYOUT_SHIFT_SCORE'),
      ttfb: sharesOf('EXPERIMENTAL_TIME_TO_FIRST_BYTE'),
    },
    lcpBreakdown: lcpBreakdownOf(
      parsed.data.lighthouseResult?.audits?.['lcp-breakdown-insight'],
    ),
  };
}

/**
 * Google's three bands, good to poor, each with its proportion of visits. Anything else —
 * two bands, a missing proportion — is not a split the screen can draw, so it is none.
 */
function visitShares(metric: TFieldMetric): IVisitShares | null {
  const bands = metric.distributions;
  if (bands?.length !== 3) return null;
  const [good, , poor] = bands.map((band) => band.proportion);
  return good === undefined || poor === undefined ? null : { good, poor };
}

/** The phases in the order they happen, and the element, as Lighthouse names them. */
function lcpBreakdownOf(
  audit: z.infer<typeof breakdownAuditSchema> | undefined,
): ILcpBreakdown | null {
  const items = audit?.details?.items ?? [];
  const table = items.find((item) => item.items !== undefined)?.items ?? [];
  const phases = LCP_PHASES.flatMap((phase: TLcpPhase) => {
    const row = table.find((r) => r.subpart === phase);
    return row ? [{ phase, ms: Math.round(row.duration) }] : [];
  });
  if (phases.length === 0) return null;
  const node = items.find((item) => item.type === 'node');
  return {
    element:
      node?.selector !== undefined && node.snippet !== undefined
        ? { selector: node.selector, snippet: node.snippet }
        : null,
    phases,
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
