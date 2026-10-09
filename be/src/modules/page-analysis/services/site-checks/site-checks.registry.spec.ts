import { SITE_CHECK_CODES } from '@app/contracts';
import type { ISiteCheckInput } from './site-check.interface';
import { evaluateSite, SITE_CHECKS } from './site-checks.registry';

const SERVED = 'https://www.a.example';

/** A site that passes every site check. */
const healthySite = (
  overrides: Partial<ISiteCheckInput> = {},
): ISiteCheckInput => ({
  servedOrigin: SERVED,
  crawledAt: new Date('2026-10-09T12:00:00Z'),
  robotsTxt: {
    status: 200,
    truncated: false,
    // A Googlebot group that repeats the general rules: the check runs, and passes.
    lines: [
      'User-agent: *',
      'Disallow: /admin/',
      '',
      'User-agent: Googlebot',
      'Disallow: /admin/',
      'Sitemap: https://www.a.example/sitemap.xml',
    ],
  },
  sitemapUrls: [1, 2, 3, 4, 5].map((n) => `${SERVED}/post-${n}/`),
  lastmods: Object.fromEntries(
    [1, 2, 3, 4, 5].map((n) => [`${SERVED}/post-${n}/`, `2026-0${n}-10`]),
  ),
  fetched: [1, 2].map((n) => ({
    url: `${SERVED}/post-${n}/`,
    status: 'crawled' as const,
    httpStatus: 200,
    reason: null,
    page: {
      finalUrl: `${SERVED}/post-${n}/`,
      dateModified: `2026-0${n}-10`,
      issues: [],
    },
  })),
  hostVariants: [
    {
      url: 'http://www.a.example/',
      status: 200,
      redirects: [{ url: 'http://www.a.example/', status: 301 }],
      finalUrl: `${SERVED}/`,
    },
    {
      url: 'https://a.example/',
      status: 200,
      redirects: [{ url: 'https://a.example/', status: 301 }],
      finalUrl: `${SERVED}/`,
    },
  ],
  missingPage: {
    url: `${SERVED}/seo-keyword-tracker-missing-page-1/`,
    status: 404,
    redirects: [],
    finalUrl: `${SERVED}/seo-keyword-tracker-missing-page-1/`,
  },
  ...overrides,
});

const verdictOf = (
  code: (typeof SITE_CHECK_CODES)[number],
  input: ISiteCheckInput,
) => evaluateSite(input).find((result) => result.code === code)!;

const evidenceOf = (
  code: (typeof SITE_CHECK_CODES)[number],
  input: ISiteCheckInput,
) => (verdictOf(code, input).details as { evidence?: string[] }).evidence ?? [];

describe('SITE_CHECKS', () => {
  it('has one check per catalogued site code', () => {
    expect(Object.keys(SITE_CHECKS).sort()).toEqual(
      [...SITE_CHECK_CODES].sort(),
    );
  });

  it('passes every check on a healthy site, in catalogue order', () => {
    expect(
      evaluateSite(healthySite()).map(({ code, status }) => [code, status]),
    ).toEqual(SITE_CHECK_CODES.map((code) => [code, 'passed']));
  });

  it('skips what it has no evidence for, rather than passing it', () => {
    const results = evaluateSite(
      healthySite({
        servedOrigin: null,
        robotsTxt: { status: 404, truncated: false, lines: [] },
        lastmods: {},
        fetched: [],
        hostVariants: null,
        missingPage: null,
      }),
    );

    expect(results.every(({ status }) => status === 'notApplicable')).toBe(
      true,
    );
  });
});

describe('robots.txt checks', () => {
  it('reports a robots.txt past 500 KiB, naming the last line Google reads', () => {
    expect(
      evidenceOf(
        'ROBOTS_TXT_TRUNCATED',
        healthySite({
          robotsTxt: {
            status: 200,
            truncated: true,
            lines: ['User-agent: *', 'Disallow: /a/'],
          },
        }),
      ),
    ).toEqual([
      'robots.txt is longer than 500 KiB; Google stops after line 2',
      'The last line read: Disallow: /a/',
    ]);
  });

  it('quotes the noindex, nofollow and host lines Google never acted on', () => {
    expect(
      evidenceOf(
        'ROBOTS_TXT_UNSUPPORTED_RULES',
        healthySite({
          robotsTxt: {
            status: 200,
            truncated: false,
            lines: [
              'User-agent: *',
              'Noindex: /tag/',
              'Crawl-delay: 5',
              'Host: a.example',
            ],
          },
        }),
      ),
    ).toEqual(['line 2: Noindex: /tag/', 'line 4: Host: a.example']);
  });

  // The trap the guide describes: a Googlebot group added for one rule silently opens
  // everything the general group closed.
  it('reports general rules a Googlebot group leaves open', () => {
    const lines = [
      'User-agent: *',
      'Disallow: /admin/',
      'Disallow: /cart/',
      '',
      'User-agent: Googlebot',
      'Disallow: /beta/',
      'Disallow: /cart/',
    ];

    expect(
      evidenceOf(
        'ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES',
        healthySite({ robotsTxt: { status: 200, truncated: false, lines } }),
      ),
    ).toEqual([
      'line 2: Disallow: /admin/ — written for User-agent: *, open to Googlebot',
      'Googlebot follows only its own group (near line 6)',
    ]);
  });

  it('passes a Googlebot group that closes everything anyway', () => {
    const lines = [
      'User-agent: *',
      'Disallow: /admin/',
      'User-agent: Googlebot',
      'Disallow: /',
    ];

    expect(
      verdictOf(
        'ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES',
        healthySite({ robotsTxt: { status: 200, truncated: false, lines } }),
      ).status,
    ).toBe('passed');
  });
});

