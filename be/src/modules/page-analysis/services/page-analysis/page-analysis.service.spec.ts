import { makeCheckInput } from '../checks/_testing/make-check-input';
import type { IAnalysisInput } from './page-analysis.service';
import { PageAnalysisService } from './page-analysis.service';

/** The analysis carries one fact past the rules: the fetch's time to first byte. */
const makeAnalysisInput = (
  ...args: Parameters<typeof makeCheckInput>
): IAnalysisInput => ({ ...makeCheckInput(...args), responseMs: 200 });

describe('PageAnalysisService', () => {
  const service = new PageAnalysisService();

  it('gives each page its keywords and issues, in input order', async () => {
    const pages = [
      makeAnalysisInput({
        url: 'https://a.example/link-building/',
        finalUrl: 'https://a.example/link-building/',
        parsed: { canonical: 'https://a.example/link-building/' },
      }),
      makeAnalysisInput({
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

    const [first, second] = await service.analyseRun(pages, 'a.example');

    expect(first.keywords[0].relevance).toBe(1);
    expect(first.issues).toEqual([]);
    expect(second.keywords[0].term).toBe('widget pricing');
    expect(second.issues.map((issue) => issue.code)).toEqual(['THIN_CONTENT']);
  });
});
