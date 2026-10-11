import { z } from 'zod';

/** The audit's id in Lighthouse 13 (read from live answers, 2026-10-11). */
const AUDIT_ID = 'image-delivery-insight';

/** The images listed, largest saving first, at most this many. */
const MAX_IMAGES = 10;

/**
 * What Lighthouse's "Improve image delivery" audit said about the page's images: whether
 * it failed, how many bytes it estimates the images could lose, and the images themselves.
 */
export interface IExtractedImageDelivery {
  /** The audit scored below 1: Lighthouse found images to improve. */
  failing: boolean;
  /** Lighthouse's estimate over every image, in bytes. */
  savingsBytes: number;
  /** Largest saving first, at most ten. */
  images: { url: string; savingsBytes: number }[];
}

/**
 * Exactly the paths read below; everything else in the answer is ignored. Its own schema,
 * so a renamed or reshaped audit loses this finding and nothing else — the measurement is
 * read by `extractMeasurement`, untouched.
 */
const answerSchema = z.object({
  lighthouseResult: z.object({
    audits: z.object({
      [AUDIT_ID]: z.object({
        score: z.number(),
        details: z.object({
          debugData: z.object({ wastedBytes: z.number().min(0) }),
          items: z.array(
            z.object({ url: z.string(), wastedBytes: z.number().min(0) }),
          ),
        }),
      }),
    }),
  }),
});

/**
 * The image-delivery audit of a PageSpeed answer, or null when the answer has none or it
 * does not parse — no data, never a failure of the measurement it came with. The total is
 * `debugData.wastedBytes`, which the audit's own "Est savings of … KiB" rounds.
 */
export function extractImageDelivery(
  json: unknown,
): IExtractedImageDelivery | null {
  const parsed = answerSchema.safeParse(json);
  if (!parsed.success) return null;
  const audit = parsed.data.lighthouseResult.audits[AUDIT_ID];
  return {
    failing: audit.score < 1,
    savingsBytes: audit.details.debugData.wastedBytes,
    images: [...audit.details.items]
      .sort((a, b) => b.wastedBytes - a.wastedBytes)
      .slice(0, MAX_IMAGES)
      .map(({ url, wastedBytes }) => ({ url, savingsBytes: wastedBytes })),
  };
}
