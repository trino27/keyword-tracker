import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import { collectCandidates } from '../collect-candidates/collect-candidates';
import { idfFactor, pageScore } from '../score-candidates/score-candidates';
import {
  selectKeywords,
  subsume,
  type ISelectedKeyword,
} from '../select-keywords/select-keywords';

export interface IKeywordSource {
  url: string;
  parsed: IParsedPage;
}

/**
 * The keywords of every page of one run (§10.4). Computed for the run as a whole:
 * the IDF step needs to know which terms every page shares.
 */
export function extractKeywords(
  pages: IKeywordSource[],
  siteKey: string,
): ISelectedKeyword[][] {
  const perPage = pages.map((page) =>
    collectCandidates({ url: page.url, parsed: page.parsed, siteKey }),
  );

  const documentFrequency = new Map<string, number>();
  for (const candidates of perPage) {
    for (const term of candidates.keys())
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }

  return perPage.map((candidates) => {
    const scored = [...candidates].map(([term, stats]) => ({
      term,
      score:
        pageScore(stats) *
        idfFactor(pages.length, documentFrequency.get(term) ?? 1),
    }));
    return selectKeywords(subsume(scored));
  });
}
