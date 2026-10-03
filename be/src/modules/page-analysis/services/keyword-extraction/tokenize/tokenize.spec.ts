import { isWeakToken, tokenize } from './tokenize';

describe('tokenize', () => {
  it('normalizes and splits on sentence breaks', () => {
    expect(tokenize('Link Building works. Outreach, too!')).toEqual([
      ['link', 'building', 'works'],
      ['outreach', 'too'],
    ]);
  });

  it('keeps one-character and digits-only tokens inside the run', () => {
    expect(tokenize('Top 10 SEO tips for a site')).toEqual([
      ['top', '10', 'seo', 'tips', 'for', 'a', 'site'],
    ]);
  });

  it('keeps a Slavic one-letter preposition inside the run', () => {
    expect(tokenize('Полети до Рим от само 15 Евро в посока')).toEqual([
      ['полети', 'до', 'рим', 'от', 'само', '15', 'евро', 'в', 'посока'],
    ]);
  });

  it('drops a word the page cut off with an ellipsis', () => {
    expect(tokenize('Read remarks from Kent Walker, Presiden…')).toEqual([
      ['read', 'remarks', 'from', 'kent', 'walker'],
    ]);
    expect(tokenize('Making our marketing, and Cannes, more acce...')).toEqual([
      ['making', 'our', 'marketing', 'and', 'cannes', 'more'],
    ]);
  });

  it('drops a run that is only weak tokens', () => {
    expect(tokenize('A 1. Real words here')).toEqual([
      ['real', 'words', 'here'],
    ]);
  });

  it('keeps tokens with digits and letters, and NFKC-folds them', () => {
    expect(tokenize('HTTP2 and ｗｅｂ3 apps')).toEqual([
      ['http2', 'and', 'web3', 'apps'],
    ]);
  });

  it('breaks on a dash between spaces but not inside a word', () => {
    expect(tokenize('E-commerce SEO — a guide')).toEqual([
      ['e', 'commerce', 'seo'],
      ['a', 'guide'],
    ]);
  });

  it('isWeakToken: one character or digits only', () => {
    expect(['в', 'a', '15', '2026'].map(isWeakToken)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(['до', 'рим', 'http2'].map(isWeakToken)).toEqual([
      false,
      false,
      false,
    ]);
  });
});
