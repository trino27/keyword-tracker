import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import type { ISeoRuleInput } from '../seo-rule.interface';

/** A page that passes every rule; a test overrides only what its rule reads. */
export function makeRuleInput(
  overrides: Partial<Omit<ISeoRuleInput, 'parsed'>> & {
    parsed?: Partial<IParsedPage>;
  } = {},
): ISeoRuleInput {
  const { parsed, ...rest } = overrides;
  return {
    url: 'https://a.example/post/',
    finalUrl: 'https://a.example/post/',
    redirected: false,
    headers: { 'content-type': 'text/html' },
    htmlBytes: 50_000,
    ...rest,
    parsed: {
      title: 'A complete guide to link building for small sites',
      metaDescription:
        'Learn link building step by step: what works, what to avoid, and how to measure the links you earn.',
      metaRobots: null,
      canonical: 'https://a.example/post/',
      openGraph: {
        'og:title': 'Link building',
        'og:description': 'A guide',
        'og:image': 'https://a.example/i.png',
      },
      articleTags: [],
      jsonLd: { types: ['Article'], keywords: [] },
      lang: 'en',
      h1s: ['A complete guide to link building'],
      headings: [
        { level: 1, text: 'A complete guide to link building' },
        { level: 2, text: 'Why links matter' },
      ],
      firstParagraph: 'Links matter.',
      images: [{ src: 'a.png', alt: 'A chart' }],
      blocks: ['Links matter.'],
      wordCount: 800,
      ...parsed,
    },
  };
}
