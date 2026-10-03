import { makeRuleInput } from '../seo-rules/_testing/make-rule-input';
import { PageAnalysisService } from './page-analysis.service';

describe('PageAnalysisService', () => {
  const service = new PageAnalysisService();

  it('gives each page its keywords and issues, in input order', () => {
    const pages = [
      makeRuleInput({
        url: 'https://a.example/link-building/',
        finalUrl: 'https://a.example/link-building/',
        parsed: { canonical: 'https://a.example/link-building/' },
      }),
      makeRuleInput({
        url: 'https://a.example/widget-pricing/',
        finalUrl: 'https://a.example/widget-pricing/',
        parsed: {
          canonical: 'https://a.example/widget-pricing/',
          title: 'Our company news for this month, in brief',
          h1s: ['Widget pricing'],
          headings: [{ level: 1, text: 'Widget pricing' }],
          metaDescription:
            'Widget pricing explained: what a widget costs, why volume matters and how the tiers work.',
          blocks: [
            'Widget pricing depends on volume.',
            'Widget pricing tiers.',
          ],
          wordCount: 120,
        },
      }),
    ];

    const [first, second] = service.analyseRun(pages, 'a.example');

    expect(first.keywords[0].relevance).toBe(1);
    expect(first.issues).toEqual([]);
    expect(second.keywords[0].term).toBe('widget pricing');
    expect(second.issues.map((issue) => issue.code)).toEqual([
      'THIN_CONTENT',
      'KEYWORD_NOT_IN_TITLE',
    ]);
  });
});
