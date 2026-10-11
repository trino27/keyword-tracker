import { sameDocument } from './same-document';

/**
 * Whether `canonical` is the page's own address over plain HTTP: an https page naming
 * its http:// twin. That one fact is CANONICAL_TO_HTTP's; CANONICAL_MISMATCH and
 * CANONICAL_TARGET_BROKEN step aside for it (plan D32, D36).
 */
export function isHttpTwin(canonical: string, finalUrl: string): boolean {
  try {
    const url = new URL(canonical);
    if (url.protocol !== 'http:' || new URL(finalUrl).protocol !== 'https:')
      return false;
    url.protocol = 'https:';
    return sameDocument(url.href, finalUrl);
  } catch {
    return false;
  }
}
