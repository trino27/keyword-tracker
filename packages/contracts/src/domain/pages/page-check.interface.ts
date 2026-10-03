import type { TSeoIssueCode } from '../seo/seo-issue-catalogue.constant.js';

/**
 * What one catalogue check concluded about one page.
 *
 * Four outcomes, because three cannot tell the truth about a page whose crawl is older
 * than a check. `passed` and `notApplicable` differ in the score's denominator —
 * the distinction the rules' third verdict exists to preserve, and the reason a page
 * with no title is not rewarded for a title-length check that never ran.
 * `notYetChecked` is the code the catalogue has today and that crawl did not have.
 */
export const CHECK_STATUSES = [
  'passed',
  'failed',
  'notApplicable',
  'notYetChecked',
] as const;

export type TCheckStatus = (typeof CHECK_STATUSES)[number];

/**
 * One check's outcome on one page. Deliberately thin: the label, the hint and the
 * thresholds stay in `SEO_ISSUE_CATALOGUE`, which both sides already import, so the
 * copy on the screen has one source and cannot drift from the rule that produced it.
 *
 * A failure carries no details here either — those are in the page's `issues`, with the
 * measurement and the count of sibling pages that share the code.
 */
export interface IPageCheck {
  code: TSeoIssueCode;
  status: TCheckStatus;
}
