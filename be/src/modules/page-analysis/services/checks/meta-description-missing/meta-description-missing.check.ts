import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

export const META_DESCRIPTION_MISSING_CHECK = defineCheck(
  'META_DESCRIPTION_MISSING',
  ({ parsed }) => {
    if (parsed.metaDescription !== null) return PASS;
    const ogDescription = parsed.openGraph['og:description'];
    return fails({
      evidence: evidence([
        'No <meta name="description"> in the document',
        ...(ogDescription
          ? [
              `<meta property="og:description" content="${attribute(ogDescription)}"> — written for sharing; search results do not read it`,
            ]
          : []),
      ]),
    });
  },
);
