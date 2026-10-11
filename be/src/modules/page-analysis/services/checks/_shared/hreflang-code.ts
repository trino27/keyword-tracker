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
export function problemWith(lang: string): string | null {
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
