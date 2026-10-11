/**
 * `x-default` is the one value that is not a language at all — it names the page to serve
 * when none of the others match — so it is spelled out rather than parsed.
 */
const X_DEFAULT = 'x-default';

/**
 * Google: "Only language codes listed in ISO 639-1 and region codes listed in ISO 3166-1
 * Alpha 2 are supported; other codes that aren't listed in those standards, such as
 * es-419, aren't supported." A script (ISO 15924) may sit between them, as in zh-Hant-TW.
 * So an hreflang is two letters, then optionally four, then optionally two — nothing more.
 */
const ISO_639_1 = /^[a-z]{2}$/i;
const ISO_15924 = /^[a-z]{4}$/i;
const ISO_3166_ALPHA_2 = /^[a-z]{2}$/i;

/** ISO 639-2/3: a language, but not one Google supports. */
const LONGER_LANGUAGE = /^[a-z]{3}$/i;
/** A UN M.49 area such as 419 (Latin America): valid BCP 47, unsupported by Google. */
const UN_M49_REGION = /^\d{3}$/;

/**
 * ISO 3166-1 alpha-2 codes no country holds: ZZ (unknown) and the user-assigned AA,
 * QM–QZ and XA–XZ, which `Intl` names ("Pseudo-Accents") though no hreflang can target.
 */
const USER_ASSIGNED_REGION = /^(?:AA|ZZ|Q[M-Z]|X[A-Z])$/i;

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
  if (LONGER_LANGUAGE.test(language) && LANGUAGES.of(language.toLowerCase()))
    return `"${language}" is not an ISO 639-1 code; Google supports only two-letter language codes`;
  if (!ISO_639_1.test(language) || !LANGUAGES.of(language.toLowerCase())) {
    const meant = LIKELY_MEANT[language.toLowerCase()];
    return meant
      ? `"${language}" is a country code; the language is "${meant}"`
      : `"${language}" is not a language code`;
  }
  const subtags = [...rest];
  if (subtags[0] !== undefined && ISO_15924.test(subtags[0])) subtags.shift();
  const [region, ...extra] = subtags;
  if (region !== undefined && UN_M49_REGION.test(region))
    return `"${region}" is a UN M.49 region; Google supports only two-letter ISO 3166-1 country codes`;
  if (region !== undefined && !ISO_3166_ALPHA_2.test(region))
    return `"${region}" is neither a script nor a country code; hreflang takes a language, an optional script and an optional country`;
  if (
    region !== undefined &&
    (RESERVED_REGIONS.has(region.toUpperCase()) ||
      USER_ASSIGNED_REGION.test(region) ||
      !REGIONS.of(region.toUpperCase()))
  ) {
    const meant = LIKELY_MEANT[region.toUpperCase()];
    return meant
      ? `"${region}" is not a country code; the United Kingdom is "${meant}"`
      : `"${region}" is not a country code`;
  }
  if (extra.length > 0)
    return `"${extra.join('-')}" follows the country; hreflang takes a language, an optional script and an optional country`;
  return null;
}
