import { MIN_TOKEN_LENGTH } from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';

/**
 * Sentence ends and clause breaks a keyword phrase must not cross. The comma is one of
 * them: css-tricks titles a post "What's !important #18: <geolocation>, Syntax
 * ::highlight()ing, named-feature(), and More", and a phrase free to cross its commas
 * was stored as `geolocation syntax highlight ing named` — one window over a list of
 * three unrelated features, read as though it were a subject. Requiring whitespace
 * after the mark is what keeps `1,000` and `e.g.` whole.
 */
const SENTENCE_BREAK = /[.,!?;:…()[\]{}"“”«»|/\\]+(?:\s|$)|[\r\n]+|\s[-–—]\s/u;
const DIGITS_ONLY = /^\p{N}+$/u;
/**
 * A word the page itself cut off for display, "Kent Walker, Presiden…" — the ellipsis
 * touches the word with no space. The fragment is not a word and must not reach the
 * candidates: blog.google returned `walker presiden` as a keyword.
 */
const TRUNCATED_WORD = /[\p{L}\p{N}]+(?:…|\.\.\.)/gu;

/**
 * A word a bracket cut in two with no space on either side — `::highlight()ing`, where
 * the page is writing code and the suffix belongs to the call before it. The tail is
 * the end of a word, not a word: left alone it reaches the candidates as `ing`, and a
 * token of three letters may bound a phrase. The head is kept and the tail goes, the
 * same way a word the page truncated goes — a fragment is not a term anyone searches
 * for.
 */
const SPLIT_WORD = /([\p{L}\p{N}]+)[()[\]{}]+[\p{L}\p{N}]+/gu;

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
 * A hyphen or slash INSIDE a written word — `HTTP/2`, `fan-out`, `data-driven`.
 *
 * Normalization turns it into a space, which is right for the words but loses that
 * they were one: `out` is a stop word and `2` is digits, neither may end a phrase, so
 * "What is HTTP/2?" was stored as `http` and the query fan-out section as `query
 * fan`. Both are different subjects from the one the page writes. Recording the join
 * lets a phrase end on the second half of a compound without letting it end on a
 * loose stop word.
 */
const INNER_GLUE = /[\p{L}\p{N}][-/][\p{L}\p{N}]/u;

/** One run of text, with the joins the normalization flattened. */
export interface ITokenRun {
  tokens: string[];
  /** `glued[i]`: token i was written as one word with token i-1. */
  glued: boolean[];
}

/**
 * Splits text into runs of tokens. A run ends only at a sentence break, so a phrase
 * never crosses one; which tokens may BOUND a phrase is decided per candidate by
 * `isWeakToken` and by `glued`, not by cutting the run here.
 *
 * Normalization runs per WRITTEN word rather than over the sentence, which is what
 * makes the join observable. Its own rules are all within a word, so the tokens come
 * out the same either way.
 */
export function tokenize(text: string): ITokenRun[] {
  const runs: ITokenRun[] = [];
  for (const sentence of text
    .replace(TRUNCATED_WORD, ' ')
    .replace(SPLIT_WORD, '$1 ')
    .split(SENTENCE_BREAK)) {
    const tokens: string[] = [];
    const glued: boolean[] = [];
    for (const word of (sentence ?? '').split(/\s+/).filter(Boolean)) {
      const parts = normalizeText(word).split(' ').filter(Boolean);
      const joined = INNER_GLUE.test(word);
      parts.forEach((part, index) => {
        tokens.push(part);
        glued.push(joined && index > 0);
      });
    }
    // A run of nothing but weak tokens can yield no candidate at all.
    if (tokens.some((token) => !isWeakToken(token)))
      runs.push({ tokens, glued });
  }
  return runs;
}
