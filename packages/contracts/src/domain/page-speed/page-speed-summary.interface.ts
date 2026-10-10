import type { TCwvBand } from './cwv-band.enum.js';
import type { TCwvSource } from './cwv-source.enum.js';
import type { TPageSpeedErrorCode } from './page-speed-error.constant.js';
import type { TPageSpeedStatus } from './page-speed-status.enum.js';

/** One Core Web Vital as a badge shows it: the value, its band and whose it is. */
export interface ICwvReading {
  /** LCP and INP in milliseconds, CLS unitless. */
  value: number;
  /** Derived from the value and the thresholds when read, never stored. */
  band: TCwvBand;
  source: TCwvSource;
}

/** The page's last successful measurement. */
export interface IPageSpeedMeasurement {
  /** ISO-8601 UTC. */
  measuredAt: string;
  lcp: ICwvReading;
  /** Null: Google has no real-visitor responsiveness data for the page or the site. */
  inp: ICwvReading | null;
  cls: ICwvReading;
  /** Lighthouse's lab performance score, 0..100 — a caption, never a badge. */
  performanceScore: number;
}

/**
 * Where a page stands with PageSpeed: its place in the queue, the last good measurement
 * if there ever was one, and — only once the page has been given up on — why.
 */
export interface IPageSpeedSummary {
  status: TPageSpeedStatus;
  /** Null: never measured. Kept through every later failure. */
  measurement: IPageSpeedMeasurement | null;
  /** Non-null only when `status` is `failed`. */
  lastError: TPageSpeedErrorCode | null;
}
