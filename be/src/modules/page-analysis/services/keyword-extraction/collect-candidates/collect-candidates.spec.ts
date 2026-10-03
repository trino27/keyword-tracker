import { makeRuleInput } from '../../seo-rules/_testing/make-rule-input';
import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import { collectCandidates, stripBrandSuffix } from './collect-candidates';

const collect = (
  parsed: Partial<IParsedPage>,
  url = 'https://a.example/post/',
) =>
  collectCandidates({
    url,
    siteKey: 'a.example',
    parsed: { ...makeRuleInput().parsed, ...parsed },
  });

describe('stripBrandSuffix', () => {
  it.each([
    [
      'How to remove www from your URL • Yoast',
      'yoast.com',
      undefined,
      'How to remove www from your URL',
    ],
    [
      'Keyword research | Semrush Blog',
      'semrush.com',
      undefined,
      'Keyword research',
    ],
    [
      'A guide - The Acme Journal',
      'example.com',
      'The Acme Journal',
      'A guide',
    ],
    ['Pros - and cons', 'example.com', undefined, 'Pros - and cons'],
    [
      'Yoast SEO — how it works',
      'yoast.com',
      undefined,
      'Yoast SEO — how it works',
    ],
  ])('%j → %j', (title, siteKey, siteName, expected) => {
    expect(stripBrandSuffix(title, siteKey, siteName)).toBe(expected);
  });
});

describe('collectCandidates', () => {
  it('records the fields a candidate appears in and its body frequency', () => {
    const candidates = collect({
      title: 'Link building guide | A',
      h1s: ['Link building'],
      headings: [{ level: 1, text: 'Link building' }],
      metaDescription: 'All about outreach',
      firstParagraph: 'Outreach first.',
      blocks: ['Link building works.', 'More link building.'],
    });

    expect(candidates.get('link building')).toMatchObject({
      tokens: 2,
      bodyTf: 2,
      fields: new Set(['title', 'h1', 'body']),
    });
    expect(candidates.get('outreach')?.fields).toEqual(
      new Set(['meta', 'firstParagraph']),
    );
  });

  it('never starts or ends a candidate with a stop word', () => {
    const candidates = collect(
      {
        title: null,
        metaDescription: null,
        firstParagraph: null,
        headings: [],
        h1s: [],
        blocks: ['The art of the deal', 'Art of war'],
      },
      'https://a.example/',
    );

    // "art of the deal" would be a 4-gram; "art of the" ends with a stop word.
    expect([...candidates.keys()].sort()).toEqual([
      'art',
      'art of war',
      'deal',
      'war',
    ]);
  });

  it('never crosses a heading into the next paragraph', () => {
    const candidates = collect({
      title: null,
      h1s: [],
      headings: [{ level: 2, text: 'Pricing' }],
      blocks: ['Pricing', 'Plans start low'],
    });

    expect(candidates.has('pricing plans')).toBe(false);
  });

  it('uses the slug of the sitemap URL', () => {
    const candidates = collect(
      {},
      'https://a.example/blog/remove-www-from-url/',
    );

    expect(candidates.get('remove www')?.fields.has('slug')).toBe(true);
  });

  it('marks candidates the page declares itself', () => {
    const candidates = collect({
      jsonLd: { types: [], keywords: ['Technical SEO'] },
      blocks: ['Technical SEO matters. SEO too.'],
    });

    expect(candidates.get('technical seo')?.declared).toBe(true);
    expect(candidates.get('seo')?.declared).toBe(true);
    expect(candidates.get('matters')?.declared).toBe(false);
  });

  it('without a known language, stops at 2-grams and filters nothing', () => {
    const candidates = collect({
      lang: null,
      title: null,
      h1s: [],
      headings: [],
      blocks: ['the big red house'],
    });

    expect(candidates.has('the big')).toBe(true);
    expect(candidates.has('big red house')).toBe(false);
  });
});
