import {
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type TSeoIssueCode,
} from './catalogue/issue-catalogues.constant.js';
import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';

/**
 * What one check is worth in a page's score, by its severity. A Critical failure keeps a
 * page out of search; an Improvement is good practice. Counting them alike let a page
 * with a broken canonical outscore one missing three alt texts, so they are not alike.
 *
 * The ratios are a product decision, not a model of ranking: change them here and every
 * score, the list's order and the explanation follow — nothing is stored.
 */
export const SEVERITY_WEIGHT = {
  error: 10,
  warning: 3,
  notice: 1,
} as const satisfies Record<TSeoIssueSeverity, number>;

/** Every catalogue code's weight, by its severity in the catalogue as it is today. */
export const CHECK_WEIGHTS = Object.fromEntries(
  SEO_ISSUE_CODES.map((code) => [
    code,
    SEVERITY_WEIGHT[SEO_ISSUE_CATALOGUE[code].severity],
  ]),
) as Record<TSeoIssueCode, number>;
