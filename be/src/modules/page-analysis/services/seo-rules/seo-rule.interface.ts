import type { TSeoIssueCode } from '@app/contracts';
import type { IParsedPage } from '../../interfaces/parsed-page.interface';

/** Everything a rule may look at: the page as fetched and as parsed. */
export interface ISeoRuleInput {
  /** As the sitemap lists it. */
  url: string;
  finalUrl: string;
  redirected: boolean;
  /** Lower-cased response headers. */
  headers: Record<string, string>;
  /** Time to first byte. */
  responseMs: number;
  htmlBytes: number;
  parsed: IParsedPage;
  /** The page's best keyword (normalized), once keywords are chosen; null before. */
  topKeyword: string | null;
}

/**
 * A pure judgement: `null` when the page passes, otherwise the details of what is
 * wrong. Severity is not the rule's to decide — it comes from the catalogue.
 */
export type TSeoRule = (input: ISeoRuleInput) => Record<string, unknown> | null;

export type TSeoRuleGroup<TCode extends TSeoIssueCode> = Record<
  TCode,
  TSeoRule
>;
