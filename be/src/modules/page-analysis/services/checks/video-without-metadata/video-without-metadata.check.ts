import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A page showing a video that declares nothing about it: no VideoObject in its
 * structured data, JSON-LD or Microdata, and no og:video. A video sitemap would count
 * too, and cannot be seen from the page, which the catalogue's explanation says.
 */
export const VIDEO_WITHOUT_METADATA_CHECK = defineCheck(
  'VIDEO_WITHOUT_METADATA',
  ({ parsed }) => {
    if (parsed.videos.length === 0) return NOT_APPLICABLE;
    const declared =
      [...parsed.jsonLd.types, ...parsed.microdata.types].includes(
        'VideoObject',
      ) ||
      Object.keys(parsed.openGraph).some(
        (property) =>
          property === 'og:video' || property.startsWith('og:video:'),
      );
    return declared
      ? PASS
      : fails({
          count: parsed.videos.length,
          evidence: evidence([
            ...parsed.videos,
            'No VideoObject structured data and no og:video on the page',
          ]),
        });
  },
);
