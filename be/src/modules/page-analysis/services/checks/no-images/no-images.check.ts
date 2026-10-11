import { attribute, evidence } from '../_shared/evidence';
import { isLongText } from '../_shared/long-text';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * An `<img>` in the main content passes, and so does the featured image wherever the
 * theme puts it: a hero above the article is outside the content the extractor keeps,
 * and a post that opens with one is not a post without images.
 *
 * Not applicable to a short post, which can stand without a picture.
 */
export const NO_IMAGES_CHECK = defineCheck('NO_IMAGES', ({ parsed }) => {
  if (!isLongText(parsed)) return NOT_APPLICABLE;
  if (parsed.images.length > 0 || parsed.featuredImage !== null) return PASS;
  const ogImage = parsed.openGraph['og:image'];
  return fails({
    words: parsed.wordCount,
    evidence: evidence([
      `${parsed.wordCount} words in the main content, and no <img> among them`,
      ogImage
        ? `<meta property="og:image" content="${attribute(ogImage)}"> — not shown on the page`
        : 'No featured image either: the page declares no og:image',
    ]),
  });
});
