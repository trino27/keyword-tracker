import { isWeakToken, tokenize } from './tokenize';

/** The tokens alone, for the runs whose joins are not what is being asserted. */
const tokensOf = (text: string) => tokenize(text).map((run) => run.tokens);

describe('tokenize', () => {
  it('normalizes and splits on sentence breaks', () => {
    expect(tokensOf('Link Building works. Outreach helps too!')).toEqual([
      ['link', 'building', 'works'],
      ['outreach', 'helps', 'too'],
    ]);
  });

  it('ends a run at a comma, so a phrase cannot cross a list', () => {
    expect(tokensOf('Flex wrap, grid and subgrid')).toEqual([
      ['flex', 'wrap'],
      ['grid', 'and', 'subgrid'],
    ]);
  });

  it('does not end the run at a comma inside a number', () => {
    expect(tokensOf('Plans from 1,000 USD a year')).toEqual([
      ['plans', 'from', '1', '000', 'usd', 'a', 'year'],
    ]);
  });

  it('drops the tail a bracket cut off a word, and the list it sits in', () => {
    expect(
      tokensOf(
        'What’s !important #18: <geolocation>, Syntax ::highlight()ing, named-feature(), and More',
      ),
    ).toEqual([
      ['what', 'important', '18'],
      ['geolocation'],
      ['syntax', 'highlight'],
      ['named', 'feature'],
      ['and', 'more'],
    ]);
  });

  it('keeps one-character and digits-only tokens inside the run', () => {
    expect(tokensOf('Top 10 SEO tips for a site')).toEqual([
      ['top', '10', 'seo', 'tips', 'for', 'a', 'site'],
    ]);
  });

  it('keeps a Slavic one-letter preposition inside the run', () => {
    expect(tokensOf('Полети до Рим от само 15 Евро в посока')).toEqual([
      ['полети', 'до', 'рим', 'от', 'само', '15', 'евро', 'в', 'посока'],
    ]);
  });

  it('drops a word the page cut off with an ellipsis', () => {
    expect(tokensOf('Read remarks from Kent Walker, Presiden…')).toEqual([
      ['read', 'remarks', 'from', 'kent', 'walker'],
    ]);
    expect(tokensOf('Making our marketing and Cannes more acce...')).toEqual([
      ['making', 'our', 'marketing', 'and', 'cannes', 'more'],
    ]);
  });

  it('drops a run that is only weak tokens', () => {
    expect(tokensOf('A 1. Real words here')).toEqual([
      ['real', 'words', 'here'],
    ]);
  });

  it('keeps tokens with digits and letters, and NFKC-folds them', () => {
    expect(tokensOf('HTTP2 and ｗｅｂ3 apps')).toEqual([
      ['http2', 'and', 'web3', 'apps'],
    ]);
  });

  it('breaks on a dash between spaces but not inside a word', () => {
    expect(tokensOf('E-commerce SEO — a guide')).toEqual([
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

  it('keeps a word a hyphen or slash cut in two reachable as a phrase end', () => {
    // `2` is digits and `out` is a stop word, so neither may end a phrase on its own;
    // as the second half of a written word each may. Without this "What is HTTP/2?"
    // is stored as `http` and the query fan-out section as `query fan`.
    expect(tokenize('What is HTTP/2')[0]).toEqual({
      tokens: ['what', 'is', 'http', '2'],
      glued: [false, false, false, true],
    });
    expect(tokenize('The query fan-out explained')[0].glued).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it('marks no join where the word was written without one', () => {
    expect(tokenize('query fan out')[0].glued).toEqual([false, false, false]);
  });

  it('marks no join for a word normalization split for another reason', () => {
    // "Let's" loses its suffix; nothing was glued, so nothing is reported as glued.
    const [run] = tokenize('Let us play');
    expect(run.glued.every((flag) => flag === false)).toBe(true);
  });
});
