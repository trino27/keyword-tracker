import {
  NOT_APPLICABLE,
  PASS,
  fails,
} from '../../../seo-rules/seo-rule.interface';
import { normalizeText } from '../../../text/normalize-text/normalize-text';
import type { TIssueDetails, TRunIssueCode } from '@app/contracts';
import type { IRunRuleInput, TRunRuleGroup } from '../../run-rule.interface';
import type { TRuleVerdict } from '../../../seo-rules/seo-rule.interface';

/**
 * The value each page offers for comparison, normalized, or null when the page has
 * none to offer and the check cannot run on it.
 */
type TValueOf = (input: IRunRuleInput, index: number) => string | null;

/**
 * The shape all three duplication checks share: take one value per page, and report
 * every page whose value another page also has.
 *
 * `notApplicable` rather than `pass` in two cases, and the difference matters because
 * it is the score's denominator: a page with no title has nothing to be duplicated,
 * and a run of one page has nothing to compare against. Scoring either as a pass
 * rewards a page for a check that never ran — the same mistake the page rules'
 * three-outcome verdict exists to prevent.
 */
function duplicatesOf<TCode extends TRunIssueCode>(
  input: IRunRuleInput,
  valueOf: TValueOf,
  detailsOf: (value: string, others: string[]) => TIssueDetails<TCode>,
): TRuleVerdict<TCode>[] {
  const values = input.pages.map((_, index) => valueOf(input, index));
  const owners = new Map<string, string[]>();
  values.forEach((value, index) => {
    if (value === null) return;
    const urls = owners.get(value) ?? [];
    urls.push(input.pages[index].url);
    owners.set(value, urls);
  });

  return values.map((value, index) => {
    if (input.pages.length < 2 || value === null) return NOT_APPLICABLE;
    const others = (owners.get(value) ?? []).filter(
      (url) => url !== input.pages[index].url,
    );
    return others.length === 0 ? PASS : fails(detailsOf(value, others));
  });
}

/** A page's top keyword — the one subject it is shown as being about. */
const topKeyword: TValueOf = (input, index) =>
  input.keywords[index]?.[0]?.term ?? null;

const titleOf: TValueOf = (input, index) => {
  const title = normalizeText(input.pages[index].parsed.title ?? '');
  return title.length > 0 ? title : null;
};

const descriptionOf: TValueOf = (input, index) => {
  const description = normalizeText(
    input.pages[index].parsed.metaDescription ?? '',
  );
  return description.length > 0 ? description : null;
};

/**
 * What one page shares with the others crawled beside it.
 *
 * Every one of these is invisible to a page reading only itself, and every one is a
 * thing an agency is paid to notice: two posts written for one query take each
 * other's links and rankings, and two posts with one title give a result page no way
 * to tell them apart. The Semrush fixtures carry a real example — "What is AI
 * marketing?" and "AI Marketing Guide" both come back with `ai marketing` first.
 */
export const DUPLICATION_RULES: TRunRuleGroup<
  'KEYWORD_CANNIBALISATION' | 'TITLE_DUPLICATE' | 'META_DESCRIPTION_DUPLICATE'
> = {
  KEYWORD_CANNIBALISATION: (input) =>
    duplicatesOf(input, topKeyword, (term, others) => ({
      term,
      otherUrls: others,
    })),
  TITLE_DUPLICATE: (input) =>
    duplicatesOf(input, titleOf, (_, others) => ({ otherUrls: others })),
  META_DESCRIPTION_DUPLICATE: (input) =>
    duplicatesOf(input, descriptionOf, (_, others) => ({ otherUrls: others })),
};
