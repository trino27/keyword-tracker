/**
 * Whether an og:image value is an address a share crawler can fetch: a full http(s) URL
 * with a host. The Open Graph protocol asks for "an image URL", and the crawlers that
 * read it (Facebook, LinkedIn, X) fetch it as written, without resolving it against the
 * page. smashingmagazine.com writes `content="https:"` on some pages — a tag that is
 * there and names nothing.
 */
export function isShareImageAddress(content: string): boolean {
  try {
    const url = new URL(content);
    return /^https?:$/.test(url.protocol) && url.hostname !== '';
  } catch {
    return false;
  }
}
