import { SEO_ISSUE_CATALOGUE, type TPageSpeedSeoIssueOf } from '@app/contracts';
import { cwvIssuesOf } from '../cwv-issues/cwv-issues-of';
import type { IExtractedImageDelivery } from '../extract-image-delivery/extract-image-delivery';
import type { IExtractedMeasurement } from '../extract-measurement/extract-measurement';

/**
 * Every speed finding one device's measurement produces: its Core Web Vitals findings
 * (`cwvIssuesOf`), and on mobile Lighthouse's image-delivery finding when the audit fails
 * with at least the catalogue's `min` to save.
 *
 * Two overloads, one per device: the desktop one has no image input, so image delivery
 * cannot reach a desktop row by a caller's slip — the desktop answer asks for performance
 * only, and the finding is mobile's (plan D10).
 */
export function speedIssuesOf(input: {
  strategy: 'mobile';
  measurement: IExtractedMeasurement;
  imageDelivery: IExtractedImageDelivery | null;
}): TPageSpeedSeoIssueOf<'mobile'>[];
export function speedIssuesOf(input: {
  strategy: 'desktop';
  measurement: IExtractedMeasurement;
}): TPageSpeedSeoIssueOf<'desktop'>[];
export function speedIssuesOf(
  input:
    | {
        strategy: 'mobile';
        measurement: IExtractedMeasurement;
        imageDelivery: IExtractedImageDelivery | null;
      }
    | { strategy: 'desktop'; measurement: IExtractedMeasurement },
): TPageSpeedSeoIssueOf<'mobile'>[] | TPageSpeedSeoIssueOf<'desktop'>[] {
  if (input.strategy === 'desktop')
    return cwvIssuesOf('desktop', input.measurement);
  const issues: TPageSpeedSeoIssueOf<'mobile'>[] = cwvIssuesOf(
    'mobile',
    input.measurement,
  );
  const { imageDelivery } = input;
  // The bar has one owner: the catalogue's `min`, snapshotted with the finding.
  const entry = SEO_ISSUE_CATALOGUE.IMAGE_DELIVERY_INEFFICIENT;
  if (imageDelivery?.failing && imageDelivery.savingsBytes >= entry.min)
    issues.push({
      code: 'IMAGE_DELIVERY_INEFFICIENT',
      severity: entry.severity,
      details: {
        value: imageDelivery.savingsBytes,
        min: entry.min,
        images: imageDelivery.images,
      },
    });
  return issues;
}
