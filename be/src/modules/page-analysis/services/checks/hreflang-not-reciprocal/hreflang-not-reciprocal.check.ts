import { declaredCanonicals } from '../_shared/declared-canonicals';
import { isDevelopmentHost } from '../_shared/development-host';
import { evidence } from '../_shared/evidence';
import { problemWith } from '../_shared/hreflang-code';
import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const withoutFragment = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * Alternates that do not name this page back. Google requires every page of a hreflang
 * set to link to every other: a page that lists a translation the translation does not
 * list back is ignored. Judged from the documents the outbound stage read — an
 * alternate that redirected, failed or was not read is unknown, never non-reciprocal.
 *
 * One fact, one finding (plan D36): an alternate with a code HREFLANG_INVALID reports,
 * or on a development host, is skipped, and a page whose canonical names another URL —
 * which takes it out of its own set — is HREFLANG_INVALID's alone. `x-default` names a
 * fallback, not a language version, and is not asked to link back.
 */
export const HREFLANG_NOT_RECIPROCAL_CHECK = defineCheck(
  'HREFLANG_NOT_RECIPROCAL',
  (page) => {
    const { alternates } = page.parsed;
    if (alternates.length === 0) return NOT_APPLICABLE;
    const [canonical] = declaredCanonicals(page);
    if (canonical && !sameDocument(canonical.url, page.finalUrl))
      return NOT_APPLICABLE;
    const pageHost = new URL(page.finalUrl).hostname;
    const candidates = new Map<string, string>();
    for (const { lang, href } of alternates) {
      const url = withoutFragment(href);
      if (
        url &&
        lang.toLowerCase() !== 'x-default' &&
        !sameDocument(url, page.finalUrl) &&
        problemWith(lang) === null &&
        !isDevelopmentHost(new URL(url).hostname, pageHost) &&
        !candidates.has(url)
      )
        candidates.set(url, lang);
    }
    const judged = [...candidates].flatMap(([url, lang]) => {
      const document = page.linkStatuses.documents.get(url);
      if (
        !document?.page ||
        document.outcome.kind !== 'answered' ||
        document.outcome.status !== 200 ||
        document.outcome.redirects.length > 0
      )
        return [];
      const linksBack = document.page.alternates.some(({ href }) =>
        sameDocument(href, page.finalUrl),
      );
      return [{ url, lang, linksBack }];
    });
    if (judged.length === 0) return NOT_APPLICABLE;
    const missing = judged.filter(({ linksBack }) => !linksBack);
    if (missing.length === 0) return PASS;
    return fails({
      count: missing.length,
      checked: judged.length,
      alternates: missing.map(({ url }) => url),
      evidence: [
        ...evidence(
          missing.map(
            ({ url, lang }) =>
              `${url} (${lang}) lists no hreflang link back to ${page.finalUrl}`,
          ),
        ),
        ...(judged.length < candidates.size
          ? [`Checked ${judged.length} of ${candidates.size} alternates.`]
          : []),
      ],
    });
  },
);
