import * as stopword from 'stopword';
import { normalizeText } from '../services/text/normalize-text/normalize-text';
import { ENGLISH } from './english/english';
import {
  MAX_NGRAM_WITH_STOP_WORDS,
  type ILanguageProfile,
} from './language-profile.interface';

export type { ILanguageProfile };
export { MAX_NGRAM_UNKNOWN_LANG } from './language-profile.interface';

/**
 * Languages this build knows something about beyond a word list. One entry per
 * written profile, keyed by the `<html lang>` primary subtag.
 */
const PROFILES: Readonly<Record<string, ILanguageProfile>> = {
  en: ENGLISH,
};

/** `<html lang>` primary subtag (ISO 639-1) → the `stopword` list (ISO 639-3). */
const LISTS: Readonly<Record<string, readonly string[]>> = {
  af: stopword.afr,
  ar: stopword.ara,
  bg: stopword.bul,
  ca: stopword.cat,
  cs: stopword.ces,
  da: stopword.dan,
  de: stopword.deu,
  el: stopword.ell,
  en: stopword.eng,
  es: stopword.spa,
  et: stopword.est,
  fa: stopword.fas,
  fi: stopword.fin,
  fr: stopword.fra,
  he: stopword.heb,
  hi: stopword.hin,
  hr: stopword.hrv,
  hu: stopword.hun,
  id: stopword.ind,
  it: stopword.ita,
  ja: stopword.jpn,
  ko: stopword.kor,
  lt: stopword.lit,
  lv: stopword.lav,
  nb: stopword.nob,
  nl: stopword.nld,
  no: stopword.nob,
  pl: stopword.pol,
  pt: stopword.por,
  ro: stopword.ron,
  ru: stopword.rus,
  sk: stopword.slk,
  sl: stopword.slv,
  sv: stopword.swe,
  th: stopword.tha,
  tr: stopword.tur,
  uk: stopword.ukr,
  vi: stopword.vie,
  zh: stopword.zho,
};

/** The `<html lang>` value reduced to the subtag the tables are keyed by. */
export const primarySubtag = (lang: string | null): string =>
  lang?.trim().toLowerCase().split(/[-_]/)[0] ?? '';

const cache = new Map<string, ILanguageProfile | null>();

/**
 * What this build knows about the language a page declares, or `null` when it knows
 * nothing — an undeclared language, or one with no word list.
 *
 * Three outcomes, and the middle one is the point. A language with a written profile
 * gets everything in it. A language with only a shipped word list gets that list and
 * NOTHING ELSE: no clause verbs, because the verbs of one language are ordinary words
 * in another, and a rule written for English grammar applied to Bulgarian is a rule
 * applied to the wrong language. A language with neither gets null, and each reader
 * says in its own code what it does without a profile.
 */
export function profileFor(lang: string | null): ILanguageProfile | null {
  const code = primarySubtag(lang);
  if (!cache.has(code)) cache.set(code, build(code));
  return cache.get(code) ?? null;
}

function build(code: string): ILanguageProfile | null {
  const written = PROFILES[code];
  if (written) return written;
  const list = LISTS[code];
  if (!list) return null;
  return {
    code,
    stopWords: new Set(list.map(normalizeText).filter(Boolean)),
    // Empty on purpose: see the doc comment above.
    clauseVerbs: new Set<string>(),
    maxNgram: MAX_NGRAM_WITH_STOP_WORDS,
  };
}
