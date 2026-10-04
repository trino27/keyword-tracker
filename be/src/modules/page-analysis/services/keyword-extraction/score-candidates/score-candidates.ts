import {
  ANCHORED_IDF_MAX_SHARE,
  ANCHORED_IDF_SHARE,
  ANCHOR_FIELDS,
  FIELD_WEIGHTS,
  METADATA_BONUS,
  MIN_UNANCHORED_TF,
  MULTI_FIELD_BONUS,
  NGRAM_FACTOR,
  STRONG_FIELDS,
} from '../../../constants/keyword-scoring.constant';
import type { ICandidateStats } from '../collect-candidates/collect-candidates';

/**
 * A term no heading, title or slug names, said once, is a span of prose rather than
 * a subject — "oh the wonders", "world will be joining". Four-word candidates made
 * these numerous enough to fill a list on any page whose own top score is modest.
 */
/** The page names the term where it names its subject: the title, the h1, the slug. */
export function isAnchored(stats: ICandidateStats): boolean {
  for (const field of stats.fields) if (ANCHOR_FIELDS.has(field)) return true;
  return false;
}

function isPassingMention(stats: ICandidateStats): boolean {
  if (stats.bodyTf >= MIN_UNANCHORED_TF) return false;
  return !isAnchored(stats);
}

/**
 * A candidate's score on its own page (§10.4 steps 5–8): field presence weights, body
 * frequency on a log scale, a bonus for appearing in several deliberate fields and for
 * the page's own declared keywords, and a preference for phrases over bare words.
 * Zero means the candidate is not a keyword at all, and selection drops it.
 */
export function pageScore(stats: ICandidateStats): number {
  if (isPassingMention(stats)) return 0;
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
  return score * ngramFactor(stats);
}

/**
 * The phrase preference, and the single-word damping spent only on the words it was
 * written against.
 *
 * Every bad bare word it answers was read out of an elliptical heading — `евро`,
 * `посока`, `national`, `ръчен` — a common word handed a title's whole weight while
 * the phrase it belongs to was never a candidate. A name is the other kind of single
 * word: `gutenberg`, `perplexity`, `wordpress` are what a person types into a search
 * box, and there is no phrase they are a fragment of.
 *
 * An ANCHORED word stays damped whether it is a name or not: the title's weight is
 * the thing being guarded against, and undamping it made `url` the top keyword of
 * "How to remove WWW from your URL" and `facebook` of "Traffic from Facebook is
 * decreasing", each over the phrase that says what the post is for.
 *
 * Yoast's "Should you update to WordPress 5.0?" is the page that separates them.
 * `gutenberg` — six times in 494 words, and in a subheading — scored 3.06 against a
 * floor of 4.20 purely for being one word, and the post about Gutenberg returned a
 * single keyword that was not it. Lifting every undamped single word instead let in
 * `drinks`, `noticed`, `direct` and `updating`, which is the junk the damping exists
 * for: the capitalisation is what tells the two apart.
 */
function ngramFactor(stats: ICandidateStats): number {
  if (stats.tokens === 1 && stats.properNoun && !isAnchored(stats)) return 1;
  return NGRAM_FACTOR[stats.tokens] ?? 1;
}

/**
 * The corpus penalty (§10.4 step 9): a term on every page of the run is the site's
 * vocabulary — its name, its product — not what one page is about.
 * N = 1 → 1; on all of 15 pages → ln 2 / ln 16 = 0.25.
 */
export function idfFactor(
  pageCount: number,
  documentFrequency: number,
  anchored = false,
): number {
  if (pageCount <= 1) return 1;
  const idf =
    Math.log(1 + pageCount / documentFrequency) / Math.log(1 + pageCount);
  const declared =
    anchored && documentFrequency <= pageCount * ANCHORED_IDF_MAX_SHARE;
  return declared ? 1 - ANCHORED_IDF_SHARE * (1 - idf) : idf;
}
