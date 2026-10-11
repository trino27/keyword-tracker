import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Content images with a srcset and no src: no fallback for a crawler or a browser that
 * does not read srcset, which Google asks every responsive image to have.
 *
 * The file's format is NOT judged by its extension. An image CDN converts on the way out:
 * shopify.com's `.heic` uploads are answered as JPEG to any client, Googlebot-Image's
 * name included, and as WebP to a browser that accepts it (2026-10) — so a HEIC
 * extension is no HEIC file, and reporting one would be wrong about the page.
 *
 * An image with no src that a script fills from `data-src` is not reported either:
 * Google renders the page and sees what the script sets.
 */
export const IMAGES_NOT_INDEXABLE_CHECK = defineCheck(
  'IMAGES_NOT_INDEXABLE',
  ({ parsed }) => {
    if (parsed.images.length === 0) return NOT_APPLICABLE;
    const reasons = parsed.images.flatMap((image) =>
      !image.src?.trim() && image.srcset
        ? [
            `<img srcset="${attribute(image.srcset)}"> — srcset with no src fallback`,
          ]
        : [],
    );
    return reasons.length === 0
      ? PASS
      : fails({
          count: reasons.length,
          total: parsed.images.length,
          evidence: evidence(reasons),
        });
  },
);
