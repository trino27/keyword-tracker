import type { IIconLink } from '../../interfaces/parsed-page.interface';
import { attribute, evidence } from '../checks/_shared/evidence';
import { readImageHeader } from '../checks/_shared/image-header';
import {
  SITE_NOT_APPLICABLE,
  SITE_PASS,
  type IFaviconAnswer,
  type IHomePage,
  type TSiteCheck,
  type TSiteVerdict,
} from './site-check.interface';

/** The favicon formats Google Search supports, by file format. */
const FAVICON_FORMATS: ReadonlySet<string> = new Set([
  'bmp',
  'gif',
  'ico',
  'png',
  'jpeg',
  'ppm',
  'tiff',
]);

/** The same formats as a `type` attribute or a file extension names them. */
const FAVICON_TYPES: Readonly<Record<string, string>> = {
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/ico': 'ico',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const FAVICON_EXTENSIONS: Readonly<Record<string, string>> = {
  ico: 'ico',
  png: 'png',
  gif: 'gif',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  bmp: 'bmp',
  tif: 'tiff',
  tiff: 'tiff',
  ppm: 'ppm',
  svg: 'svg',
  webp: 'webp',
  avif: 'avif',
};

/** Google's minimum: a square of at least 8×8 px. */
const FAVICON_MIN_SIDE = 8;

/** The format an icon link declares — by `type`, else by extension; null when it says none. */
function declaredFormatOf(icon: IIconLink): string | null {
  if (icon.type) return FAVICON_TYPES[icon.type] ?? icon.type;
  const extension = /\.([a-z0-9]+)$/i.exec(new URL(icon.href).pathname)?.[1];
  return extension
    ? (FAVICON_EXTENSIONS[extension.toLowerCase()] ?? null)
    : null;
}

/**
 * The icon Google can use, and the address the crawl fetches to judge it: the first one
 * the home page declares in a format Google supports, or whose format the link does not
 * say. A home page declaring none is judged by `/favicon.ico`, the address browsers fall
 * back to: ghost.org and moz.com declare no icon at all and serve one there (2026-10).
 * Null when every declared icon is in a format Google does not support.
 *
 * An icon inlined as a `data:` URI is no address Googlebot-Image can crawl, so it counts
 * as no icon declared: asked as one, it read as "unreachable" with the whole URI quoted.
 */
export function faviconTargetOf(
  home: Pick<IHomePage, 'url' | 'icons'>,
): { href: string; icon: IIconLink | null } | null {
  const icons = home.icons.filter(({ href }) => /^https?:/i.test(href));
  if (icons.length === 0)
    return { href: new URL('/favicon.ico', home.url).href, icon: null };
  const icon = icons.find((candidate) => {
    const format = declaredFormatOf(candidate);
    return format === null || FAVICON_FORMATS.has(format);
  });
  return icon ? { href: icon.href, icon } : null;
}

/**
 * Formats a server may choose for an image when the request accepts any — dev.to's
 * image CDN answers a .png address with WebP (2026-10). What Googlebot-Image would be
 * sent is not known, so a negotiated format is no finding.
 */
const NEGOTIATED_FORMATS: ReadonlySet<string> = new Set(['webp', 'avif']);

const quoteIcon = (icon: IIconLink) =>
  `<link rel="${icon.rel}" href="${attribute(icon.href)}"${icon.type ? ` type="${icon.type}"` : ''}${icon.sizes ? ` sizes="${attribute(icon.sizes)}"` : ''}>`;

const failing = (
  reason: string,
  lines: string[],
  more: Record<string, unknown> = {},
): TSiteVerdict => ({
  outcome: 'fails',
  details: { reason, ...more, evidence: evidence(lines) },
});

/** What keeps Google from using one fetched icon, or null when it can. */
function problemOf(
  answer: IFaviconAnswer,
  subject: string,
  declared: boolean,
): TSiteVerdict | null {
  if (answer.blockedBy)
    return failing('blocked', [
      subject,
      `robots.txt keeps Googlebot-Image from it: ${answer.blockedBy}`,
    ]);
  if (answer.status !== 200)
    return failing(declared ? 'unreachable' : 'none', [
      subject,
      `GET ${answer.url} answered ${answer.status ?? 'nothing'}`,
    ]);
  const header = readImageHeader(answer.head);
  if (
    header &&
    !FAVICON_FORMATS.has(header.format) &&
    !NEGOTIATED_FORMATS.has(header.format)
  )
    return failing(declared ? 'format' : 'none', [
      subject,
      header.format === 'html'
        ? `${answer.url} answered an HTML page, not an image`
        : `${answer.url} is a ${header.format.toUpperCase()} file, a format Google Search does not support`,
    ]);
  if (header?.width && header.height) {
    const size = `${header.width}×${header.height} px`;
    const measured = { width: header.width, height: header.height };
    if (header.width !== header.height)
      return failing(
        'notSquare',
        [subject, `${answer.url} is ${size}, not square`],
        measured,
      );
    if (header.width < FAVICON_MIN_SIDE)
      return failing(
        'tooSmall',
        [subject, `${answer.url} is ${size}`],
        measured,
      );
  }
  return null;
}

