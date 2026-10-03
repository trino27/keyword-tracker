/**
 * The identity of "the same website": the lower-cased host (punycode, as `URL` gives
 * it) without a leading "www.". Subdomains other than www are different sites.
 */
export function siteKeyOf(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}
