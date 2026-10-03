/**
 * An apostrophe and the contraction or possessive it introduces. Replacing it with a
 * space — what dropping all punctuation did — leaves the suffix behind as a token of
 * its own, and the stray letter then rides into the keyword: "Facebook's algorithm
 * changes" was stored as `facebook s algorithm changes`, "A Beginner's Step-by-Step
 * Guide" as `beginner s step`, "Let's play" as `let s play`. The stem alone is the
 * word the page is about, and the suffixes are a closed set, so they can simply go.
 */
const CONTRACTION = /['’‘`´]\s*(?:s|t|re|ve|ll|d|m|em|n)\b/giu;

/**
 * The other way round: in French the particle comes FIRST and the word after the
 * apostrophe is the one that carries the meaning. Closing the gap fused them, and a
 * Ratehub post in Quebec French was filed under `sest améliorée` and `labordabilité`.
 * The particles are a closed set of one or two letters, and requiring a word boundary
 * before one is what tells `l'abordabilité` from the English possessive in
 * `the dogs' bowls`, where the s is the end of a longer word.
 */
const ELISION = /\b(?:l|d|j|n|m|t|s|c|qu)['’‘`´]/giu;

/** A remaining apostrophe is inside a name — "o'brien", "l'oreal" — and closes it up. */
const APOSTROPHE = /['’‘`´]/gu;

/**
 * The one text normalization of the analysis (plan §10.4 step 1): NFKC, lower case,
 * elisions and contractions reduced to the word they carry, everything that is not a
 * letter or digit becomes a space, spaces collapse. Keyword terms are stored in this
 * form, and a title is compared to a keyword in this form.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(ELISION, ' ')
    .replace(CONTRACTION, '')
    .replace(APOSTROPHE, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
