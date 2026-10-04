import type {
  TIssueDetails,
  TRunIssueCode,
  TSeoIssueCode,
} from '@app/contracts';
import type { IParsedPage } from '../../interfaces/parsed-page.interface';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';

/**
 * Everything a check may look at about one page: the page as fetched and as parsed.
 *
 * Deliberately absent: the fetch's response time, which measures the crawler's network
 * position rather than the page, and the page's top keyword, which no page-scoped check
 * reads. An input nobody reads invites a check that silently depends on keyword ordering.
 */
export interface ICheckInput {
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
 * Everything a run-scoped check may look at: every page of the crawl, and the keywords
 * the extraction gave each of them.
 *
 * A page-scoped check cannot answer these questions by construction — "is another page
 * using this title" is not a property of a page but of a set. The keywords are here
 * because cannibalisation is the check the catalogue most needs and it is the only one
 * that reads them; a check that ignores them simply does.
 */
export interface IRunInput {
  pages: readonly ICheckInput[];
  /** Per page, by the same index as `pages`. */
  keywords: readonly ISelectedKeyword[][];
}

/**
 * A check's judgement, in three outcomes.
 *
 * `pass` and `notApplicable` both produce no issue and differ only in the denominator of
 * the page's score. That difference is the whole reason the third outcome exists: a single
 * `null` meant EITHER "the title is 45 characters" OR "there is no title to measure", and
 * no caller could tell them apart — so a page with no title was silently rewarded for
 * passing a check that never ran.
 *
 * What a `fails` verdict may carry is decided by the code — a measurement where the
 * catalogue declares a bound, details otherwise — so a threshold check cannot return loose
 * details and a plain check cannot pretend to a measurement. Severity is not the check's
 * to decide; it comes from the catalogue.
 */
export type TVerdict<TCode extends TSeoIssueCode> =
  | { outcome: 'pass' }
  | { outcome: 'notApplicable' }
  | { outcome: 'fails'; details: TIssueDetails<TCode> };

/** The two verdicts that carry nothing; shared so a check reads as one line. */
export const PASS = { outcome: 'pass' } as const;
export const NOT_APPLICABLE = { outcome: 'notApplicable' } as const;

export const fails = <TCode extends TSeoIssueCode>(
  details: TIssueDetails<TCode>,
): TVerdict<TCode> => ({ outcome: 'fails', details });

/** A check that judges a page by itself. */
export interface IPageScopedCheck<TCode extends TSeoIssueCode> {
  readonly code: TCode;
  readonly scope: 'page';
  evaluate(page: ICheckInput): TVerdict<TCode>;
}

/**
 * A check that reads the whole crawl and answers for all of it at once: ONE VERDICT PER
 * PAGE, in the order the pages were given. The outcomes are a page check's outcomes, so a
 * run finding is indistinguishable from a page finding once it reaches a screen, and the
 * score counts both in one denominator.
 */
export interface IRunScopedCheck<TCode extends TSeoIssueCode> {
  readonly code: TCode;
  readonly scope: 'run';
  evaluate(run: IRunInput): TVerdict<TCode>[];
}

/**
 * Which shape a check has is decided by its CODE, through the catalogue's `scope`, not by
 * the check itself. That is what makes a run-shaped check under a page code — or the
 * reverse — a compile error instead of a check that runs and never fires.
 */
export type TCheck<TCode extends TSeoIssueCode> = TCode extends TRunIssueCode
  ? IRunScopedCheck<TCode>
  : IPageScopedCheck<TCode>;

/**
 * The code is carried by the unit, not only by the key it is registered under. Without it
 * two unmeasured checks are structurally identical, and registering one under the other's
 * code would compile.
 */
export const defineCheck = <TCode extends TSeoIssueCode>(
  code: TCode,
  evaluate: (page: ICheckInput) => TVerdict<TCode>,
): IPageScopedCheck<TCode> => ({ code, scope: 'page', evaluate });

export const defineRunCheck = <TCode extends TRunIssueCode>(
  code: TCode,
  evaluate: (run: IRunInput) => TVerdict<TCode>[],
): IRunScopedCheck<TCode> => ({ code, scope: 'run', evaluate });
