import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import type { IRobotsRules } from '../../../interfaces/robots-rules.interface';
import type { ICheckInput } from '../check.interface';

/** A robots.txt that allows everything on the test site and governs no other host. */
export const allowAllRobots = (host = 'a.example'): IRobotsRules => ({
  allows: (url) => (new URL(url).hostname === host ? true : null),
  matchingRule: () => null,
});

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
    redirects: [],
    robots: allowAllRobots(),
    headers: { 'content-type': 'text/html', 'content-encoding': 'br' },
    htmlBytes: 50_000,
    fetchedAt: new Date('2026-10-09T12:00:00Z'),
    previous: null,
    ...rest,
    parsed: {
      title: 'A complete guide to link building for small sites',
      metaDescription:
        'Learn link building step by step: what works, what to avoid, and how to measure the links you earn.',
      metaRobots: null,
      metaGooglebot: null,
      metaRefresh: null,
      viewport: 'width=device-width, initial-scale=1',
      canonicals: ['https://a.example/post/'],
      canonicalsOutsideHead: [],
      relativeCanonicals: [],
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
      nofollowLinks: [],
      uncrawlableLinks: [],
      unnamedLinks: [],
      renderResources: ['https://a.example/app.js'],
      clientRendered: false,
      blocks: ['Links matter.'],
      wordCount: 800,
      authors: ['JSON-LD author: Jane Doe'],
      datePublished: '2026-01-10T09:00:00Z',
      dateModified: '2026-02-01T09:00:00Z',
      contentHash: 'a'.repeat(64),
      jsonLdErrors: [],
      charsetDeclarationEnd: 60,
      ...parsed,
    },
  };
}
