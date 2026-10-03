import { siteKeyOf } from './site-key-of.util.js';

/** True when the URL belongs to the website with this site key. */
export function isSameSite(url: string, siteKey: string): boolean {
  try {
    return siteKeyOf(new URL(url).hostname) === siteKey;
  } catch {
    return false;
  }
}
