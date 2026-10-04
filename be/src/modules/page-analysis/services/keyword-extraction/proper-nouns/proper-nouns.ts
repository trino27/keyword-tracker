import { MIN_TOKEN_LENGTH } from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';

/** A word, apostrophes and hyphens included, as the prose writes it. */
const WORD = /\p{L}[\p{L}\p{N}'’-]*/gu;
/** What ends a sentence, so the next word is capitalised by grammar, not by name. */
const SENTENCE_END = /[.!?…]/u;

/**
 * The share of a word's mid-sentence occurrences that must be capitalised. A name
 * the article is about is written as one nearly every time; a word that happens to
 * open a quotation or a list item once is not.
 */
const PROPER_NOUN_SHARE = 0.6;

/**
 * The words the page's own prose capitalises where no sentence begins: `Gutenberg`,
 * `Perplexity`, `WordPress` — the names of products, tools and brands.
 *
 * It is the only evidence available here for telling a single word that is a subject
 * from one that is a common word said a few times. The run's IDF cannot: it sees
 * fifteen pages of one blog, where `drinks` and `gutenberg` are equally rare. Density
 * cannot either — on the recorded posts `drinks` (4 in 607 words) is three times
 * denser than `perplexity` (7 in 3296), and `perplexity` is the keyword.
 *
 * Read from the body only. A heading in Title Case capitalises every word in it, and
 * a title is where the bare words this guards against come from in the first place.
 *
 * In a language that capitalises all nouns — German — every noun qualifies, and
 * single words there fall back to the weight they carried before the damping. That is
 * the old behaviour, not a new failure.
 */
export function properNounsOf(blocks: string[]): ReadonlySet<string> {
  const capitalised = new Map<string, number>();
  const midSentence = new Map<string, number>();

  for (const block of blocks) {
    let previousEnd = 0;
    for (const match of block.matchAll(WORD)) {
      const raw = match[0];
      const index = match.index ?? 0;
      const gap = block.slice(previousEnd, index);
      const opensSentence = previousEnd === 0 || SENTENCE_END.test(gap);
      previousEnd = index + raw.length;
      if (opensSentence) continue;

      const word = normalizeText(raw);
      if (word.includes(' ') || word.length < MIN_TOKEN_LENGTH) continue;
      midSentence.set(word, (midSentence.get(word) ?? 0) + 1);
      if (raw[0] !== raw[0].toLowerCase())
        capitalised.set(word, (capitalised.get(word) ?? 0) + 1);
    }
  }

  const names = new Set<string>();
  for (const [word, seen] of midSentence) {
    if ((capitalised.get(word) ?? 0) >= PROPER_NOUN_SHARE * seen)
      names.add(word);
  }
  return names;
}
