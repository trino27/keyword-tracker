import {
  CRAWL_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  type TCrawlIssueCode,
} from './seo-issue-catalogue.constant.js';

/**
 * The crawl codes whose catalogue entry declares a bound, and whose finding is therefore
 * a measurement. Derived from the catalogue: there is no second list to drift from it.
 *
 * Crawl codes only. A speed finding is bounded too, but it also says whose experience the
 * value is (`ICwvMeasurement`), so it has a variant of its own on both sides of the wire.
 */
export type TMeasuredIssueCode = {
  [K in TCrawlIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends
    { min: number } | { max: number }
    ? K
    : never;
}[TCrawlIssueCode];

export const MEASURED_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) =>
    'min' in SEO_ISSUE_CATALOGUE[code] || 'max' in SEO_ISSUE_CATALOGUE[code],
) as TMeasuredIssueCode[];
