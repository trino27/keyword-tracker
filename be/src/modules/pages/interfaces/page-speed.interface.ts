import type {
  ILcpBreakdown,
  TCwvSource,
  TLighthouseIssueCode,
  TPageSpeedErrorCode,
} from '@app/contracts';

/**
 * The PageSpeed queue's shapes, exported by the pages module for the worker that drains
 * it — beside the module's services, never from its repository.
 */

/** A measurement as the worker writes it: whole, with each value's source. */
export interface IPageSpeedMeasurementWrite {
  lcpMs: number;
  lcpSource: TCwvSource;
  /** Null with its source: Google has no field INP for the page or the site. */
  inpMs: number | null;
  inpSource: Exclude<TCwvSource, 'lab'> | null;
  cls: number;
  clsSource: TCwvSource;
  performanceScore: number;
  measuredAt: Date;
  /**
   * Everything below is written on every measurement, null included, so an answer that
   * lacks a part clears the part an older answer left (lighthouse-checks D20): a row's
   * figures always come from one answer.
   */
  ttfbMs: number | null;
  ttfbSource: Exclude<TCwvSource, 'lab'> | null;
  lcpGoodShare: number | null;
  lcpPoorShare: number | null;
  inpGoodShare: number | null;
  inpPoorShare: number | null;
  clsGoodShare: number | null;
  clsPoorShare: number | null;
  ttfbGoodShare: number | null;
  ttfbPoorShare: number | null;
  lcpBreakdown: ILcpBreakdown | null;
  /** Lighthouse's record: all three null when the answer had neither category. */
  lighthouseJudged: TLighthouseIssueCode[] | null;
  lighthouseNotApplicable: TLighthouseIssueCode[] | null;
  lighthouseFailed: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
}

/**
 * What a failed attempt may write — job columns only, by construction: there is no key
 * here a measurement could travel under, so a failure cannot erase the last good one.
 */
export interface IPageSpeedJobWrite {
  /** `queued` to try again at `nextAttemptAt`, `failed` to give up. */
  status: 'queued' | 'failed';
  nextAttemptAt?: Date;
  lastError: TPageSpeedErrorCode;
}

/** A claimed row: the page, the attempt that owns it, and the URL Google measures. */
export interface IClaimedPageSpeed {
  pageId: number;
  attempt: number;
  /** The page's final URL — field data is keyed by where visitors land (plan D22). */
  url: string;
}
