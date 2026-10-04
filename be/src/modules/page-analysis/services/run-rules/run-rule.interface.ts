import type { TRunIssueCode } from '@app/contracts';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import type {
  ISeoRuleInput,
  TRuleVerdict,
} from '../seo-rules/seo-rule.interface';

/**
 * Everything a run rule may look at: every page of the crawl, and the keywords the
 * extraction gave each of them.
 *
 * A page rule cannot answer these questions by construction — "is another page using
 * this title" is not a property of a page but of a set — which is why they are a
 * second registry rather than more entries in `SEO_RULES`. The keywords are here
 * because cannibalisation is the check the catalogue most needs and it is the only
 * one that reads them; a rule that ignores them simply does.
 */
export interface IRunRuleInput {
  pages: readonly ISeoRuleInput[];
  /** Per page, by the same index as `pages`. */
  keywords: readonly ISelectedKeyword[][];
}

/**
 * One verdict PER PAGE, in the order the pages were given — the same three outcomes a
 * page rule returns, so a run finding is indistinguishable from a page finding once
 * it reaches a screen, and the score counts both in one denominator.
 */
export type TRunRule<TCode extends TRunIssueCode> = (
  input: IRunRuleInput,
) => TRuleVerdict<TCode>[];

export type TRunRuleGroup<TCode extends TRunIssueCode> = {
  [K in TCode]: TRunRule<K>;
};
