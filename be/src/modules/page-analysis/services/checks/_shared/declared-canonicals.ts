import type { ICheckInput } from '../check.interface';
import { attribute } from './evidence';

/** One canonical the page declares, and where it declared it. */
export interface IDeclaredCanonical {
  url: string;
  source: 'head' | 'header';
}

/** `<target>; params` — one entry of a Link header. */
const LINK_ENTRY = /<([^>]*)>([^<]*)/g;
const REL_PARAM = /(?:^|;)\s*rel\s*=\s*(?:"([^"]*)"|([^;,\s]+))/i;

/**
 * Canonicals from a `Link` response header (RFC 8288), resolved against the page. Google
 * accepts `Link: <url>; rel="canonical"` as it accepts the tag, and a page that declares
 * its canonical only there is not missing one.
 */
function headerCanonicals(
  header: string | undefined,
  pageUrl: string,
): string[] {
  if (!header) return [];
  const urls: string[] = [];
  for (const [, target, params] of header.matchAll(LINK_ENTRY)) {
    const rel = REL_PARAM.exec(params);
    const tokens = (rel?.[1] ?? rel?.[2] ?? '').toLowerCase().split(/\s+/);
    if (!tokens.includes('canonical')) continue;
    try {
      const url = new URL(target.trim(), pageUrl);
      url.hash = '';
      urls.push(url.href);
    } catch {
      // A target that does not resolve declares nothing.
    }
  }
  return urls;
}

/**
 * Every canonical the page declares, `<head>` first, then the header, each distinct URL
 * once per source. The first is the one the page means; more than one distinct URL is a
 * conflict, which is CANONICAL_CONFLICT's to report.
 */
export function declaredCanonicals(page: ICheckInput): IDeclaredCanonical[] {
  return [
    ...page.parsed.canonicals.map((url) => ({ url, source: 'head' as const })),
    ...[...new Set(headerCanonicals(page.headers.link, page.finalUrl))].map(
      (url) => ({ url, source: 'header' as const }),
    ),
  ];
}

/** The declaration as the author wrote it, for a finding to quote. */
export function quoteCanonical({ url, source }: IDeclaredCanonical): string {
  return source === 'head'
    ? `<link rel="canonical" href="${attribute(url)}">`
    : `Link: <${url}>; rel="canonical"`;
}
