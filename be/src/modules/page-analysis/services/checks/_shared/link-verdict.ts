import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';

/**
 * The only answers that prove an external link dead (plan D3, D25). Every other refusal —
 * 401, 403, 429, LinkedIn's 999, a 5xx, a timeout — is what an anti-bot wall answers a
 * crawler and never a reader, so it reads as "could not check". BROKEN_LINKS' catalogue
 * explanation names these in words, and a test ties the two together.
 */
export const EXTERNAL_BROKEN_STATUSES: readonly number[] = [404, 410];

export type TLinkVerdict = 'fine' | 'broken' | 'redirects' | 'unknown';

/**
 * What one link's outcome means (plan §10.1). Inside the site any 4xx or 5xx is broken
 * and a redirect is its own finding; outside it only a 404, a 410 or a name that does
 * not exist is, and a redirect is the other site's arrangement.
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
  if (outcome.status >= 400)
    return internal || EXTERNAL_BROKEN_STATUSES.includes(outcome.status)
      ? 'broken'
      : 'unknown';
  if (outcome.status >= 200 && outcome.status < 300)
    return internal && outcome.redirects.length > 0 ? 'redirects' : 'fine';
  return 'unknown';
}
