import { RUN_BOILERPLATE_SHARE } from '../../../constants/keyword-scoring.constant';
import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import { normalizeText } from '../../text/normalize-text/normalize-text';
import {
  collectCandidates,
  titleSegments,
} from '../collect-candidates/collect-candidates';
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

/** Values this share of the run's pages repeat; never from a run of one page. */
function shared(counts: Map<string, number>, pageCount: number): Set<string> {
  const needed = Math.max(2, Math.ceil(pageCount * RUN_BOILERPLATE_SHARE));
  return new Set(
    [...counts].filter(([, seen]) => seen >= needed).map(([value]) => value),
  );
}

/**
 * Title tail segments most of the run repeats: the brand, and the section a CMS
 * appends to every headline. The first segment is never chrome — it is the page.
 */
function titleChromeOf(pages: IKeywordSource[]): Set<string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const segments = titleSegments(page.parsed.title ?? '').slice(1);
    for (const segment of new Set(segments.map(normalizeText))) {
      if (segment) counts.set(segment, (counts.get(segment) ?? 0) + 1);
    }
  }
  return shared(counts, pages.length);
}

/**
 * Declared keywords most of the run repeats. A page's own `keywords` are a real
 * signal — a Yoast focus keyphrase is the page's subject — but a news CMS puts its
 * rubric in the same field, and "International" or "Region National" on every story
 * would earn the declared bonus on every story.
 */
function taxonomyKeywordsOf(pages: IKeywordSource[]): Set<string> {
  const counts = new Map<string, number>();
  for (const page of pages) {
    const declared = [
      ...page.parsed.jsonLd.keywords,
      ...page.parsed.articleTags,
    ].map(normalizeText);
    for (const keyword of new Set(declared)) {
      if (keyword) counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }
  return shared(counts, pages.length);
}

/**
 * The keywords of every page of one run (§10.4). Computed for the run as a whole,
 * twice over: what the pages share tells a site's chrome from a page's subject BEFORE
 * scoring, and the IDF step damps what is left of it after.
 */
export function extractKeywords(
  pages: IKeywordSource[],
  siteKey: string,
): ISelectedKeyword[][] {
  const titleChrome = titleChromeOf(pages);
  const taxonomyKeywords = taxonomyKeywordsOf(pages);
  const perPage = pages.map((page) =>
    collectCandidates({
      url: page.url,
      parsed: page.parsed,
      siteKey,
      titleChrome,
      taxonomyKeywords,
    }),
  );

  const documentFrequency = new Map<string, number>();
  for (const candidates of perPage) {
    for (const term of candidates.keys())
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }

  return perPage.map((candidates) => {
    const scored = [...candidates].map(([term, stats]) => ({
      term,
      runs: stats.runs,
      score:
        pageScore(stats) *
        idfFactor(pages.length, documentFrequency.get(term) ?? 1),
    }));
    return selectKeywords(subsume(scored));
  });
}