/** The verdict with what the root file answered added to its evidence. */
function withFallback(
  verdict: TSiteVerdict,
  fallback: IFaviconAnswer | null,
): TSiteVerdict {
  if (verdict.outcome !== 'fails' || !fallback) return verdict;
  const said = problemOf(fallback, '', false);
  const why =
    said?.outcome === 'fails' ? said.details.evidence.slice(-1)[0] : '';
  return {
    ...verdict,
    details: {
      ...verdict.details,
      evidence: evidence([
        ...verdict.details.evidence,
        `The fallback ${fallback.url} is no icon either: ${why}`,
      ]),
    },
  };
}

/**
 * The favicon as Google would read it: declared on the home page (or served at
 * /favicon.ico), in a supported format, open to Googlebot-Image, answered with an image,
 * square and at least 8×8 px. A declared icon that fails is no finding while the root
 * /favicon.ico is a usable icon — beachplumbingservices.com declares a theme icon that is
 * gone and serves one at the root, oborot.ru declares only an SVG and does the same
 * (2026-10) — because what the reader sees in results is then not in doubt. Not
 * applicable when the home page could not be read, or the icon could not be fetched
 * because this crawler's own robots.txt group forbids it.
 */
export const faviconInvalid: TSiteCheck = (input) => {
  const { home, favicon, faviconFallback } = input;
  if (!home) return SITE_NOT_APPLICABLE;
  const fallbackUsable =
    faviconFallback !== null && problemOf(faviconFallback, '', false) === null;
  const target = faviconTargetOf(home);
  if (!target)
    return fallbackUsable
      ? SITE_PASS
      : withFallback(
          failing('format', [
            ...home.icons.map(quoteIcon),
            'Every icon is in a format Google Search does not support (BMP, GIF, ICO, PNG, JPEG, PPM, TIFF)',
          ]),
          faviconFallback,
        );
  if (!favicon || favicon.url !== target.href) return SITE_NOT_APPLICABLE;
  const subject = target.icon
    ? quoteIcon(target.icon)
    : `${home.url} declares no <link rel="icon">, so ${target.href} was asked`;
  const problem = problemOf(favicon, subject, target.icon !== null);
  if (!problem || fallbackUsable) return SITE_PASS;
  return withFallback(problem, faviconFallback);
};

/** Case, spacing and punctuation aside: "Search Engine Land" = "search-engine land". */
const sameName = (a: string, b: string) => {
  const key = (name: string) =>
    name.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
  return key(a) === key(b);
};

/** A WebSite node with a name on the home page: Google's way to state the site name. */
export const siteNameNotDeclared: TSiteCheck = ({ home }) => {
  if (!home) return SITE_NOT_APPLICABLE;
  if (home.websiteNames.length > 0) return SITE_PASS;
  return {
    outcome: 'fails',
    details: {
      evidence: evidence([
        `${home.url} carries no WebSite structured data with a name`,
        ...(home.ogSiteName
          ? [
              `<meta property="og:site_name" content="${attribute(home.ogSiteName)}"> is there`,
            ]
          : []),
      ]),
    },
  };
};

/**
 * The WebSite name against og:site_name — the two sources of the site name Google names
 * first — unless one of them is among the markup's alternate names.
 */
export const siteNameInconsistent: TSiteCheck = ({ home }) => {
  if (!home || home.websiteNames.length === 0 || !home.ogSiteName)
    return SITE_NOT_APPLICABLE;
  const og = home.ogSiteName;
  const names = home.websiteNames.flatMap(({ name, alternateNames }) => [
    name,
    ...alternateNames,
  ]);
  if (names.some((name) => sameName(name, og))) return SITE_PASS;
  return {
    outcome: 'fails',
    details: {
      names: home.websiteNames.map(({ name }) => name),
      ogSiteName: og,
      evidence: evidence([
        ...home.websiteNames.map(
          ({ name, alternateNames }) =>
            `WebSite name: "${name}"${alternateNames.length > 0 ? `, alternateName: ${alternateNames.map((n) => `"${n}"`).join(', ')}` : ''}`,
        ),
        `<meta property="og:site_name" content="${attribute(og)}">`,
      ]),
    },
  };
};
