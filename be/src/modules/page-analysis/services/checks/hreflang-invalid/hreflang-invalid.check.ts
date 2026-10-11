import { declaredCanonicals } from '../_shared/declared-canonicals';
import { sameDocument } from '../_shared/same-document';
import { attribute, evidence } from '../_shared/evidence';
import { problemWith } from '../_shared/hreflang-code';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The defects a page can be shown to have on its own: a tag that is not a language Google
 * supports, an alternate URL written without its scheme (Google requires "fully-qualified"
 * ones), a tag outside `<head>` (Google reads them only there), and a canonical naming
 * another URL — which declares the page a duplicate and takes it out of
 * its own set. Both are reported together; a page with two has two things to fix. A set
 * that never names the page carrying it is HREFLANG_NO_SELF_REFERENCE's (plan D14).
 *
 * Reciprocity — whether the page named back links here — is HREFLANG_NOT_RECIPROCAL's,
 * judged from the documents the crawl's outbound stage read.
 *
 * A page with no hreflang at all is not judged. Most pages have none and want none, and
 * failing them would turn a check about multilingual sites into one that fires on every
 * monolingual page.
 */
export const HREFLANG_INVALID_CHECK = defineCheck(
  'HREFLANG_INVALID',
  (page) => {
    const { parsed, finalUrl } = page;
    if (
      parsed.alternates.length === 0 &&
      parsed.alternatesOutsideHead.length === 0
    )
      return NOT_APPLICABLE;

    const problems = [
      ...parsed.alternates.map((alternate) => ({
        ...alternate,
        problem:
          problemWith(alternate.lang) ??
          (alternate.relativeHref !== undefined
            ? 'a relative URL; Google requires the full address, https:// included'
            : null),
      })),
      ...parsed.alternatesOutsideHead.map((alternate) => ({
        ...alternate,
        problem: 'outside <head>, where Google does not read hreflang',
      })),
    ].filter(({ problem }) => problem !== null);
    const [canonical] = declaredCanonicals(page);
    const canonicalElsewhere =
      canonical && !sameDocument(canonical.url, finalUrl)
        ? canonical.url
        : null;

    return problems.length === 0 && !canonicalElsewhere
      ? PASS
      : fails({
          invalid: problems.map(({ lang }) => lang),
          canonicalElsewhere,
          evidence: evidence([
            ...problems.map(
              ({ lang, href, relativeHref, problem }) =>
                `<link rel="alternate" hreflang="${attribute(lang)}" href="${attribute(relativeHref ?? href)}"> — ${problem}`,
            ),
            ...(canonicalElsewhere
              ? [
                  `<link rel="canonical" href="${attribute(canonicalElsewhere)}"> — this page calls itself a duplicate of another`,
                ]
              : []),
          ]),
        });
  },
);
