import {
  FLOOR_RATIO,
  MAX_KEYWORDS,
  MAX_KEYWORDS_PER_RUN,
  MAX_OVERLAP_RATIO,
  SUBSUME_RATIO,
} from '../../../constants/keyword-scoring.constant';
import { isWeakToken } from '../tokenize/tokenize';

export interface IScoredCandidate {
  term: string;
  score: number;
  /** Ids of the runs of text the term was read from; see ICandidateStats.runs. */
  runs?: ReadonlySet<number>;
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

/** The words of a term that carry it; a one-letter particle or a number does not. */
const contentTokens = (term: string): ReadonlySet<string> =>
  new Set(term.split(' ').filter((token) => !isWeakToken(token)));

/**
 * Two terms say the same thing when most of the smaller one's words are in the other.
 * Subsumption sees `южна африка` inside `южна африка без виза`; it cannot see that
 * `африка без виза` and `пътуват до южна` are the same sentence read through a
 * different window, and those took three of five slots.
 */
function overlapping(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  const smaller = Math.min(a.size, b.size);
  if (smaller === 0) return false;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / smaller >= MAX_OVERLAP_RATIO;
}

/**
 * §10.4 step 11: the best keywords above FLOOR_RATIO of the top score, up to
 * MAX_KEYWORDS, no two of them covering the same words and no more than
 * MAX_KEYWORDS_PER_RUN of them read out of one sentence. Nothing is added below the
 * floor — a page with one subject returns one keyword.
 */
export function selectKeywords(
  candidates: IScoredCandidate[],
): ISelectedKeyword[] {
  const ranked = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));
  if (ranked.length === 0) return [];

  const top = ranked[0].score;
  const chosen: ISelectedKeyword[] = [];
  const taken: ReadonlySet<string>[] = [];
  const perRun = new Map<number, number>();
  for (const candidate of ranked) {
    if (chosen.length >= MAX_KEYWORDS) break;
    // Ranked descending: the first one under the floor ends the list.
    if (candidate.score < FLOOR_RATIO * top) break;
    const tokens = contentTokens(candidate.term);
    if (taken.some((other) => overlapping(tokens, other))) continue;
    const runs = [...(candidate.runs ?? [])];
    if (runs.some((run) => (perRun.get(run) ?? 0) >= MAX_KEYWORDS_PER_RUN))
      continue;
    for (const run of runs) perRun.set(run, (perRun.get(run) ?? 0) + 1);
    chosen.push({ term: candidate.term, relevance: candidate.score / top });
    taken.push(tokens);
  }
  return chosen;
}
