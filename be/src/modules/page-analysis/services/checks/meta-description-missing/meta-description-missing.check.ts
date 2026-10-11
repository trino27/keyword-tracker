import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** What the source shows, for each way a page can have no description Google reads. */
const GAP_EVIDENCE = {
  absent: 'No <meta name="description"> in the document',
  empty:
    '<meta name="description" content=""> — the tag is there, with no text',
  outsideHead:
    '<meta name="description"> sits outside <head>, where Google does not read it',
} as const;

export const META_DESCRIPTION_MISSING_CHECK = defineCheck(
  'META_DESCRIPTION_MISSING',
  ({ parsed }) => {
    if (parsed.metaDescription !== null) return PASS;
    const ogDescription = parsed.openGraph['og:description'];
    return fails({
      evidence: evidence([
        GAP_EVIDENCE[parsed.metaDescriptionGap ?? 'absent'],
        ...(ogDescription
          ? [
              `<meta property="og:description" content="${attribute(ogDescription)}"> — written for sharing; search results do not read it`,
            ]
          : []),
      ]),
    });
  },
);
