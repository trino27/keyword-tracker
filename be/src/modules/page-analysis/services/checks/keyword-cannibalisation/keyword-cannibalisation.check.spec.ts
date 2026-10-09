import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { keywordsOf, makeRunInput, runPage } from '../_testing/make-run-input';
import { KEYWORD_CANNIBALISATION_CHECK } from './keyword-cannibalisation.check';

describe('KEYWORD_CANNIBALISATION', () => {
  it('flags both pages that lead with the same keyword', () => {
    const run = makeRunInput(
      [runPage('what-is-ai-marketing'), runPage('ai-marketing-guide')],
      [keywordsOf('ai marketing', 'automation'), keywordsOf('ai marketing')],
    );

    expect(KEYWORD_CANNIBALISATION_CHECK.evaluate(run)).toEqual([
      failsWith({
        term: 'ai marketing',
        otherUrls: ['https://a.example/ai-marketing-guide/'],
      }),
      failsWith({
        term: 'ai marketing',
        otherUrls: ['https://a.example/what-is-ai-marketing/'],
      }),
    ]);
  });

  // A shared second keyword is not cannibalisation: only the subject a page LEADS with
  // is the one it competes for.
  it('leaves pages with different leading keywords alone', () => {
    const run = makeRunInput(
      [runPage('a'), runPage('b')],
      [keywordsOf('link building', 'seo'), keywordsOf('seo', 'link building')],
    );

    expect(KEYWORD_CANNIBALISATION_CHECK.evaluate(run)).toEqual([
      PASSES,
      PASSES,
    ]);
  });

  // blog.cloudflare.com, 2026-10: the zh-cn and zh-tw versions of one post both lead
  // with the product's English name, and were reported as competing.
  it('does not set two language versions of one post against each other', () => {
    const tw = 'https://a.example/zh-tw/gateway';
    const run = makeRunInput(
      [
        runPage('zh-cn/gateway', {
          parsed: { lang: 'zh-cn', alternates: [{ lang: 'zh-tw', href: tw }] },
        }),
        runPage('zh-tw/gateway', { parsed: { lang: 'zh-cn' } }),
        runPage('ja-jp/gateway', { parsed: { lang: 'ja-jp' } }),
        runPage('gateway-pricing', { parsed: { lang: 'zh-cn' } }),
      ],
      [
        keywordsOf('monetization gateway'),
        keywordsOf('monetization gateway'),
        keywordsOf('monetization gateway'),
        keywordsOf('monetization gateway'),
      ],
    );

    const [cn, , ja, pricing] = KEYWORD_CANNIBALISATION_CHECK.evaluate(run);
    // Named in hreflang from one side only, and still a version: either side says so.
    expect(cn).toEqual(
      failsWith({ otherUrls: ['https://a.example/gateway-pricing/'] }),
    );
    expect(ja).toEqual(PASSES);
    // A page in the same language on the same keyword is still a rival.
    expect(pricing).toEqual(
      failsWith({
        otherUrls: [
          'https://a.example/zh-cn/gateway/',
          'https://a.example/zh-tw/gateway/',
        ],
      }),
    );
  });

  it('cannot be judged on a page with no keyword', () => {
    const run = makeRunInput(
      [runPage('a'), runPage('b')],
      [[], keywordsOf('seo')],
    );

    expect(KEYWORD_CANNIBALISATION_CHECK.evaluate(run)[0]).toEqual(
      NOT_APPLICABLE,
    );
  });

  it('cannot be judged on a run of one page', () => {
    const run = makeRunInput([runPage('only')], [keywordsOf('seo')]);

    expect(KEYWORD_CANNIBALISATION_CHECK.evaluate(run)).toEqual([
      NOT_APPLICABLE,
    ]);
  });
});
