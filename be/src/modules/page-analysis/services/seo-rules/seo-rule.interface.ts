import type { TIssueDetails, TSeoIssueCode } from '@app/contracts';
import type { IParsedPage } from '../../interfaces/parsed-page.interface';

/**
 * Everything a rule may look at: the page as fetched and as parsed.
 *
 * Deliberately absent: the fetch's response time, which measures the crawler's network
 * position rather than the page, and the page's top keyword, which no rule reads now that
 * the top-keyword check is retired. An input nobody reads invites a rule that silently
 * depends on keyword ordering.
 */
export interface ISeoRuleInput {
  /** As the sitemap lists it. */
  url: string;
  finalUrl: string;
  redirected: boolean;
  /** Lower-cased response headers. */
  headers: Record<string, string>;
  htmlBytes: number;
  parsed: IParsedPage;
}

/**
 * A rule's judgement, in three outcomes.
 *
 * `pass` and `notApplicable` both produce no issue and differ only in the denominator of
 * the page's score. That difference is the whole reason the third outcome exists: a single
 * `null` meant EITHER "the title is 45 characters" OR "there is no title to measure", and
 * no caller could tell them apart — so a page with no title was silently rewarded for
 * passing a check that never ran.
 *
 * What a `fails` verdict may carry is decided by the code — a measurement where the
 * catalogue declares a bound, details otherwise — so a threshold rule cannot return loose
 * details and a plain rule cannot pretend to a measurement. Severity is not the rule's to
 * decide; it comes from the catalogue.
 */
export type TRuleVerdict<TCode extends TSeoIssueCode> =
  | { outcome: 'pass' }
  | { outcome: 'notApplicable' }
  | { outcome: 'fails'; details: TIssueDetails<TCode> };

export type TSeoRule<TCode extends TSeoIssueCode> = (
  input: ISeoRuleInput,
) => TRuleVerdict<TCode>;

/** The two verdicts that carry nothing; shared so a rule reads as one line. */
export const PASS = { outcome: 'pass' } as const;
export const NOT_APPLICABLE = { outcome: 'notApplicable' } as const;

export const fails = <TCode extends TSeoIssueCode>(
  details: TIssueDetails<TCode>,
): TRuleVerdict<TCode> => ({ outcome: 'fails', details });

export type TSeoRuleGroup<TCode extends TSeoIssueCode> = {
  [K in TCode]: TSeoRule<K>;
};
