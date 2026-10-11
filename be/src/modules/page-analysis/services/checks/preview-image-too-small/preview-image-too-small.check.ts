import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { logoKindOf } from '../_shared/logo-image';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const MIN_WIDTH = SEO_ISSUE_CATALOGUE.PREVIEW_IMAGE_TOO_SMALL.min;

/**
 * The image the page names for itself, against Discover's 1,200 px — measured from the
 * file, never from what the page declares. Declared sizes were tried first and are not
 * the image's: moz.com declares 1,050 px for an Article image it serves at 1,200, and
 * semrush.com sizes only the Article image, not the og:image beside it (2026-10).
 *
 * Not applicable when the page names no image, the file did not answer with an image
 * whose header gives its width, or the image is the site's logo.
 */
export const PREVIEW_IMAGE_TOO_SMALL_CHECK = defineCheck(
  'PREVIEW_IMAGE_TOO_SMALL',
  ({ previewImage, parsed, finalUrl }) => {
    if (!previewImage || previewImage.status !== 200 || !previewImage.width)
      return NOT_APPLICABLE;
    // A logo is PREVIEW_IMAGE_IS_LOGO's finding; that it is small too says nothing new.
    if (logoKindOf(previewImage.url, parsed.logos, finalUrl))
      return NOT_APPLICABLE;
    if (previewImage.width >= MIN_WIDTH) return PASS;
    const size = previewImage.height
      ? `${previewImage.width}×${previewImage.height}`
      : `${previewImage.width} wide`;
    return fails({
      value: previewImage.width,
      min: MIN_WIDTH,
      evidence: evidence([
        `${previewImage.url} — ${size} px, read from the file`,
      ]),
    });
  },
);
