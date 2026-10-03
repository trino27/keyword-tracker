import {
  groupKeyOf,
  groupSitemaps,
  nameScoreOf,
  pageKeyOf,
  scoreGroup,
  selectBlogGroup,
  type ISitemapGroup,
} from './sitemap-scoring';

const group = (
  sitemapUrl: string,
  urls: string[],
  order = 0,
): ISitemapGroup => ({
  key: groupKeyOf(sitemapUrl),
  sitemapUrls: [sitemapUrl],
  urls,
  order,
});

const posts = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `https://a.example${prefix}p${i}/`);

const feedOf = (urls: string[]) => new Set(urls.map((url) => pageKeyOf(url)!));

describe('groupKeyOf / groupSitemaps', () => {
  it.each([
    ['https://a.example/post-sitemap2.xml', 'a.example/post-sitemap.xml'],
    ['https://a.example/post-sitemap.xml', 'a.example/post-sitemap.xml'],
    [
      'https://a.example/sitemap-posts-3.xml.gz',
      'a.example/sitemap-posts-.xml.gz',
    ],
    ['https://a.example/blog/sitemap/', 'a.example/blog/sitemap/'],
  ])('%s → %s', (url, key) => {
    expect(groupKeyOf(url)).toBe(key);
  });

  it('joins numbered siblings in index order, URLs concatenated', () => {
    const groups = groupSitemaps([
      { url: 'https://a.example/post-sitemap2.xml', urls: ['b'], order: 1 },
      { url: 'https://a.example/page-sitemap.xml', urls: ['p'], order: 2 },
      { url: 'https://a.example/post-sitemap.xml', urls: ['a'], order: 0 },
    ]);

    expect(groups.map((g) => [g.sitemapUrls, g.urls])).toEqual([
      [
        [
          'https://a.example/post-sitemap.xml',
          'https://a.example/post-sitemap2.xml',
        ],
        ['a', 'b'],
      ],
      [['https://a.example/page-sitemap.xml'], ['p']],
    ]);
  });
});

describe('nameScoreOf', () => {
  it.each([
    ['https://a.example/blog/sitemap/', 3],
    ['https://a.example/post-sitemap.xml', 2],
    ['https://a.example/news-sitemap.xml', 1],
    ['https://a.example/page-sitemap.xml', -3],
    ['https://a.example/blog-tags.xml', 0],
    ['https://a.example/sitemap.xml', 0],
    ['https://a.example/products-pages-sitemap.xml', -3],
  ])('%s scores %d', (url, score) => {
    expect(nameScoreOf(url).score).toBe(score);
  });
});

describe('scoreGroup — the §10.1 expectations', () => {
  it('a /blog/ sitemap whose URLs the feed lists ≈ 3 + 3 + 4', () => {
    const urls = posts('/blog/', 20);

    const score = scoreGroup(
      group('https://a.example/blog/sitemap/', urls),
      feedOf(urls.slice(0, 10)),
    );

    expect(score.score).toBe(10);
  });

  it('a root-level post sitemap without a feed scores exactly the threshold, 2', () => {
    expect(
      scoreGroup(
        group('https://a.example/post-sitemap.xml', posts('/', 20)),
        new Set(),
      ).score,
    ).toBe(2);
  });

  it('a pages-only sitemap.xml scores 0', () => {
    expect(
      scoreGroup(
        group('https://a.example/sitemap.xml', [
          'https://a.example/about/',
          'https://a.example/pricing/',
        ]),
        new Set(),
      ).score,
    ).toBe(0);
  });

  it('feed matching ignores scheme, www and the trailing slash', () => {
    const score = scoreGroup(
      group('https://a.example/x.xml', ['https://www.a.example/post']),
      feedOf(['http://a.example/post/']),
    );

    expect(score.feedShareScore).toBe(4);
  });
});

describe('selectBlogGroup', () => {
  it('picks the highest score and explains why', () => {
    const blog = posts('/', 20);
    const selection = selectBlogGroup(
      [
        group('https://a.example/page-sitemap.xml', posts('/', 3), 0),
        group('https://a.example/post-sitemap.xml', blog, 1),
      ],
      feedOf(blog.slice(0, 5)),
    );

    expect(selection.ok && selection.winner.group.sitemapUrls).toEqual([
      'https://a.example/post-sitemap.xml',
    ]);
    expect(selection.ok && selection.reason).toBe(
      'Selected https://a.example/post-sitemap.xml with score 6: name "post" +2; path share 0; feed share 4 (5 of 5 feed items).',
    );
  });

  it('breaks a tie by more URLs, then by index order', () => {
    const bigger = selectBlogGroup(
      [
        group('https://a.example/post-a.xml', posts('/a/', 2), 0),
        group('https://a.example/post-b.xml', posts('/b/', 5), 1),
      ],
      new Set(),
    );
    const earlier = selectBlogGroup(
      [
        group('https://a.example/post-a.xml', posts('/a/', 5), 0),
        group('https://a.example/post-b.xml', posts('/b/', 5), 1),
      ],
      new Set(),
    );

    expect(bigger.ok && bigger.winner.group.key).toBe('a.example/post-b.xml');
    expect(earlier.ok && earlier.winner.group.key).toBe('a.example/post-a.xml');
  });

  it('refuses when nothing reaches the threshold', () => {
    const selection = selectBlogGroup(
      [group('https://a.example/sitemap.xml', posts('/', 4))],
      new Set(),
    );

    expect(selection).toMatchObject({ ok: false, best: { score: 0 } });
  });
});
