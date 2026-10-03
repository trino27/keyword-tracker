import { siteKeyOf } from '../site-key/site-key-of.util.js';

export type TWebsiteUrlRejection =
  | 'invalid'
  | 'unsupported_scheme'
  | 'credentials'
  | 'ip_address'
  | 'local_host';

export type TParsedWebsiteUrl =
  | { ok: true; origin: string; siteKey: string }
  | { ok: false; reason: TWebsiteUrlRejection };

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * The one rule for a client's website address — the backend validates with it and the
 * frontend uses it to find the existing client on a "you already track this site" answer.
 *
 * Accepts a bare host ("yoast.com" becomes https://yoast.com), keeps only the origin
 * (path, query and default port dropped), and refuses anything the crawler must never
 * be pointed at: other schemes, credentials, IP literals, localhost and single-label
 * intranet hosts.
 */
export function parseWebsiteUrl(input: string): TParsedWebsiteUrl {
  const trimmed = input.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'invalid' };

  let url: URL;
  try {
    url = new URL(HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_scheme' };
  }
  if (url.username || url.password) return { ok: false, reason: 'credentials' };

  const hostname = url.hostname.toLowerCase();
  if (hostname.startsWith('[') || IPV4.test(hostname)) {
    return { ok: false, reason: 'ip_address' };
  }
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    !hostname.includes('.')
  ) {
    return { ok: false, reason: 'local_host' };
  }

  const host = url.port ? `${hostname}:${url.port}` : hostname;
  return {
    ok: true,
    origin: `${url.protocol}//${host}`,
    siteKey: siteKeyOf(hostname),
  };
}
