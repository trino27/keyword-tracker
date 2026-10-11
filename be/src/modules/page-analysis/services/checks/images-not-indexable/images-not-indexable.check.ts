import { attribute, evidence } from '../_shared/evidence';
import { extensionOf, fileNameOf } from '../_shared/image-file';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Image formats a camera, a phone or an editor saves that Google Images does not list
 * among the ones it indexes (BMP, GIF, JPEG, PNG, WebP, SVG, AVIF). Only formats KNOWN
 * to be outside the list: an address without an extension, or an unfamiliar one, may
 * well serve a JPEG, and is not reported.
 */
const UNSUPPORTED_FORMATS: ReadonlySet<string> = new Set([
  'heic',
  'heif',
  'tif',
  'tiff',
  'jxl',
  'jp2',
  'j2k',
  'jpx',
  'psd',
  'raw',
  'cr2',
  'nef',
  'dng',
  'ico',
]);

/**
 * Content images Google cannot index: an `<img>` with a srcset and no src — no fallback
 * for a crawler that does not read srcset — or a file in a format Google Images does not
 * list. An image with no src that a script fills from `data-src` is not one of these:
 * Google renders the page and sees what the script sets.
 */
export const IMAGES_NOT_INDEXABLE_CHECK = defineCheck(
  'IMAGES_NOT_INDEXABLE',
  ({ parsed }) => {
    if (parsed.images.length === 0) return NOT_APPLICABLE;
    const reasons = parsed.images.flatMap((image) => {
      if (!image.src?.trim() && image.srcset)
        return [
          `<img srcset="${attribute(image.srcset)}"> — srcset with no src fallback`,
        ];
      const name = image.src ? fileNameOf(image.src) : null;
      const format = name ? extensionOf(name) : null;
      return format && UNSUPPORTED_FORMATS.has(format)
        ? [
            `<img src="${attribute(image.src!)}"> — .${format} is not a format Google Images indexes`,
          ]
        : [];
    });
    return reasons.length === 0
      ? PASS
      : fails({
          count: reasons.length,
          total: parsed.images.length,
          evidence: evidence(reasons),
        });
  },
);
