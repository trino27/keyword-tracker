import { attribute, evidence } from '../_shared/evidence';
import { isShareImageAddress } from '../_shared/share-image';
import { defineCheck, fails, PASS } from '../check.interface';

const REQUIRED_OPEN_GRAPH = ['og:title', 'og:description', 'og:image'] as const;

/** The spellings of the share image, which the protocol calls identical. */
const SHARE_IMAGE_PROPERTIES = new Set([
  'og:image',
  'og:image:url',
  'og:image:secure_url',
]);

/**
 * The three tags a shared link's card is built from. An og:image that names no fetchable
 * address — `content="https:"` — is as missing as no tag, and is said so beside the tag.
 */
export const OG_TAGS_MISSING_CHECK = defineCheck(
  'OG_TAGS_MISSING',
  ({ parsed }) => {
    // og:image:url or og:image:secure_url stand for og:image (the protocol calls them
    // identical): parsed.shareImage is whichever the page declares.
    const unusableImage =
      parsed.shareImage !== null && !isShareImageAddress(parsed.shareImage);
    const missing = REQUIRED_OPEN_GRAPH.filter((property) =>
      property === 'og:image'
        ? parsed.shareImage === null || unusableImage
        : !(property in parsed.openGraph),
    );
    if (missing.length === 0) return PASS;
    const present = Object.entries(parsed.openGraph);
    return fails({
      missing,
      evidence: evidence(
        present.length > 0
          ? present.map(
              ([property, content]) =>
                `<meta property="${property}" content="${attribute(content)}"> — ${
                  unusableImage &&
                  SHARE_IMAGE_PROPERTIES.has(property) &&
                  content === parsed.shareImage
                    ? 'not a full image address, so no card shows it'
                    : 'present'
                }`,
            )
          : ['No og:* properties in the document'],
      ),
    });
  },
);
