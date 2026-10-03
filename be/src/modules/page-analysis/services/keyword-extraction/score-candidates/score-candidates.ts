import {
  FIELD_WEIGHTS,
  METADATA_BONUS,
  MULTI_FIELD_BONUS,
  NGRAM_FACTOR,
  STRONG_FIELDS,
} from '../../../constants/keyword-scoring.constant';
import type { ICandidateStats } from '../collect-candidates/collect-candidates';

/**
 * A candidate's score on its own page (§10.4 steps 5–8): field presence weights, body
 * frequency on a log scale, a bonus for appearing in several deliberate fields and for
 * the page's own declared keywords, and a slight preference for phrases.
 */
export function pageScore(stats: ICandidateStats): number {
  let score = 0;
  let strongFields = 0;
  for (const field of stats.fields) {
    if (field !== 'body') score += FIELD_WEIGHTS[field];
    if (STRONG_FIELDS.has(field)) strongFields += 1;
  }
  if (stats.bodyTf > 0)
    score += FIELD_WEIGHTS.body * Math.log(1 + stats.bodyTf);
  score *= 1 + MULTI_FIELD_BONUS * Math.max(0, strongFields - 1);
  if (stats.declared) score *= METADATA_BONUS;
  return score * (NGRAM_FACTOR[stats.tokens] ?? 1);
}

/**
 * The corpus penalty (§10.4 step 9): a term on every page of the run is the site's
 * vocabulary — its name, its product — not what one page is about.
 * N = 1 → 1; on all of 15 pages → ln 2 / ln 16 = 0.25.
 */
export function idfFactor(
  pageCount: number,
  documentFrequency: number,
): number {
  if (pageCount <= 1) return 1;
  return Math.log(1 + pageCount / documentFrequency) / Math.log(1 + pageCount);
}
