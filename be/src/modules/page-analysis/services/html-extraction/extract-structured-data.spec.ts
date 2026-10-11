import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { extractPage } from './extract-page';

const recorded = (file: string, url: string) =>
  extractPage(readFileSync(join(FIXTURES_ROOT, 'sites', file), 'utf8'), url);

const page = (body: string, head = '') =>
  extractPage(
    `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`,
    'https://a.example/post/',
  );

const jsonLd = (value: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(value)}</script>`;

describe('extractPage: the article as its markup states it', () => {
  /**
   * Yoast's graph names the author by reference, and the Person node it names has no
   * `url` — only a sameAs list that opens with the site itself.
   */
  it('follows the author reference into the graph (yoast)', () => {
    const parsed = recorded(
      'yoast/7-reasons-to-come-to-yoastcon/index.html',
      'https://yoast.com/7-reasons-to-come-to-yoastcon/',
    );

    expect(parsed.articleMarkup).toMatchObject({
      source: 'json-ld',
      type: 'Article',
      headline: '7 reasons to come to YoastCon',
      datePublished: '2019-01-24T11:17:59+00:00',
      images: [{ width: 1200, height: 628 }],
    });
    const [author] = parsed.articleMarkup!.authors;
    expect(author).toMatchObject({
      name: 'Marieke van de Rakt',
      type: 'Person',
    });
    expect(author.urls[0]).toBe('https://yoast.com/');
    expect(author.urls).toContain('https://www.linkedin.com/in/mariekerakt');
    expect(parsed.logos.length).toBeGreaterThan(0);
    expect(parsed.websiteNames).toEqual([
      { name: 'Yoast', alternateNames: [] },
    ]);
  });

  it('reads every step of a BreadcrumbList (semrush)', () => {
    const parsed = recorded(
      'semrush/blog/ai-marketing/index.html',
      'https://www.semrush.com/blog/ai-marketing/',
    );

    expect(parsed.breadcrumbs).toEqual([
      [
        { position: 1, name: 'Semrush', item: 'https://www.semrush.com/' },
        { position: 2, name: 'Blog', item: 'https://www.semrush.com/blog/' },
        {
          position: 3,
          name: 'AI Marketing Guide: Tools + Use Cases for Marketers',
          item: 'https://www.semrush.com/blog/ai-marketing/',
        },
      ],
    ]);
  });

  it('keeps an author given as a bare string, and a missing name', () => {
    const parsed = page(
      jsonLd({
        '@type': 'NewsArticle',
        author: ['Gazeta', { '@type': 'Person', name: null }],
      }),
    );

    expect(parsed.articleMarkup?.authors).toEqual([
      { name: 'Gazeta', type: null, urls: [], asText: true },
      { name: null, type: 'Person', urls: [], asText: false },
    ]);
  });

  it('reads an ImageObject size written as text or a QuantitativeValue', () => {
    const parsed = page(
      jsonLd({
        '@type': 'BlogPosting',
        image: [
          { '@type': 'ImageObject', url: '/a.jpg', width: '1200', height: 675 },
          {
            '@type': 'ImageObject',
            contentUrl: '/b.jpg',
            width: { '@type': 'QuantitativeValue', value: 800 },
          },
          '/c.jpg',
        ],
      }),
    );

    expect(parsed.articleMarkup?.images).toEqual([
      { url: 'https://a.example/a.jpg', width: 1200, height: 675 },
      { url: 'https://a.example/b.jpg', width: 800, height: null },
      { url: 'https://a.example/c.jpg', width: null, height: null },
    ]);
  });

  it('reads an article written in Microdata, as Google does', () => {
    const parsed = page(`
      <article itemscope itemtype="https://schema.org/BlogPosting">
        <h1 itemprop="headline">A post in Microdata</h1>
        <time itemprop="datePublished" datetime="2026-10-03T09:00:00+03:00">3 October</time>
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <a itemprop="url" href="/author/jane/"><span itemprop="name">Jane Doe</span></a>
        </span>
        <img itemprop="image" src="/hero.jpg" alt="A hero">
        <p>Text.</p>
      </article>
      <div itemscope itemtype="https://schema.org/WebSite"><meta itemprop="name" content="A Example"></div>`);

    expect(parsed.microdata.types).toEqual([
      'BlogPosting',
      'Person',
      'WebSite',
    ]);
    expect(parsed.microdata.articleFields.sort()).toEqual([
      'author',
      'datePublished',
      'headline',
      'image',
    ]);
    expect(parsed.articleMarkup).toEqual({
      source: 'microdata',
      type: 'BlogPosting',
      headline: 'A post in Microdata',
      datePublished: '2026-10-03T09:00:00+03:00',
      dateModified: null,
      authors: [
        {
          name: 'Jane Doe',
          type: 'Person',
          urls: ['https://a.example/author/jane/'],
          asText: false,
        },
      ],
      images: [
        { url: 'https://a.example/hero.jpg', width: null, height: null },
      ],
    });
    expect(parsed.websiteNames).toEqual([
      { name: 'A Example', alternateNames: [] },
    ]);
  });

  it('prefers the JSON-LD article to the Microdata one', () => {
    const parsed = page(
      `<div itemscope itemtype="https://schema.org/Article"><span itemprop="headline">Micro</span></div>${jsonLd({ '@type': 'Article', headline: 'JSON' })}`,
    );
    expect(parsed.articleMarkup?.headline).toBe('JSON');
  });
});

describe('extractPage: icons, videos and the snippet', () => {
  // neilpatel.com writes its icon link where a parser has already ended <head>.
  it('reads icon links wherever the document puts them', () => {
    const parsed = page(
      '<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon"><p>x</p>',
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple.png">',
    );

    expect(parsed.icons).toEqual([
      {
        rel: 'apple-touch-icon',
        href: 'https://a.example/apple.png',
        type: null,
        sizes: '180x180',
      },
      {
        rel: 'icon',
        href: 'https://a.example/favicon.ico',
        type: 'image/x-icon',
        sizes: null,
      },
    ]);
  });

  it('reads the videos a reader can play, not background loops', () => {
    const parsed = page(`
      <iframe src="https://www.youtube.com/embed/abc"></iframe>
      <iframe data-src="//player.vimeo.com/video/1"></iframe>
      <iframe src="https://www.google.com/maps/embed?pb=1"></iframe>
      <video src="/clip.mp4" controls></video>
      <video src="/loop.mp4" muted playsinline loop></video>
      <footer><iframe src="https://www.youtube.com/embed/footer"></iframe></footer>`);

    expect(parsed.videos).toHaveLength(3);
    expect(parsed.videos.join(' ')).not.toMatch(/maps|loop\.mp4|footer/);
  });

  it('names a data-nosnippet element holding most of the article', () => {
    const words = Array.from({ length: 80 }, (_, n) => `word${n}`).join(' ');
    expect(
      page(
        `<main><div class="entry" data-nosnippet><p>${words}</p></div></main>`,
      ).contentNosnippet,
    ).toBe('<div class="entry" data-nosnippet="">');
    expect(
      page(
        `<main><p>${words}</p><span data-nosnippet>A passage aside.</span></main>`,
      ).contentNosnippet,
    ).toBeNull();
  });
});
