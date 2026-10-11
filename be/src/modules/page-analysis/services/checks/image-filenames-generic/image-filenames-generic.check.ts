import { attribute, evidence } from '../_shared/evidence';
import { fileNameOf, shownUrlOf, stemOf } from '../_shared/image-file';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Names a camera, a phone or a screenshot tool gives a file by default: IMG_1234,
 * DSC01234, DSCN, DSCF, PXL_20260101_…, MVIMG, GOPR, DJI_, a WhatsApp image, a
 * screenshot with its date. A name only a person could have chosen never matches.
 *
 * The screenshot tail is a run of parts — a number, at, в, am, pm, a "(2)" — each after
 * its separator, and every part starts with its own character, so a name that does not
 * match fails in linear time: a crawled site chooses its file names.
 */
const DEVICE_DEFAULT =
  /^(?:img|dsc[nf]?|pxl|mvimg|gopr|dji|sam)[-_ ]?\d{3,}(?:[-_ ]\d+)*(?:[-_ ]?(?:\(\d+\)|copy|edited|scaled))*$|^(?:whatsapp[-_ ]image|screenshot|screen[-_ ]?shot|снимок[-_ ]экрана)(?:[-_ ]+(?:\d[\d.]*|at|в|am|pm)|[-_ ]*\(\d+\))*$/i;

/**
 * Placeholders: image1, photo, untitled-3, download (50). A bare number is not one, for
 * all that Google names 1.jpg: a platform numbers files by id — moz.com serves its
 * authors' photos as /user/photo/10.jpg (2026-10) — and the author chose nothing.
 */
const PLACEHOLDER =
  /^(?:image|img|photo|picture|pic|untitled|unnamed|download|file|изображение|фото)[-_ ]?\(?\d{0,3}\)?$/i;

const isGeneric = (stem: string) =>
  stem.length > 0 && (DEVICE_DEFAULT.test(stem) || PLACEHOLDER.test(stem));

/**
 * Content images whose file names say nothing about them, as a camera or a placeholder
 * leaves them. Hashed names (`a3f9c0…`, a CDN's `1*Xy7…`) are not reported: a platform
 * generates them and the author can neither see nor change them.
 *
 * Not applicable when no content image has a file name to read — inline `data:` images,
 * addresses that end in a slash.
 */
export const IMAGE_FILENAMES_GENERIC_CHECK = defineCheck(
  'IMAGE_FILENAMES_GENERIC',
  ({ parsed }) => {
    const named = parsed.images.flatMap((image) => {
      const url = shownUrlOf(image);
      const name = url ? fileNameOf(url) : null;
      return url && name ? [{ url, name }] : [];
    });
    if (named.length === 0) return NOT_APPLICABLE;
    const generic = named.filter(({ name }) => isGeneric(stemOf(name)));
    return generic.length === 0
      ? PASS
      : fails({
          count: generic.length,
          total: named.length,
          evidence: evidence(
            generic.map(
              ({ url, name }) => `<img src="${attribute(url)}"> — ${name}`,
            ),
          ),
        });
  },
);
