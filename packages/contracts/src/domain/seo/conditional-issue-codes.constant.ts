import {
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type TSeoIssueCode,
} from './seo-issue-catalogue.constant.js';

/**
 * The codes whose rule can answer `notApplicable`, and which therefore declare why.
 * Derived from the catalogue: there is no second list to drift from it.
 */
export type TConditionalIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends {
    skipReason: string;
  }
    ? K
    : never;
}[TSeoIssueCode];

export const CONDITIONAL_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => 'skipReason' in SEO_ISSUE_CATALOGUE[code],
) as TConditionalIssueCode[];

/**
 * Why the check was skipped, or null for a code that always applies.
 *
 * An accessor rather than a property read, because `SEO_ISSUE_CATALOGUE[code]` over an
 * unnarrowed code is a union whose other members have no `skipReason` — every caller
 * would otherwise repeat the same `in` check to get past it.
 */
export function skipReasonOf(code: TSeoIssueCode): string | null {
  const entry = SEO_ISSUE_CATALOGUE[code];
  return 'skipReason' in entry ? entry.skipReason : null;
}
