import type { TSeoIssueCode } from './seo-issue-catalogue.constant.js';
import type { TMeasuredIssueCode } from './measured-issue-codes.constant.js';
import type { ISeoMeasurement } from './seo-measurement.interface.js';
import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';

/** What a finding carries: a measurement where the code has a bound, details otherwise. */
export type TIssueDetails<TCode extends TSeoIssueCode> =
  TCode extends TMeasuredIssueCode ? ISeoMeasurement : Record<string, unknown>;

/**
 * One issue found on a page. A union over the code, so `details` is narrowed by it: a
 * measured code cannot carry loose details and a plain one cannot pretend to a measurement.
 */
export type TSeoIssue = {
  [K in TSeoIssueCode]: {
    code: K;
    severity: TSeoIssueSeverity;
    details: TIssueDetails<K>;
  };
}[TSeoIssueCode];
