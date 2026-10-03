import type { TSeoIssueCode } from './seo-issue-catalogue.constant.js';
import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';

/** One issue found on a page; `details` says exactly what is wrong. */
export interface ISeoIssue {
  code: TSeoIssueCode;
  severity: TSeoIssueSeverity;
  details: Record<string, unknown>;
}
