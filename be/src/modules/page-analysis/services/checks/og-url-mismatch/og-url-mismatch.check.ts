import { declaredCanonicals } from '../_shared/declared-canonicals';
import { attribute, evidence } from '../_shared/evidence';
import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * `og:url` against the address the page means: its canonical when it declares one, else
 * the address it was served at. The Open Graph protocol defines `og:url` as the object's
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
  const expected = declaredCanonicals(page)[0]?.url ?? page.finalUrl;
  return sameDocument(ogUrl, expected)
    ? PASS
    : fails({
        ogUrl,
        expected,
        evidence: evidence([
          `<meta property="og:url" content="${attribute(written)}">`,
          `${declaredCanonicals(page).length > 0 ? 'Canonical' : 'Served at'}: ${expected}`,
        ]),
      });
});
