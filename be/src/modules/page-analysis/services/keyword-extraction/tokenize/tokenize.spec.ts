import { tokenize } from './tokenize';

describe('tokenize', () => {
  it('normalizes and splits on sentence breaks', () => {
    expect(tokenize('Link Building works. Outreach, too!')).toEqual([
      ['link', 'building', 'works'],
      ['outreach', 'too'],
    ]);
  });

  it('drops one-character and digits-only tokens, breaking the run there', () => {
    expect(tokenize('Top 10 SEO tips for a site')).toEqual([
      ['top'],
      ['seo', 'tips', 'for'],
      ['site'],
    ]);
  });

  it('keeps tokens with digits and letters, and NFKC-folds them', () => {
    expect(tokenize('HTTP2 and ｗｅｂ3 apps')).toEqual([
      ['http2', 'and', 'web3', 'apps'],
    ]);
  });

  it('breaks on a dash between spaces but not inside a word', () => {
    expect(tokenize('E-commerce SEO — a guide')).toEqual([
      ['commerce', 'seo'],
      ['guide'],
    ]);
  });
});
