import { MIN_TOKEN_LENGTH } from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';

/** Sentence ends and clause breaks a keyword phrase must not cross. */
const SENTENCE_BREAK = /[.!?;:…()[\]{}"“”«»|/\\]+(?:\s|$)|[\r\n]+|\s[-–—]\s/u;
const DIGITS_ONLY = /^\p{N}+$/u;

/**
 * Splits text into runs of usable tokens. A run ends at a sentence break and at any
 * token that cannot be part of a keyword (one character, digits only), so no
 * candidate is ever stitched together across one.
 */
export function tokenize(text: string): string[][] {
  const runs: string[][] = [];
  for (const sentence of text.split(SENTENCE_BREAK)) {
    let run: string[] = [];
    for (const token of normalizeText(sentence).split(' ')) {
      if (token.length >= MIN_TOKEN_LENGTH && !DIGITS_ONLY.test(token)) {
        run.push(token);
      } else if (run.length > 0) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length > 0) runs.push(run);
  }
  return runs;
}
