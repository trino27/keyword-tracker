import type { TIssueDetails, TRunIssueCode } from '@app/contracts';
import {
  fails,
  NOT_APPLICABLE,
  PASS,
  type IRunInput,
  type TVerdict,
} from '../check.interface';

/**
 * The value each page offers for comparison, normalized, or null when the page has
 * none to offer and the check cannot run on it.
 */
export type TValueOf = (input: IRunInput, index: number) => string | null;

/**
 * The shape all three duplication checks share: take one value per page, and report
 * every page whose value another page also has.
 *
 * `notApplicable` rather than `pass` in two cases, and the difference matters because
 * it is the score's denominator: a page with no title has nothing to be duplicated,
 * and a run of one page has nothing to compare against. Scoring either as a pass
 * rewards a page for a check that never ran — the same mistake the three-outcome
 * verdict exists to prevent.
 */
export function duplicatesOf<TCode extends TRunIssueCode>(
  input: IRunInput,
  valueOf: TValueOf,
  detailsOf: (value: string, others: string[]) => TIssueDetails<TCode>,
): TVerdict<TCode>[] {
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
