import { fileNameOf, stemOf } from '../_shared/image-file';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** The address without its query, fragment or the case of its host, so two spellings meet. */
function normalized(url: string, base: string): string | null {
  try {
    const parsed = new URL(url, base);
    return `${parsed.host.toLowerCase()}${parsed.pathname}`;
  } catch {
    return null;
  }
}

/**
 * A file named as a logo: `logo.png`, `site-logo.svg`, `acme_logo_dark.png`. Three words
 * at most, so `new-logo-reveal-2026.jpg` — a post about a logo — is a picture, not one.
 */
function namedLogo(url: string): boolean {
  const name = fileNameOf(url);
  if (!name) return false;
  const words = stemOf(name)
    .toLowerCase()
    .split(/[-_.\s]+/)
    .filter(Boolean);
  return words.includes('logo') && words.length <= 3;
}

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
    const logos = new Set(
      parsed.logos.map((logo) => normalized(logo, finalUrl)).filter(Boolean),
    );
    const found = named.flatMap(({ url, from }) => {
      if (logos.has(normalized(url, finalUrl)))
        return [`${from} ${url} — the logo the structured data declares`];
      return namedLogo(url) ? [`${from} ${url} — a file named as a logo`] : [];
    });
    return found.length === 0
      ? PASS
      : fails({ count: found.length, evidence: evidence(found) });
  },
);
