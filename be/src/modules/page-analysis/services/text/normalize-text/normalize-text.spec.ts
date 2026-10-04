import { normalizeText } from './normalize-text';

describe('normalizeText', () => {
  it.each([
    ['How to Remove  WWW — from your URL!', 'how to remove www from your url'],
    ['ﬁnding Ｆｕｌｌｗｉｄｔｈ', 'finding fullwidth'],
    ["Yoast's SEO: 10 tips", 'yoast seo 10 tips'],
    // The suffix goes with the apostrophe; what is left is the word the page means.
    ["Facebook's algorithm changes", 'facebook algorithm changes'],
    ["A Beginner's Step-by-Step Guide", 'a beginner step by step guide'],
    ["Let's play!!", 'let play'],
    ['Google Analytics’ Danger zone', 'google analytics danger zone'],
    ["we're, they've, I'll, don't", 'we they i don'],
    // An apostrophe inside a name is not a contraction; the name closes up.
    ["O'Brien on SEO", 'obrien on seo'],
    // French elides the particle in front, so the word AFTER the apostrophe is the
    // one that matters. ratehub.ca's Quebec posts were filed under `labordabilite`.
    ["L'abordabilite s'est amelioree", 'abordabilite est amelioree'],
    ["qu'il n'y a", 'il y a'],
    ["d'Ivoire", 'ivoire'],
    // …and an English plural possessive is not an elision: the s ends a word.
    ["the dogs' bowls", 'the dogs bowls'],
    ['Überprüfung der Seite', 'überprüfung der seite'],
    ['  ', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
});
