import type { ISeoMeasurement } from '../seo/seo-measurement.interface.js';
import type { TCwvSource } from './cwv-source.enum.js';

/**
 * A speed finding's details: the value Google reported, the bound it crossed (snapshotted
 * at measurement time, like every bounded finding), and whose experience the value is.
 */
export interface ICwvMeasurement extends ISeoMeasurement {
  source: TCwvSource;
}
