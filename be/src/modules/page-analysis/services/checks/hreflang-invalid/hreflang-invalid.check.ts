import { sameDocument } from '../_shared/same-document';
import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * `x-default` is the one value that is not a language at all — it names the page to serve
 * when none of the others match — so it is spelled out rather than parsed.
 */
const X_DEFAULT = 'x-default';

/** ISO 639 is two or three letters. BCP 47 allows four to eight; hreflang does not. */
const LANGUAGE_SUBTAG = /^[a-z]{2,3}$/i;

/**
 * Structure from `Intl`, which carries the language subtag registry, and the subtag
 * length from Google's own requirement — ISO 639-1 for the language, optionally ISO
 * 3166-1 Alpha-2 for the region.
 *
 * Both halves are needed and neither is enough. A hand-written pattern rejects
 * `zh-Hant-TW`, which is valid. `Intl` alone accepts `english`: BCP 47 reserves four- to
 * eight-letter primary subtags for registered languages, so the grammar is satisfied and
 * nothing throws — and `english` is exactly the mistake an author makes.
 */
function isLanguageTag(lang: string): boolean {
  if (lang.toLowerCase() === X_DEFAULT) return true;
  if (!LANGUAGE_SUBTAG.test(lang.split('-')[0])) return false;
  try {
    Intl.getCanonicalLocales(lang);
    return true;
  } catch {
    return false;
  }
}

/**
 * Two defects a page can be shown to have on its own: a tag that is not a language, and
 * a set that never names the page carrying it. Google ignores the whole set for either,
 * and both are reported together — a page with both has two things to fix, and telling
 * it about one would send it back for the other.
 *
 * Reciprocity — whether the page named back links here — is the other half of the
 * requirement and is deliberately not checked: it needs the other document, which is
 * usually on another site and never in this crawl.
 *
 * A page with no hreflang at all is not judged. Most pages have none and want none, and
 * failing them would turn a check about multilingual sites into one that fires on every
 * monolingual page.
 */
export const HREFLANG_INVALID_CHECK = defineCheck(
  'HREFLANG_INVALID',
  ({ parsed, finalUrl }) => {
    if (parsed.alternates.length === 0) return NOT_APPLICABLE;

    const invalid = parsed.alternates
      .filter(({ lang }) => !isLanguageTag(lang))
      .map(({ lang }) => lang);
    const selfReferenced = parsed.alternates.some(({ href }) =>
      sameDocument(href, finalUrl),
    );

    return invalid.length === 0 && selfReferenced
      ? PASS
      : fails({
          invalid,
          selfReferenced,
          evidence: evidence([
            ...parsed.alternates
              .filter(({ lang }) => invalid.includes(lang))
              .map(
                ({ lang, href }) =>
                  `<link rel="alternate" hreflang="${attribute(lang)}" href="${attribute(href)}"> — not a language code`,
              ),
            ...(selfReferenced
              ? []
              : [
                  `None of the ${parsed.alternates.length} alternates names this page (${finalUrl})`,
                ]),
          ]),
        });
  },
);
