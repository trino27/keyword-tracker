import { RobotsPolicy } from '../robots-policy/robots-policy';
import type { TBlogSelection } from '../sitemap-scoring/sitemap-scoring';
import type { IBlogSourceContext, TFetchedHtml } from './blog-source.interface';
import {
  BLOG_SOURCES,
  CONFIRMED_SITEMAP_SOURCE,
  FEED_SOURCE,
  LISTING_SOURCE,
  UNCONFIRMED_SITEMAP_SOURCE,
} from './blog-sources';

const ORIGIN = 'https://a.example';
const SITE_KEY = 'a.example';

function selection(confirmed: boolean): TBlogSelection {
  const group = {
    key: '/post-sitemap.xml',
    sitemapUrls: [`${ORIGIN}/post-sitemap.xml`],
    urls: [`${ORIGIN}/p/one/`, `${ORIGIN}/p/two/`],
    order: 0,
    news: false,
  };
  return {
    ok: true,
    confirmed,
    reason: 'post-sitemap.xml scored 6.',
    winner: {
      group,
      score: 6,
      nameScore: 3,
      nameTerms: ['"post" +2'],
      pathShareScore: 3,
      pathSection: 'blog',
      feedShareScore: 0,
      feedMatches: 0,
    },
  };
}

function html(text: string): TFetchedHtml {
  return { status: 200, text, finalUrl: `${ORIGIN}/blog/` };
}

function context(
  overrides: Partial<IBlogSourceContext> = {},
): IBlogSourceContext {
  return {
    origin: ORIGIN,
    siteKey: SITE_KEY,
    robots: RobotsPolicy.allowAll(),
    sitemapsRead: 0,
    selection: { ok: false, best: null },
    feed: { feedUrl: null, keys: new Set(), links: [] },
    fetchHtml: () => Promise.resolve(null),
    ...overrides,
  };
}

describe('BLOG_SOURCES', () => {
  it('is the order of confidence, and the only place it is written', () => {
    expect(BLOG_SOURCES.map((source) => source.name)).toEqual([
      'sitemap',
      'feed',
      'listing',
      'unconfirmed-sitemap',
    ]);
  });

  it('declines rather than fails when a source has nothing to offer', async () => {
    const empty = context();
    const answers = await Promise.all(
      BLOG_SOURCES.map((source) => source.find(empty)),
    );
    expect(answers).toEqual([null, null, null, null]);
  });
});

describe('CONFIRMED_SITEMAP_SOURCE', () => {
  it('answers with the winning group and trusts its entries are posts', async () => {
    const found = await CONFIRMED_SITEMAP_SOURCE.find(
      context({ selection: selection(true) }),
    );
    expect(found).toEqual({
      sources: [`${ORIGIN}/post-sitemap.xml`],
      candidates: [`${ORIGIN}/p/one/`, `${ORIGIN}/p/two/`],
      reason: 'post-sitemap.xml scored 6.',
      articlesOnly: false,
    });
  });

  it('declines an unconfirmed winner, which the last source takes', async () => {
    const unconfirmed = context({ selection: selection(false) });
    expect(await CONFIRMED_SITEMAP_SOURCE.find(unconfirmed)).toBeNull();
    expect(await UNCONFIRMED_SITEMAP_SOURCE.find(unconfirmed)).toMatchObject({
      articlesOnly: true,
    });
  });
});

describe('FEED_SOURCE', () => {
  const feed = {
    feedUrl: `${ORIGIN}/feed/`,
    keys: new Set<string>(),
    links: [`${ORIGIN}/p/one/`],
  };

  it('says why the feed was read: no sitemap at all', async () => {
    const found = await FEED_SOURCE.find(context({ feed, sitemapsRead: 0 }));
    expect(found?.reason).toBe(
      `No sitemap found; read the feed ${ORIGIN}/feed/ (1 posts, newest first).`,
    );
    expect(found?.articlesOnly).toBe(false);
  });

  it('says why the feed was read: sitemaps, none of them a blog', async () => {
    const found = await FEED_SOURCE.find(context({ feed, sitemapsRead: 4 }));
    expect(found?.reason).toContain('No sitemap looks like a blog');
  });

  it('declines a feed with no items', async () => {
    const empty = { ...feed, links: [] };
    expect(await FEED_SOURCE.find(context({ feed: empty }))).toBeNull();
  });
});

describe('LISTING_SOURCE', () => {
  const posts = (count: number) =>
    Array.from(
      { length: count },
      (_, i) => `<a href="${ORIGIN}/blog/post-${i}/">Post ${i}</a>`,
    ).join('');

  it('takes the first index page that links to enough posts', async () => {
    const fetchHtml = jest
      .fn<Promise<TFetchedHtml | null>, [string]>()
      .mockResolvedValueOnce(html(posts(5)));
    const found = await LISTING_SOURCE.find(context({ fetchHtml }));

    expect(fetchHtml).toHaveBeenCalledWith(`${ORIGIN}/blog/`);
    expect(found?.sources).toEqual([`${ORIGIN}/blog/`]);
    expect(found?.candidates).toHaveLength(5);
    // It cannot tell a post from any other page it links to.
    expect(found?.articlesOnly).toBe(true);
  });

  it('passes over a page with too few post links', async () => {
    const fetchHtml = jest
      .fn<Promise<TFetchedHtml | null>, [string]>()
      .mockResolvedValue(html(posts(2)));
    expect(await LISTING_SOURCE.find(context({ fetchHtml }))).toBeNull();
    expect(fetchHtml.mock.calls.length).toBeGreaterThan(1);
  });

  it('does not fetch a path robots.txt disallows', async () => {
    const fetchHtml = jest
      .fn<Promise<TFetchedHtml | null>, [string]>()
      .mockResolvedValue(null);
    const robots = RobotsPolicy.parse(
      `${ORIGIN}/robots.txt`,
      'User-agent: *\nDisallow: /blog/',
    );
    await LISTING_SOURCE.find(context({ fetchHtml, robots }));

    expect(fetchHtml).not.toHaveBeenCalledWith(`${ORIGIN}/blog/`);
  });
});
