import { makeRuleInput } from '../../seo-rules/_testing/make-rule-input';
import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import { collectCandidates, stripTitleChrome } from './collect-candidates';

const collect = (
  parsed: Partial<IParsedPage>,
  url = 'https://a.example/post/',
) =>
  collectCandidates({
    url,
    siteKey: 'a.example',
    parsed: { ...makeRuleInput().parsed, ...parsed },
  });

describe('stripTitleChrome', () => {
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
      'Yoast SEO - how it works',
    ],
  ])('%j → %j', (title, siteKey, siteName, expected) => {
    expect(stripTitleChrome(title, siteKey, siteName)).toBe(expected);
  });

  it('strips a section name the run showed to be the site’s, then the brand', () => {
    const title =
      'Dual UK-Iranian national released on bail - National | Globalnews.ca';

    expect(stripTitleChrome(title, 'globalnews.ca', undefined)).toBe(
      'Dual UK-Iranian national released on bail - National',
    );
    expect(
      stripTitleChrome(
        title,
        'globalnews.ca',
        undefined,
        new Set(['national']),
      ),
    ).toBe('Dual UK-Iranian national released on bail');
  });

  it('never strips the whole title', () => {
    expect(stripTitleChrome('Yoast | Yoast', 'yoast.com', undefined)).toBe(
      'Yoast',
    );
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

    // "art of the" ends with a stop word; "art of the deal" is a 4-gram and allowed.
    expect([...candidates.keys()].sort()).toEqual([
      'art',
      'art of the deal',
      'art of war',
      'deal',
      'war',
    ]);
  });

  it('spans a one-letter particle instead of stopping at it', () => {
    const candidates = collect(
      {
        lang: 'bg',
        title: null,
        metaDescription: null,
        firstParagraph: null,
        headings: [],
        h1s: [],
        blocks: ['Евро в посока'],
      },
      'https://a.example/',
    );

    expect(candidates.has('евро в посока')).toBe(true);
    expect(candidates.has('в')).toBe(false);
  });

  it('decodes a percent-encoded slug instead of reading its hex', () => {
    const candidates = collect(
      {},
      'https://a.example/%d0%bf%d0%be%d0%bb%d0%b5%d1%82%d0%b8-%d0%b4%d0%be-%d1%80%d0%b8%d0%bc/',
    );

    expect(candidates.get('полети до рим')?.fields.has('slug')).toBe(true);
    expect(candidates.has('d0 bf')).toBe(false);
  });

  it('ignores a slug that is an opaque identifier', () => {
    const candidates = collect(
      {},
      'https://a.example/club/blog/x/BDgx_QEdO0G1NNL-VyGD1A',
    );

    expect(
      [...candidates.values()].some((stats) => stats.fields.has('slug')),
    ).toBe(false);
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
