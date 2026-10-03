import { extractListingLinks } from './listing-links';

const LISTING = 'https://a.example/blog/';

describe('extractListingLinks', () => {
  it('keeps same-site links below the listing, in page order, once each', () => {
    const html = `
      <nav><a href="/">Home</a><a href="/blog/">Blog</a><a href="/about/">About</a></nav>
      <article><a href="/blog/second-post/">Second</a></article>
      <article><a href="https://www.a.example/blog/first-post/#comments">First</a></article>
      <a href="/blog/second-post/">Read more</a>
      <a href="https://other.example/blog/x/">Elsewhere</a>`;

    expect(extractListingLinks(html, LISTING, 'a.example')).toEqual([
      'https://a.example/blog/second-post/',
      'https://www.a.example/blog/first-post/',
    ]);
  });

  it('drops links to more listings', () => {
    const html = `
      <a href="/blog/page/2/">Older</a>
      <a href="/blog/tag/seo/">SEO</a>
      <a href="/blog/category/news/">News</a>
      <a href="/blog/author/jane/">Jane</a>
      <a href="/blog/a-post/">A post</a>`;

    expect(extractListingLinks(html, LISTING, 'a.example')).toEqual([
      'https://a.example/blog/a-post/',
    ]);
  });

  it('works for a listing without a trailing slash and ignores mailto links', () => {
    const html =
      '<a href="mailto:x@a.example">Mail</a><a href="/news/today">Today</a>';

    expect(
      extractListingLinks(html, 'https://a.example/news', 'a.example'),
    ).toEqual(['https://a.example/news/today']);
  });
});
