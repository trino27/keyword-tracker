import type { TIssueDetails, TRunIssueCode } from '@app/contracts';
import {
  type ICheckInput,
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

const comparable = (url: string) => {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/+$/, '')}`;
  } catch {
    return url;
  }
};

/**
 * Whether two pages are one post in two languages: either names the other in its
 * hreflang links, or their `<html lang>` differ. Google reads such pages as localized
 * versions, not as rivals or copies — blog.cloudflare.com's zh-cn and zh-tw posts on
 * "monetization gateway" share the product's English name and nothing else.
 */
function areLanguageVersions(a: ICheckInput, b: ICheckInput): boolean {
  const names = (page: ICheckInput, url: string) =>
    page.parsed.alternates.some(
      ({ href }) => comparable(href) === comparable(url),
    );
  if (names(a, b.finalUrl) || names(b, a.finalUrl)) return true;
  const [langA, langB] = [a.parsed.lang, b.parsed.lang].map((lang) =>
    lang?.trim().toLowerCase(),
  );
  return Boolean(langA && langB && langA !== langB);
}

/**
 * The shape all three duplication checks share: take one value per page, and report
 * every page whose value another page also has — in the same language: a translation
 * is not a duplicate.
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
  detailsOf: (
    value: string,
    others: string[],
    index: number,
  ) => TIssueDetails<TCode>,
): TVerdict<TCode>[] {
  const values = input.pages.map((_, index) => valueOf(input, index));
  const owners = new Map<string, string[]>();
  values.forEach((value, index) => {
    if (value === null) return;
    const urls = owners.get(value) ?? [];
    urls.push(input.pages[index].url);
    owners.set(value, urls);
  });

  const byUrl = new Map(input.pages.map((page) => [page.url, page]));
  return values.map((value, index) => {
    if (input.pages.length < 2 || value === null) return NOT_APPLICABLE;
    const page = input.pages[index];
    const others = (owners.get(value) ?? []).filter((url) => {
      const other = byUrl.get(url);
      return url !== page.url && !(other && areLanguageVersions(page, other));
    });
    return others.length === 0 ? PASS : fails(detailsOf(value, others, index));
  });
}
