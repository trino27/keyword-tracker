import { fileNameOf, stemOf } from './image-file';

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
 * Whether an image is the site's logo: the URL of a logo the structured data declares
 * (`'declared'`), a file named as one (`'named'`), or neither (null). Shared because two
 * checks ask it — the one reporting a logo as the page image, and the size check, which
 * says nothing of an image the first one already reports.
 */
export function logoKindOf(
  url: string,
  logos: readonly string[],
  base: string,
): 'declared' | 'named' | null {
  const key = normalized(url, base);
  if (key && logos.some((logo) => normalized(logo, base) === key))
    return 'declared';
  return namedLogo(url) ? 'named' : null;
}
