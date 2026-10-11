import { NO_OUTBOUND_FACTS } from '../../../interfaces/outbound-facts.interface';
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
    timeZone: 'America/Toronto',
    linkStatuses: NO_OUTBOUND_FACTS,
    previewImage: {
      url: 'https://a.example/i.png',
      status: 200,
      width: 1200,
      height: 675,
    },
    previous: null,
    ...rest,
    parsed: {
      title: 'A complete guide to link building for small sites',
      metaDescription:
        'Learn link building step by step: what works, what to avoid, and how to measure the links you earn.',
      metaDescriptionGap: null,
      metaRobots: ['max-image-preview:large'],
      metaGooglebot: [],
      metaRefresh: null,
      viewport: 'width=device-width, initial-scale=1',
      canonicals: ['https://a.example/post/'],
      canonicalsOutsideHead: [],
      relativeCanonicals: [],
      // Self-referencing, and derived from the URL for the same reason `runPage` derives
      // the canonical: a fixed href would fail HREFLANG_NO_SELF_REFERENCE on every page of a run
      // but the first, and the failure would be about the fixture, not about a check.
      alternates: [
        { lang: 'en', href: finalUrl },
        { lang: 'fr', href: `${finalUrl}fr/` },
      ],
      alternatesOutsideHead: [],
      openGraph: {
        // The page's own address, derived for the reason the alternates are.
        'og:url': finalUrl,
        'og:title': 'Link building',
        'og:description': 'A guide',
        'og:image': 'https://a.example/i.png',
        'og:image:width': '1200',
      },
      articleTags: [],
      jsonLd: {
        types: ['Article', 'VideoObject'],
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
      microdata: { types: [], articleFields: [] },
      scriptedSchemaTypes: [],
      articleMarkup: {
        source: 'json-ld',
        type: 'Article',
        headline: 'A complete guide to link building',
        datePublished: '2026-01-10T09:00:00Z',
        dateModified: '2026-02-01T09:00:00Z',
        authors: [
          {
            name: 'Jane Doe',
            type: 'Person',
            urls: ['https://a.example/author/jane-doe/'],
            asText: false,
          },
        ],
        images: [{ url: 'https://a.example/i.png', width: 1200, height: 675 }],
      },
      breadcrumbs: [
        [
          { position: 1, name: 'Home', item: 'https://a.example/' },
          { position: 2, name: 'Link building', item: null },
        ],
      ],
      logos: ['https://a.example/logo.png'],
      websiteNames: [],
      icons: [],
      // A video with its metadata, so the video check applies and passes.
      videos: ['<iframe src="https://www.youtube.com/embed/abc"></iframe>'],
      contentNosnippet: null,
      lang: 'en',
      h1s: ['A complete guide to link building'],
      headings: [
        { level: 1, text: 'A complete guide to link building' },
        { level: 2, text: 'Why links matter' },
      ],
      firstParagraph: 'Links matter.',
      images: [
        {
          src: 'a.png',
          srcset: null,
          alt: 'A chart',
          loading: null,
          sized: true,
          markup: '<img src="a.png" alt="A chart" width="800" height="450">',
        },
      ],
      embeds: 0,
      resourceUrls: ['https://a.example/a.png'],
      // One link on the site and one source off it, so neither link check fails.
      links: [
        'https://a.example/another-post/',
        'https://study.example/report',
      ],
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
      renderBlockingScripts: [],
      fontPreloadsWithoutCrossorigin: [],
      elementCount: 600,
      featuredImage: {
        loading: null,
        markup: '<img src="https://a.example/i.png" fetchpriority="high">',
      },
      ...parsed,
    },
  };
}
