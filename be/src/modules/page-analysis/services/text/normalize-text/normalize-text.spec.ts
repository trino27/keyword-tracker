import { normalizeText } from './normalize-text';

describe('normalizeText', () => {
  it.each([
    ['How to Remove  WWW — from your URL!', 'how to remove www from your url'],
    ['ﬁnding Ｆｕｌｌｗｉｄｔｈ', 'finding fullwidth'],
    ["Yoast's SEO: 10 tips", 'yoast s seo 10 tips'],
    ['Überprüfung der Seite', 'überprüfung der seite'],
    ['  ', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
});
