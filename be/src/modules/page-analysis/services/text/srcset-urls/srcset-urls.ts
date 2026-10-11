/**
 * The URL of each candidate in a `srcset`, in order, as the HTML standard's parser reads
 * them: a URL runs to the first whitespace, and only a comma AFTER it ends the candidate.
 * Splitting on every comma broke an image CDN's address apart — Cloudinary writes
 * `/upload/w_400,h_300/IMG_1234.jpg 400w`, which read as the file name `w_400`.
 *
 * A URL that ends in commas has them stripped and ends its candidate there, as the
 * standard says; descriptors are skipped up to the next comma outside parentheses.
 */
export function srcsetUrls(srcset: string | null | undefined): string[] {
  const urls: string[] = [];
  const text = srcset ?? '';
  let at = 0;
  while (at < text.length) {
    while (at < text.length && /[\s,]/.test(text[at])) at++;
    const start = at;
    while (at < text.length && !/\s/.test(text[at])) at++;
    let url = text.slice(start, at);
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      let depth = 0;
      while (at < text.length && (text[at] !== ',' || depth > 0)) {
        if (text[at] === '(') depth++;
        else if (text[at] === ')' && depth > 0) depth--;
        at++;
      }
    }
    if (url) urls.push(url);
  }
  return urls;
}
