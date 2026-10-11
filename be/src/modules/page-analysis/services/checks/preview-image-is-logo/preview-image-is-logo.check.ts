import { logoKindOf } from '../_shared/logo-image';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The image the page names for itself — og:image, the article markup's image — is the
 * site's logo: the URL of a logo its structured data declares, or a file named logo.
 */
export const PREVIEW_IMAGE_IS_LOGO_CHECK = defineCheck(
  'PREVIEW_IMAGE_IS_LOGO',
  ({ parsed, finalUrl }) => {
    const named = [
      ...(parsed.openGraph['og:image']
        ? [{ url: parsed.openGraph['og:image'], from: 'og:image' }]
        : []),
      ...(parsed.articleMarkup?.images ?? []).map(({ url }) => ({
        url,
        from: `${parsed.articleMarkup!.type} image`,
      })),
    ];
    if (named.length === 0) return NOT_APPLICABLE;
    const found = named.flatMap(({ url, from }) => {
      const kind = logoKindOf(url, parsed.logos, finalUrl);
      if (kind === 'declared')
        return [`${from} ${url} — the logo the structured data declares`];
      return kind === 'named'
        ? [`${from} ${url} — a file named as a logo`]
        : [];
    });
    return found.length === 0
      ? PASS
      : fails({ count: found.length, evidence: evidence(found) });
  },
);
