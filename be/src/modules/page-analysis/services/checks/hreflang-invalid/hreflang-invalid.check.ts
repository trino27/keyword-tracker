import { declaredCanonicals } from '../_shared/declared-canonicals';
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

/** A region subtag: ISO 3166-1 alpha-2, or a UN M.49 number. */
const REGION_SUBTAG = /^(?:[a-z]{2}|\d{3})$/i;

/**
 * Two-letter codes ICU resolves to a place but ISO 3166-1 does not assign to a country:
 * `UK` is reserved — the United Kingdom is `GB` — and the rest name unions or territories
 * no hreflang can target.
 */
const RESERVED_REGIONS = new Set([
  'UK',
  'EU',
  'EZ',
  'UN',
  'AC',
  'CP',
  'DG',
  'EA',
  'IC',
  'TA',
]);

/**
 * The slips authors actually make: a country's code written where the language's goes.
 * Only suggested for a code that is not a language at all — `se` is Northern Sami and
 * `kr` is Kanuri, so neither is corrected.
 */
const LIKELY_MEANT: Record<string, string> = {
  ua: 'uk',
  kz: 'kk',
  jp: 'ja',
  cn: 'zh',
  gr: 'el',
  dk: 'da',
  cz: 'cs',
  vn: 'vi',
  UK: 'GB',
};

const LANGUAGES = new Intl.DisplayNames(['en'], {
  type: 'language',
  fallback: 'none',
});
const REGIONS = new Intl.DisplayNames(['en'], {
  type: 'region',
  fallback: 'none',
});

/**
 * Why a value is not a usable hreflang, or null when it is. Structure from `Intl`, the
 * subtag lengths from Google's requirement (ISO 639-1 language, optionally an ISO 3166-1
 * region), and existence from the language and region registries `Intl` carries.
 *
 * All three are needed. `Intl.getCanonicalLocales` alone checks grammar, not existence:
 * it accepts `ua`, `kz` and `jp`, which are countries, and `en-UK`, which is no region —
 * exactly the mistakes authors make.
 */
function problemWith(lang: string): string | null {
  if (lang.toLowerCase() === X_DEFAULT) return null;
  const [language, ...rest] = lang.split('-');
  try {
    Intl.getCanonicalLocales(lang);
  } catch {
    return 'not a language code';
  }
  if (
    !LANGUAGE_SUBTAG.test(language) ||
    !LANGUAGES.of(language.toLowerCase())
  ) {
    const meant = LIKELY_MEANT[language.toLowerCase()];
    return meant
      ? `"${language}" is a country code; the language is "${meant}"`
      : `"${language}" is not a language code`;
  }
  const region = rest.find((part) => REGION_SUBTAG.test(part));
  if (
    region &&
    (RESERVED_REGIONS.has(region.toUpperCase()) ||
      !REGIONS.of(region.toUpperCase()))
  ) {
    const meant = LIKELY_MEANT[region.toUpperCase()];
    return meant
      ? `"${region}" is not a country code; the United Kingdom is "${meant}"`
      : `"${region}" is not a country code`;
  }
  return null;
}

/**
 * Three defects a page can be shown to have on its own: a tag that is not a language, a
 * set that never names the page carrying it, and a canonical naming another URL — which
 * declares the page a duplicate and takes it out of its own set. All are reported
 * together; a page with two has two things to fix.
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
  (page) => {
    const { parsed, finalUrl } = page;
    if (parsed.alternates.length === 0) return NOT_APPLICABLE;

    const problems = parsed.alternates
      .map((alternate) => ({
        ...alternate,
        problem: problemWith(alternate.lang),
      }))
      .filter(({ problem }) => problem !== null);
    const selfReferenced = parsed.alternates.some(({ href }) =>
      sameDocument(href, finalUrl),
    );
    const [canonical] = declaredCanonicals(page);
    const canonicalElsewhere =
      canonical && !sameDocument(canonical.url, finalUrl)
        ? canonical.url
        : null;

    return problems.length === 0 && selfReferenced && !canonicalElsewhere
      ? PASS
      : fails({
          invalid: problems.map(({ lang }) => lang),
          selfReferenced,
          canonicalElsewhere,
          evidence: evidence([
            ...problems.map(
              ({ lang, href, problem }) =>
                `<link rel="alternate" hreflang="${attribute(lang)}" href="${attribute(href)}"> — ${problem}`,
            ),
            ...(selfReferenced
              ? []
              : [
                  `None of the ${parsed.alternates.length} alternates names this page (${finalUrl})`,
                ]),
            ...(canonicalElsewhere
              ? [
                  `<link rel="canonical" href="${attribute(canonicalElsewhere)}"> — this page calls itself a duplicate of another`,
                ]
              : []),
          ]),
        });
  },
);
