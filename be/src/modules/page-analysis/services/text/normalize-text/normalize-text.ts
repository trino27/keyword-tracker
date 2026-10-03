/**
 * The one text normalization of the analysis (plan §10.4 step 1): NFKC, lower case,
 * everything that is not a letter or digit becomes a space, spaces collapse. Keyword
 * terms are stored in this form, and a title is compared to a keyword in this form.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
