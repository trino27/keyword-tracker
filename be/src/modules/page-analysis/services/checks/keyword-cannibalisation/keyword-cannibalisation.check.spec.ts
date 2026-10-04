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