describe('sitemap checks', () => {
  it('names each fetched entry that is not meant to be indexed, and why', () => {
    const entry = (url: string, extra: object) => ({
      url,
      status: 'crawled' as const,
      httpStatus: 200,
      reason: null,
      page: null,
      ...extra,
    });

    expect(
      evidenceOf(
        'SITEMAP_LISTS_NON_INDEXABLE',
        healthySite({
          fetched: [
            entry(`${SERVED}/gone/`, {
              status: 'failed',
              httpStatus: 404,
              reason: 'HTTP 404',
            }),
            entry(`${SERVED}/old/`, {
              page: {
                finalUrl: `${SERVED}/new/`,
                dateModified: null,
                issues: [
                  { code: 'REDIRECTED', details: { to: `${SERVED}/new/` } },
                ],
              },
            }),
            entry(`${SERVED}/hidden/`, {
              page: {
                finalUrl: `${SERVED}/hidden/`,
                dateModified: null,
                issues: [{ code: 'NOINDEX', details: {} }],
              },
            }),
            entry(`${SERVED}/fine/`, {}),
          ],
        }),
      ),
    ).toEqual([
      '3 of the 4 sitemap entries this crawl fetched:',
      `${SERVED}/gone/ — answers HTTP 404`,
      `${SERVED}/old/ — redirects to ${SERVED}/new/`,
      `${SERVED}/hidden/ — is set to noindex`,
    ]);
  });

  it('reports sitemap URLs on another scheme or host variant', () => {
    expect(
      evidenceOf(
        'SITEMAP_LISTS_OTHER_HOST_VARIANTS',
        healthySite({
          sitemapUrls: [
            `${SERVED}/a/`,
            'http://www.a.example/b/',
            'https://a.example/c/',
          ],
        }),
      ),
    ).toEqual([
      `The site serves its pages from ${SERVED}; 2 of 3 sitemap URLs do not:`,
      'http://www.a.example/b/',
      'https://a.example/c/',
    ]);
  });

  it.each([
    [
      'every entry dated alike',
      Object.fromEntries(
        [1, 2, 3, 4, 5].map((n) => [`${SERVED}/post-${n}/`, '2026-10-01']),
      ),
      'All 5 dated entries carry the same lastmod: 2026-10-01',
    ],
    [
      'dates stamped at build time',
      Object.fromEntries(
        [1, 2, 3, 4, 5].map((n) => [
          `${SERVED}/post-${n}/`,
          `2026-10-09T11:5${n}:00Z`,
        ]),
      ),
      '5 of 5 lastmod times fall within two hours of the crawl — the moment the sitemap was built',
    ],
  ])('reports lastmod with %s', (_, lastmods, quote) => {
    expect(
      evidenceOf('SITEMAP_LASTMOD_UNRELIABLE', healthySite({ lastmods })),
    ).toContain(quote);
  });

  it('reports lastmod older than the modification the pages declare', () => {
    const urls = [1, 2, 3].map((n) => `${SERVED}/post-${n}/`);
    expect(
      evidenceOf(
        'SITEMAP_LASTMOD_UNRELIABLE',
        healthySite({
          fetched: urls.map((url) => ({
            url,
            status: 'crawled' as const,
            httpStatus: 200,
            reason: null,
            page: { finalUrl: url, dateModified: '2026-09-30', issues: [] },
          })),
        }),
      ),
    ).toContain(
      `${SERVED}/post-1/ — sitemap lastmod 2026-01-10, the page says it was modified 2026-09-30`,
    );
  });
});

describe('host checks', () => {
  it('reports a variant that serves the page itself', () => {
    expect(
      evidenceOf(
        'HOST_VARIANT_SERVES_CONTENT',
        healthySite({
          hostVariants: [
            {
              url: 'http://www.a.example/',
              status: 200,
              redirects: [],
              finalUrl: 'http://www.a.example/',
            },
          ],
        }),
      ),
    ).toEqual([
      'http://www.a.example/ answered 200 itself, without redirecting',
      `The site serves its pages from ${SERVED}`,
    ]);
  });

  it('reports a two-hop, temporary chain, quoting every hop', () => {
    expect(
      evidenceOf(
        'HOST_REDIRECT_CHAIN',
        healthySite({
          hostVariants: [
            {
              url: 'http://a.example/',
              status: 200,
              redirects: [
                { url: 'http://a.example/', status: 302 },
                { url: 'https://a.example/', status: 301 },
              ],
              finalUrl: `${SERVED}/`,
            },
          ],
        }),
      ),
    ).toEqual([
      `302 http://a.example/ → https://a.example/, 301 https://a.example/ → ${SERVED}/ — 2 hops; temporary 302`,
    ]);
  });

  it('reports a missing page answered with 200', () => {
    expect(
      verdictOf(
        'SOFT_404',
        healthySite({
          missingPage: {
            url: `${SERVED}/seo-keyword-tracker-missing-page-1/`,
            status: 200,
            redirects: [],
            finalUrl: `${SERVED}/seo-keyword-tracker-missing-page-1/`,
          },
        }),
      ),
    ).toMatchObject({ status: 'failed', severity: 'warning' });
  });
});
