import { declaredCanonicals } from '../_shared/declared-canonicals';
import { isDevelopmentHost } from '../_shared/development-host';
import { attribute, evidence } from '../_shared/evidence';
import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * `og:url` against the page's own address, when its canonical agrees that this is the
 * page (or it declares none). A canonical naming another page is CANONICAL_MISMATCH's,
 * CANONICAL_TO_HTTP's or CANONICAL_TARGET_BROKEN's to settle; judging og:url against it
 * would contradict them, so the check is not applicable then. The Open Graph protocol defines `og:url` as the object's
 * canonical URL, so a share counted under one address and a search result under another
 * is two identities for one post.
 */
export const OG_URL_MISMATCH_CHECK = defineCheck('OG_URL_MISMATCH', (page) => {
  const written = page.parsed.openGraph['og:url'];
  if (!written) return NOT_APPLICABLE;
  let ogUrl: string;
  try {
    ogUrl = new URL(written, page.finalUrl).href;
  } catch {
    return NOT_APPLICABLE;
  }
  // A staging or preview og:url is DEVELOPMENT_HOST_REFERENCES's finding (plan D36).
  if (
    isDevelopmentHost(new URL(ogUrl).hostname, new URL(page.finalUrl).hostname)
  )
    return NOT_APPLICABLE;
  // A canonical naming another page is the canonical checks' to settle; comparing og:url
  // with it would ask the author to copy the very address those checks call wrong.
  const canonical = declaredCanonicals(page)[0]?.url;
  if (canonical && !sameDocument(canonical, page.finalUrl))
    return NOT_APPLICABLE;
  const expected = page.finalUrl;
  return sameDocument(ogUrl, expected)
    ? PASS
    : fails({
        ogUrl,
        expected,
        evidence: evidence([
          `<meta property="og:url" content="${attribute(written)}">`,
          `This page: ${expected}`,
        ]),
      });
});
