import { siteKeyOf } from '@app/contracts';
import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';

/**
 * The only answers that prove an external link dead (plan D3, D25). Every other refusal —
 * 401, 403, 429, LinkedIn's 999, a 5xx, a timeout — is what an anti-bot wall answers a
 * crawler and never a reader, so it reads as "could not check". BROKEN_LINKS' catalogue
 * explanation names these in words, and a test ties the two together.
 */
export const EXTERNAL_BROKEN_STATUSES: readonly number[] = [404, 410];

/**
 * Answers that refuse this crawler rather than describe the page — authentication,
 * pay-per-crawl, a ban, a rate limit. Even on the site's own links they read as
 * "could not check": moz.com and css-tricks.com answered the crawl's own pace with 429,
 * and moz.com's checkout 403 (field audit, 2026-10-11; plan O3). The sitemap check
 * reads the same set as refusals.
 */
export const REFUSAL_STATUSES: readonly number[] = [401, 402, 403, 429];

export type TLinkVerdict = 'fine' | 'broken' | 'redirects' | 'unknown';

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};
const siteOf = (url: string): string | null => {
  const host = hostOf(url);
  return host === null ? null : siteKeyOf(host);
};

/**
 * What one link's outcome means (plan §10.1). Inside the site any 4xx or 5xx but a
 * refusal is broken and a redirect is its own finding; outside it only a 404, a 410 or a
 * name that does not exist is, and a redirect is the other site's arrangement.
 */
export function linkVerdictOf(
  outcome: TOutboundOutcome,
  internal: boolean,
): TLinkVerdict {
  if (outcome.kind === 'unchecked') return 'unknown';
  if (outcome.kind === 'failed') {
    if (outcome.failure === 'nxdomain') return 'broken';
    if (outcome.failure === 'tooManyRedirects')
      return internal ? 'broken' : 'unknown';
    return 'unknown';
  }
  const [first] = outcome.redirects;
  // A link to this site that redirects off it ends on another site's terms.
  const endsInside =
    internal && (!first || siteOf(first.url) === siteOf(outcome.finalUrl));
  // A detour through a third host — a consent or login wall, a geo gate — makes the
  // final answer the wall's: youtube.com's channels end on 404 through
  // consent.youtube.com for a crawler in the EU (field audit, 2026-10-11).
  const detour =
    first !== undefined &&
    outcome.redirects.some(
      ({ url }) =>
        hostOf(url) !== hostOf(first.url) &&
        hostOf(url) !== hostOf(outcome.finalUrl),
    );
  if (outcome.status >= 400) {
    if (detour || REFUSAL_STATUSES.includes(outcome.status)) return 'unknown';
    return endsInside || EXTERNAL_BROKEN_STATUSES.includes(outcome.status)
      ? 'broken'
      : 'unknown';
  }
  if (outcome.status >= 200 && outcome.status < 300)
    return internal && outcome.redirects.length > 0 ? 'redirects' : 'fine';
  return 'unknown';
}
