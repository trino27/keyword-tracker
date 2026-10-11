import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { TITLE_SCRIPT_MISMATCH_CHECK } from './title-script-mismatch.check';

const RUSSIAN = [
  'Как построить систему оценки эффективности, которая работает в любой команде.',
  'Методология не работает из коробки, и вот почему это нормально.',
];

const verdict = (title: string | null, blocks: string[] = RUSSIAN) =>
  TITLE_SCRIPT_MISMATCH_CHECK.evaluate(
    makeCheckInput({ parsed: { title, blocks, headings: [] } }),
  );

describe('TITLE_SCRIPT_MISMATCH', () => {
  it('passes a Russian title over Russian text', () => {
    expect(verdict('Как сэкономить ресурсы на методологиях')).toEqual(PASSES);
  });

  // A brand in Latin beside the page's own script is how such titles are written.
  it('passes a title mixing a Latin brand with the page script', () => {
    expect(verdict('Google Analytics: полное руководство')).toEqual(PASSES);
  });

  it('fails an English title over a Russian article', () => {
    const result = verdict('A complete guide to performance reviews');
    expect(result).toEqual(
      failsWith({ pageScript: 'Cyrillic', titleScripts: ['Latin'] }),
    );
    expect(evidenceOf(result)[1]).toBe('The main text is 100% Cyrillic');
  });

  it('fails a transliterated title over Greek text', () => {
    expect(
      verdict('Odigos gia arxarious', [
        'Ένας πλήρης οδηγός για αρχάριους που θέλουν να μάθουν τα βασικά.',
      ]),
    ).toEqual(failsWith({ pageScript: 'Greek' }));
  });

  it('reads Chinese and Japanese as one writing system', () => {
    expect(
      verdict('東京の天気', [
        'きょうはとてもいい天気ですね。あしたもはれるでしょう。そとであそびましょう。',
      ]),
    ).toEqual(PASSES);
  });

  it('passes a title of digits and punctuation only', () => {
    expect(verdict('2026 — 10')).toEqual(PASSES);
  });

  it('cannot be judged without a title', () => {
    expect(verdict(null)).toEqual(NOT_APPLICABLE);
  });

  it('cannot be judged on too little text', () => {
    expect(verdict('Hello', ['Привет.'])).toEqual(NOT_APPLICABLE);
  });

  it('cannot be judged on text in no one script', () => {
    expect(
      verdict('Hello', [
        'Половина текста на русском языке здесь, half of this text in English here.',
      ]),
    ).toEqual(NOT_APPLICABLE);
  });
});
