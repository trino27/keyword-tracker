import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The writing systems told apart, each by its Unicode script. Chinese and Japanese
 * share one entry: a Japanese text mixes Han with kana in every sentence, and a title
 * of kanji over a page of mostly kana is the same writing system.
 */
const SCRIPTS: readonly (readonly [string, RegExp])[] = [
  ['Latin', /\p{Script=Latin}/u],
  ['Cyrillic', /\p{Script=Cyrillic}/u],
  ['Greek', /\p{Script=Greek}/u],
  ['Arabic', /\p{Script=Arabic}/u],
  ['Hebrew', /\p{Script=Hebrew}/u],
  [
    'Chinese/Japanese',
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,
  ],
  ['Korean', /\p{Script=Hangul}/u],
  ['Thai', /\p{Script=Thai}/u],
  ['Devanagari', /\p{Script=Devanagari}/u],
  ['Georgian', /\p{Script=Georgian}/u],
  ['Armenian', /\p{Script=Armenian}/u],
];

/** Letters the main text needs before its script can be named. */
const MIN_TEXT_LETTERS = 30;

/** Share of the main text's letters its script must hold to be THE script of the page. */
const DOMINANT_SHARE = 0.8;

/** Letters of the text, counted per script; letters of no listed script are not counted. */
function lettersByScript(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const char of text) {
    if (!/\p{L}/u.test(char)) continue;
    const script = SCRIPTS.find(([, pattern]) => pattern.test(char))?.[0];
    if (script) counts.set(script, (counts.get(script) ?? 0) + 1);
  }
  return counts;
}

/**
 * A title with not one letter in the script the page's text is written in. Only that:
 * a title mixing the page's script with a Latin brand name passes, because that is how
 * a Russian or Greek post names Google Analytics — and Google's own example of the
 * mismatch is a title in English or transliteration over a page in another script.
 *
 * Not applicable without a title, or without enough main text, mostly in one script, to
 * say which script the page is in.
 */
export const TITLE_SCRIPT_MISMATCH_CHECK = defineCheck(
  'TITLE_SCRIPT_MISMATCH',
  ({ parsed }) => {
    if (!parsed.title) return NOT_APPLICABLE;
    const text = [
      ...parsed.headings.map(({ text: heading }) => heading),
      ...parsed.blocks,
    ].join(' ');
    const counts = lettersByScript(text);
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    const [script, letters] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0] ?? ['', 0];
    if (total < MIN_TEXT_LETTERS || letters < total * DOMINANT_SHARE)
      return NOT_APPLICABLE;
    const titleScripts = lettersByScript(parsed.title);
    if (titleScripts.size === 0 || titleScripts.has(script)) return PASS;
    return fails({
      pageScript: script,
      titleScripts: [...titleScripts.keys()],
      evidence: evidence([
        `<title>${attribute(parsed.title)}</title> — ${[...titleScripts.keys()].join(', ')} only`,
        `The main text is ${Math.round((letters / total) * 100)}% ${script}`,
      ]),
    });
  },
);
