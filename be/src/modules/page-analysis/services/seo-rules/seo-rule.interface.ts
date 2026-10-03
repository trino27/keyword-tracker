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
 * A pure judgement: `null` when the page passes, otherwise the finding. What the finding
 * may be is decided by the code — a measurement where the catalogue declares a bound,
 * details otherwise — so a threshold rule cannot return loose details and a plain rule
 * cannot pretend to a measurement. Severity is not the rule's to decide; it comes from
 * the catalogue.
 */
export type TSeoRule<TCode extends TSeoIssueCode> = (
  input: ISeoRuleInput,
) => TIssueDetails<TCode> | null;

export type TSeoRuleGroup<TCode extends TSeoIssueCode> = {
  [K in TCode]: TSeoRule<K>;
};
