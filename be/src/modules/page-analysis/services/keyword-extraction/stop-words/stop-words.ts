import * as stopword from 'stopword';
import { EXTRA_ENGLISH_STOP_WORDS } from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';

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
  en: [...stopword.eng, ...EXTRA_ENGLISH_STOP_WORDS],
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

const cache = new Map<string, ReadonlySet<string> | null>();

/**
 * The stop words of a page's declared language, normalized like tokens are; `null`
 * when the language is unknown or undeclared — the caller then shortens n-grams
 * instead of guessing a language.
 */
export function stopWordsFor(lang: string | null): ReadonlySet<string> | null {
  const primary = lang?.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  if (!cache.has(primary)) {
    const list = LISTS[primary];
    cache.set(
      primary,
      list ? new Set(list.map(normalizeText).filter(Boolean)) : null,
    );
  }
  return cache.get(primary) ?? null;
}
