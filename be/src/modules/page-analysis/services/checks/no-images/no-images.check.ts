import { attribute, evidence } from '../_shared/evidence';
import { isLongText } from '../_shared/long-text';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * An `<img>` in the main content passes, and so does the featured image wherever the
 * theme puts it: a hero above the article is outside the content the extractor keeps,
 * and a post that opens with one is not a post without images. So does an embed — a
 * CodePen demo or a video player shows the reader more than a picture would; on
 * css-tricks a post with five live demos and no `<img>` was reported as imageless.
 *
 * A share image shown only as a CSS background still fails — Google does not index CSS
 * images — and the evidence says that is where it is, rather than that it is not shown.
 *
 * Not applicable to a short post, which can stand without a picture.
 */
export const NO_IMAGES_CHECK = defineCheck('NO_IMAGES', ({ parsed }) => {
  if (!isLongText(parsed)) return NOT_APPLICABLE;
  if (
    parsed.images.length > 0 ||
    parsed.embeds > 0 ||
    parsed.featuredImage !== null
  )
    return PASS;
  const shareImage = parsed.shareImage;
  return fails({
    words: parsed.wordCount,
    evidence: evidence([
      `${parsed.wordCount} words in the main content, and no <img> among them`,
      shareImage === null
        ? 'No featured image either: the page declares no og:image'
        : `<meta property="og:image" content="${attribute(shareImage)}"> — ${
            parsed.shareImageAsBackground
              ? 'shown only as a CSS background-image, which Google does not index'
              : 'not shown on the page'
          }`,
    ]),
  });
});
