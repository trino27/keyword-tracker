import type { ISelectedKeyword } from '../../keyword-extraction/select-keywords/select-keywords';
import type { ICheckInput, IRunInput } from '../check.interface';
import { makeCheckInput } from './make-check-input';

/**
 * One page of a run, named by its path so a duplication finding reads as URLs.
 *
 * Its canonical and its hreflang self-reference follow its URL, because `makeCheckInput`
 * builds a page that passes every check and a fixed URL in either would make every page
 * but one fail — a failure about the fixture, not about the check under test.
 */
export const runPage = (
  path: string,
  overrides: Parameters<typeof makeCheckInput>[0] = {},
): ICheckInput => {
  const url = `https://a.example/${path}/`;
  const { parsed, ...rest } = overrides;
  return makeCheckInput({
    url,
    finalUrl: url,
    ...rest,
    parsed: {
      canonical: url,
      alternates: [{ lang: 'en', href: url }],
      ...parsed,
    },
  });
};

/** A keyword list for one page; only the leading term decides cannibalisation. */
export const keywordsOf = (...terms: string[]): ISelectedKeyword[] =>
  terms.map((term, index) => ({ term, relevance: 1 - index / 100 }));

export const makeRunInput = (
  pages: ICheckInput[],
  keywords: ISelectedKeyword[][] = pages.map(() => []),
): IRunInput => ({ pages, keywords });
