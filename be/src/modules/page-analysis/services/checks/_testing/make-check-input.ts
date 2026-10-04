import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import type { ICheckInput } from '../check.interface';

/** A page that passes every check; a test overrides only what its check reads. */
export function makeCheckInput(
  overrides: Partial<Omit<ICheckInput, 'parsed'>> & {
    parsed?: Partial<IParsedPage>;
  } = {},
): ICheckInput {
  const { parsed, ...rest } = overrides;
  const finalUrl = rest.finalUrl ?? 'https://a.example/post/';
  return {
    url: 'https://a.example/post/',
    finalUrl,
    redirected: false,
    headers: { 'content-type': 'text/html' },
    htmlBytes: 50_000,
    ...rest,
    parsed: {
      title: 'A complete guide to link building for small sites',
      metaDescription:
        'Learn link building step by step: what works, what to avoid, and how to measure the links you earn.',
      metaRobots: null,
      metaRefresh: null,
      viewport: 'width=device-width, initial-scale=1',
      canonical: 'https://a.example/post/',
      // Self-referencing, and derived from the URL for the same reason `runPage` derives
      // the canonical: a fixed href would fail HREFLANG_INVALID on every page of a run
      // but the first, and the failure would be about the fixture, not about a check.
      alternates: [
        { lang: 'en', href: finalUrl },
        { lang: 'fr', href: `${finalUrl}fr/` },
      ],
      openGraph: {
        'og:title': 'Link building',
        'og:description': 'A guide',
        'og:image': 'https://a.example/i.png',
      },
      articleTags: [],
      jsonLd: {
        types: ['Article'],
        keywords: [],
        articleFields: [
          'headline',
          'image',
          'datePublished',
          'dateModified',
          'author',
          'publisher',
        ],
      },
      lang: 'en',
      h1s: ['A complete guide to link building'],
      headings: [
        { level: 1, text: 'A complete guide to link building' },
        { level: 2, text: 'Why links matter' },
      ],
      firstParagraph: 'Links matter.',
      images: [{ src: 'a.png', alt: 'A chart' }],
      resourceUrls: ['https://a.example/a.png'],
      links: ['https://a.example/another-post/'],
      blocks: ['Links matter.'],
      wordCount: 800,
      ...parsed,
    },
  };
}
