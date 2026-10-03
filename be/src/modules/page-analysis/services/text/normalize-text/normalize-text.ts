/**
 * An apostrophe and the contraction or possessive it introduces. Replacing it with a
 * space — what dropping all punctuation did — leaves the suffix behind as a token of
 * its own, and the stray letter then rides into the keyword: "Facebook's algorithm
 * changes" was stored as `facebook s algorithm changes`, "A Beginner's Step-by-Step
 * Guide" as `beginner s step`, "Let's play" as `let s play`. The stem alone is the
 * word the page is about, and the suffixes are a closed set, so they can simply go.
 */
const CONTRACTION = /['’‘`´]\s*(?:s|t|re|ve|ll|d|m|em|n)\b/giu;
/** A remaining apostrophe is inside a name — "o'brien", "l'oreal" — and closes it up. */
const APOSTROPHE = /['’‘`´]/gu;

/**
 * The one text normalization of the analysis (plan §10.4 step 1): NFKC, lower case,
 * contractions folded into their stem, everything that is not a letter or digit
 * becomes a space, spaces collapse. Keyword terms are stored in this form, and a
 * title is compared to a keyword in this form.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(CONTRACTION, '')
    .replace(APOSTROPHE, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
