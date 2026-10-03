import {
  FLOOR_RATIO,
  KEYWORD_BUDGET_BASE,
  MAX_KEYWORDS,
  MAX_SUBSUME_GROWTH,
  MAX_KEYWORDS_PER_RUN,
  MAX_OVERLAP_RATIO,
  SUBSUME_RATIO,
  WORDS_PER_KEYWORD,
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

const tokenCount = (term: string) => term.split(' ').length;

/**
 * `shorter` sits inside `longer`, and `longer` is still a way of saying the same
 * thing rather than a sentence that happens to contain it.
 */
const contains = (longer: string, shorter: string) =>
  longer.length > shorter.length &&
  ` ${longer} `.includes(` ${shorter} `) &&
  tokenCount(longer) - tokenCount(shorter) <= MAX_SUBSUME_GROWTH;

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
 * How many keywords a page of this much prose may return. A short post has one
 * subject and a long guide may have several, and the old flat ceiling let every page
 * claim the same eight: the shorter the post, the larger the share of its list that
 * was the scoring scraping the bottom of its own text.
 */
export function keywordBudget(wordCount: number): number {
  const earned =
    KEYWORD_BUDGET_BASE + Math.floor(wordCount / WORDS_PER_KEYWORD);
  return Math.max(1, Math.min(MAX_KEYWORDS, earned));
}

/**
 * §10.4 step 11: the best keywords above FLOOR_RATIO of the top score, within the
 * page's budget, no two of them covering the same words and no more than
 * MAX_KEYWORDS_PER_RUN of them read out of one sentence. Nothing is added below the
 * floor — a page with one subject returns one keyword.
 */
export function selectKeywords(
  candidates: IScoredCandidate[],
  wordCount = Number.POSITIVE_INFINITY,
): ISelectedKeyword[] {
  const ranked = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term));
  if (ranked.length === 0) return [];

  const budget = keywordBudget(wordCount);
  const top = ranked[0].score;
  const chosen: ISelectedKeyword[] = [];
  const taken: ReadonlySet<string>[] = [];
  const perRun = new Map<number, number>();
  for (const candidate of ranked) {
    if (chosen.length >= budget) break;
    // Ranked descending: the first one under the floor ends the list.
    if (candidate.score < FLOOR_RATIO * top) break;
    const tokens = contentTokens(candidate.term);
    if (taken.some((other) => overlapping(tokens, other))) continue;
    const runs = [...(candidate.runs ?? [])];
    if (runs.some((run) => (perRun.get(run) ?? 0) >= MAX_KEYWORDS_PER_RUN))
      continue;
    // A bare word out of a sentence a keyword was already read from is that
    // keyword's leftover, not a second subject: `remove www from your url` also
    // yields `url`, `3 exercises ... google analytics` yields `exercises`, and
    // `7 reasons to come to yoastcon` yields `reasons`. The word that IS the page's
    // subject is unaffected — it ranks first, before any run is spoken for.
    if (tokenCount(candidate.term) === 1 && runs.some((run) => perRun.has(run)))
      continue;
    for (const run of runs) perRun.set(run, (perRun.get(run) ?? 0) + 1);
    chosen.push({ term: candidate.term, relevance: candidate.score / top });
    taken.push(tokens);
  }
  return chosen;
}
