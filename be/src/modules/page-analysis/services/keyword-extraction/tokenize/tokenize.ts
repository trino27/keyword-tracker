import { MIN_TOKEN_LENGTH } from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';

/** Sentence ends and clause breaks a keyword phrase must not cross. */
const SENTENCE_BREAK = /[.!?;:…()[\]{}"“”«»|/\\]+(?:\s|$)|[\r\n]+|\s[-–—]\s/u;
const DIGITS_ONLY = /^\p{N}+$/u;
/**
 * A word the page itself cut off for display, "Kent Walker, Presiden…" — the ellipsis
 * touches the word with no space. The fragment is not a word and must not reach the
 * candidates: blog.google returned `walker presiden` as a keyword.
 */
const TRUNCATED_WORD = /[\p{L}\p{N}]+(?:…|\.\.\.)/gu;

/**
 * A token that may sit INSIDE a phrase but never at either end: one character, or
 * digits only. Ending the run at one instead — what this did before — makes every
 * phrase built over a one-letter preposition unreachable, and Slavic prose is made of
 * them: `евро в посока`, `настаняване в рим` and `багаж с wizz air` were never
 * candidates, so nothing could subsume the fragments they left behind.
 */
export function isWeakToken(token: string): boolean {
  return token.length < MIN_TOKEN_LENGTH || DIGITS_ONLY.test(token);
}

/**
 * Splits text into runs of tokens. A run ends only at a sentence break, so a phrase
 * never crosses one; which tokens may BOUND a phrase is decided per candidate by
 * `isWeakToken`, not by cutting the run here.
 */
export function tokenize(text: string): string[][] {
  const runs: string[][] = [];
  for (const sentence of text
    .replace(TRUNCATED_WORD, ' ')
    .split(SENTENCE_BREAK)) {
    const run = normalizeText(sentence).split(' ').filter(Boolean);
    // A run of nothing but weak tokens can yield no candidate at all.
    if (run.some((token) => !isWeakToken(token))) runs.push(run);
  }
  return runs;
}
