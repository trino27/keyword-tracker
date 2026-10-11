import { evidenceOf, failsWith } from '../checks/_testing/expect-verdict';
import {
  faviconInvalid,
  faviconTargetOf,
  siteNameInconsistent,
  siteNameNotDeclared,
} from './home-checks';
import type {
  IFaviconAnswer,
  IHomePage,
  ISiteCheckInput,
} from './site-check.interface';

const HOME = 'https://a.example/';

/** The first bytes of a PNG of the given size: signature, then the IHDR chunk. */
function pngHead(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

const text = (value: string) => new TextEncoder().encode(value);

const home = (overrides: Partial<IHomePage> = {}): IHomePage => ({
  url: HOME,
  icons: [
    { rel: 'icon', href: `${HOME}favicon.png`, type: 'image/png', sizes: null },
  ],
  websiteNames: [{ name: 'A Example', alternateNames: [] }],
  ogSiteName: 'A Example',
  ...overrides,
});

const answer = (overrides: Partial<IFaviconAnswer> = {}): IFaviconAnswer => ({
  url: `${HOME}favicon.png`,
  status: 200,
  head: pngHead(48, 48),
  blockedBy: null,
  ...overrides,
});

const input = (
  homePage: IHomePage | null,
  favicon: IFaviconAnswer | null = answer(),
) => ({ home: homePage, favicon }) as ISiteCheckInput;

describe('faviconTargetOf', () => {
  it('takes the first icon in a format Google supports', () => {
    expect(
      faviconTargetOf(
        home({
          icons: [
            {
              rel: 'icon',
              href: `${HOME}i.svg`,
              type: 'image/svg+xml',
              sizes: null,
            },
            { rel: 'icon', href: `${HOME}i.ico`, type: null, sizes: null },
          ],
        }),
      ),
    ).toEqual({
      href: `${HOME}i.ico`,
      icon: expect.objectContaining({ href: `${HOME}i.ico` }),
    });
  });

  // ghost.org and moz.com declare none and serve /favicon.ico (2026-10).
  it('falls back to /favicon.ico when the page declares no icon', () => {
    expect(faviconTargetOf(home({ icons: [] }))).toEqual({
      href: `${HOME}favicon.ico`,
      icon: null,
    });
  });

  it('has nothing to fetch when every icon is SVG', () => {
    expect(
      faviconTargetOf(
        home({
          icons: [
            { rel: 'icon', href: `${HOME}i.svg`, type: null, sizes: null },
          ],
        }),
      ),
    ).toBeNull();
  });
});

describe('FAVICON_INVALID', () => {
  it('passes a square PNG Google may fetch', () => {
    expect(faviconInvalid(input(home()))).toEqual({ outcome: 'pass' });
  });

  it('passes a site relying on a working /favicon.ico', () => {
    expect(
      faviconInvalid(
        input(home({ icons: [] }), answer({ url: `${HOME}favicon.ico` })),
      ),
    ).toEqual({ outcome: 'pass' });
  });

  it('fails a site that declares no icon and serves none at /favicon.ico', () => {
    const result = faviconInvalid(
      input(
        home({ icons: [] }),
        answer({
          url: `${HOME}favicon.ico`,
          status: 404,
          head: new Uint8Array(),
        }),
      ),
    );
    expect(result).toEqual(failsWith({ reason: 'none' }));
    expect(evidenceOf(result)[1]).toBe(`GET ${HOME}favicon.ico answered 404`);
  });

  it('fails an SVG-only icon', () => {
    expect(
      faviconInvalid(
        input(
          home({
            icons: [
              {
                rel: 'icon',
                href: `${HOME}i.svg`,
                type: 'image/svg+xml',
                sizes: null,
              },
            ],
          }),
          null,
        ),
      ),
    ).toEqual(failsWith({ reason: 'format' }));
  });

  it('fails an icon robots.txt keeps from Googlebot-Image', () => {
    expect(
      faviconInvalid(
        input(
          home(),
          answer({ status: null, blockedBy: 'line 3: Disallow: /' }),
        ),
      ),
    ).toEqual(failsWith({ reason: 'blocked' }));
  });

  // blog.cloudflare.com's favicon.ico is a 99×96 PNG (2026-10).
  it('fails an icon that is not square', () => {
    expect(
      faviconInvalid(input(home(), answer({ head: pngHead(99, 96) }))),
    ).toEqual(failsWith({ reason: 'notSquare', width: 99, height: 96 }));
  });

  it('fails an icon under 8×8 px', () => {
    expect(
      faviconInvalid(input(home(), answer({ head: pngHead(4, 4) }))),
    ).toEqual(failsWith({ reason: 'tooSmall' }));
  });

  it('fails an icon address that answers an HTML page', () => {
    expect(
      faviconInvalid(
        input(home(), answer({ head: text('<!DOCTYPE html><html>') })),
      ),
    ).toEqual(failsWith({ reason: 'format' }));
  });

  // dev.to's CDN answers WebP to a request that accepts any image (2026-10).
  it('passes a format the server negotiated', () => {
    expect(
      faviconInvalid(
        input(
          home(),
          answer({ head: text('RIFF\u0000\u0000\u0000\u0000WEBPVP8X') }),
        ),
      ),
    ).toEqual({ outcome: 'pass' });
  });

  it('cannot be judged without the home page, or without the icon fetched', () => {
    expect(faviconInvalid(input(null))).toEqual({ outcome: 'notApplicable' });
    expect(faviconInvalid(input(home(), null))).toEqual({
      outcome: 'notApplicable',
    });
  });
});

describe('SITE_NAME_NOT_DECLARED', () => {
  it('passes a home page with WebSite markup', () => {
    expect(siteNameNotDeclared(input(home()))).toEqual({ outcome: 'pass' });
  });

  it('fails a home page without it, quoting og:site_name', () => {
    const result = siteNameNotDeclared(
      input(home({ websiteNames: [], ogSiteName: 'Хабр' })),
    );
    expect(evidenceOf(result)).toEqual([
      `${HOME} carries no WebSite structured data with a name`,
      '<meta property="og:site_name" content="Хабр"> is there',
    ]);
  });

  it('cannot be judged without the home page', () => {
    expect(siteNameNotDeclared(input(null))).toEqual({
      outcome: 'notApplicable',
    });
  });
});

describe('SITE_NAME_INCONSISTENT', () => {
  it('passes names that differ only in case and punctuation', () => {
    expect(
      siteNameInconsistent(
        input(
          home({
            websiteNames: [{ name: 'Search Engine Land', alternateNames: [] }],
            ogSiteName: 'search-engine land',
          }),
        ),
      ),
    ).toEqual({ outcome: 'pass' });
  });

  it('passes og:site_name listed as an alternate name', () => {
    expect(
      siteNameInconsistent(
        input(
          home({
            websiteNames: [
              { name: 'News from Google', alternateNames: ['blog.google'] },
            ],
            ogSiteName: 'blog.google',
          }),
        ),
      ),
    ).toEqual({ outcome: 'pass' });
  });

  // blog.google, 2026-10.
  it('fails two names for one site', () => {
    expect(
      siteNameInconsistent(
        input(
          home({
            websiteNames: [{ name: 'News from Google', alternateNames: [] }],
            ogSiteName: 'blog.google',
          }),
        ),
      ),
    ).toEqual(
      failsWith({ names: ['News from Google'], ogSiteName: 'blog.google' }),
    );
  });

  it('cannot be judged without both names', () => {
    expect(siteNameInconsistent(input(home({ ogSiteName: null })))).toEqual({
      outcome: 'notApplicable',
    });
    expect(siteNameInconsistent(input(home({ websiteNames: [] })))).toEqual({
      outcome: 'notApplicable',
    });
  });
});
