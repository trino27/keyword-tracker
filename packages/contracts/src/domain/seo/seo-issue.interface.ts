import type {
  TCrawlIssueCode,
  TPageSpeedIssueCode,
  TSeoIssueCode,
} from './seo-issue-catalogue.constant.js';
import type { TMeasuredIssueCode } from './measured-issue-codes.constant.js';
import type { ISeoMeasurement } from './seo-measurement.interface.js';
import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';
import type { ICwvMeasurement } from '../page-speed/cwv-measurement.interface.js';

/**
 * What a finding carries: a speed measurement with its source for a speed code, a
 * measurement where a crawl code has a bound, details otherwise.
 */
export type TIssueDetails<TCode extends TSeoIssueCode> =
  TCode extends TPageSpeedIssueCode
    ? ICwvMeasurement
    : TCode extends TMeasuredIssueCode
      ? ISeoMeasurement
      : Record<string, unknown>;

type TIssueOver<TCodes extends TSeoIssueCode> = {
  [K in TCodes]: {
    code: K;
    severity: TSeoIssueSeverity;
    details: TIssueDetails<K>;
  };
}[TCodes];

/**
 * One issue found on a page. A union over the code, so `details` is narrowed by it: a
 * measured code cannot carry loose details and a plain one cannot pretend to a measurement.
 */
export type TSeoIssue = TIssueOver<TSeoIssueCode>;

/** A finding the crawl writes, and the only kind its replace may delete. */
export type TCrawlSeoIssue = TIssueOver<TCrawlIssueCode>;

/** A finding the PageSpeed worker writes, and the only kind its replace may delete. */
export type TPageSpeedSeoIssue = TIssueOver<TPageSpeedIssueCode>;
