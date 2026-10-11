import type { ISeoMeasurement } from '../seo/seo-measurement.interface.js';

/**
 * What `IMAGE_DELIVERY_INEFFICIENT` carries: Lighthouse's estimate of the bytes the page's
 * images could lose, against the bar it crossed, and the images themselves.
 */
export interface IImageDeliveryMeasurement extends ISeoMeasurement {
  /** Total savings Lighthouse estimates, in bytes. */
  value: number;
  /** The catalogue's 102 400 bytes (100 KiB), snapshotted with the finding. */
  min: number;
  /** Up to 10, largest saving first. */
  images: { url: string; savingsBytes: number }[];
}
