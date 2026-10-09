import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The featured image — the <img> showing what og:image names, at the top of the post —
 * marked loading="lazy". Featured and not "the first content image": on the recorded
 * semrush posts the first content image is lazy on 18 of 21 and sits thousands of
 * words down the page, while the featured image is eager on every one. The featured
 * image is the one WordPress itself stopped lazy-loading for LCP's sake. Where it sits
 * is the extractor's to say (`featuredImage`); on the live posts Lighthouse was run on
 * in 2026-10, it agreed with every verdict.
 *
 * Not applicable when the page shows no featured image at the top.
 */
export const LCP_IMAGE_LAZY_LOADED_CHECK = defineCheck(
  'LCP_IMAGE_LAZY_LOADED',
  ({ parsed }) => {
    const image = parsed.featuredImage;
    if (!image) return NOT_APPLICABLE;
    return image.loading === 'lazy'
      ? fails({
          evidence: evidence([
            `${image.markup} — the featured image, loaded lazily`,
          ]),
        })
      : PASS;
  },
);
