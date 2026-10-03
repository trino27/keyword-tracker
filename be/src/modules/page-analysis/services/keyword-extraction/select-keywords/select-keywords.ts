import {
  FLOOR_RATIO,
  MAX_KEYWORDS,
  MIN_KEYWORDS,
  SUBSUME_RATIO,
} from '../../../constants/keyword-scoring.constant';

export interface IScoredCandidate {
  term: string;
  score: number;
}

export interface ISelectedKeyword {
  term: string;
  /** score / the page's top score: the top keyword is 1. */
  relevance: number;
}

const contains = (longer: string, shorter: string) =>
  longer.length > shorter.length && ` ${longer} `.includes(` ${shorter} `);

/**
 * §10.4 step 10: "seo" gives way to "seo audit" when the phrase scores at least
 * SUBSUME_RATIO of the word — the phrase says the same and more.
 */
export function subsume(candidates: IScoredCandidate[]): IScoredCandidate[] {
  return candidates.filter(
    (candidate) =>
      !candidates.some(
        (other) =>
          contains(other.term, candidate.term) &&
          other.score >= SUBSUME_RATIO * candidate.score,
      ),
  );
}

/**
 * §10.4 step 11: the best up to MAX_KEYWORDS above FLOOR_RATIO of the top score; when
 * fewer than MIN_KEYWORDS clear the floor, the next best fill up to it.
 */
export function selectKeywords(
  candidates: IScoredCandidate[],
): ISelectedKeyword[] {
  const ranked = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));
  if (ranked.length === 0) return [];
  const top = ranked[0].score;
  const aboveFloor = ranked.filter((c) => c.score >= FLOOR_RATIO * top);
  const chosen =
    aboveFloor.length >= MIN_KEYWORDS
      ? aboveFloor.slice(0, MAX_KEYWORDS)
      : ranked.slice(0, MIN_KEYWORDS);
  return chosen.map(({ term, score }) => ({ term, relevance: score / top }));
}
