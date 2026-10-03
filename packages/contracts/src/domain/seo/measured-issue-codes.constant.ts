import {
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type TSeoIssueCode,
} from './seo-issue-catalogue.constant.js';

/**
 * The codes whose catalogue entry declares a bound, and whose finding is therefore a
 * measurement. Derived from the catalogue: there is no second list to drift from it.
 */
export type TMeasuredIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends
    { min: number } | { max: number }
    ? K
    : never;
}[TSeoIssueCode];

export const MEASURED_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) =>
    'min' in SEO_ISSUE_CATALOGUE[code] || 'max' in SEO_ISSUE_CATALOGUE[code],
) as TMeasuredIssueCode[];
