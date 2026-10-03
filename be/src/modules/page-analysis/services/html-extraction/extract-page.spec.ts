import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { extractPage } from './extract-page';

const recorded = (file: string, url: string) =>
  extractPage(readFileSync(join(FIXTURES_ROOT, 'sites', file), 'utf8'), url);

const page = (body: string, head = '') =>
  extractPage(
    `<!doctype html><html lang="en-GB"><head>${head}</head><body>${body}</body></html>`,
    'https://a.example/post/',
  );

describe('extractPage', () => {
  it('reads the title from <head>, never from an SVG in the body (semrush)', () => {
    const parsed = recorded(
      'semrush/blog/seo-specialist/index.html',
      'https://www.semrush.com/blog/seo-specialist/',
    );

    expect(parsed.title).toBe(
      'What Is an SEO Specialist and How to Become One',
    );
    expect(parsed.lang).toBe('en');
    expect(parsed.wordCount).toBeGreaterThan(300);
  });

  it('reads JSON-LD keywords and types (yoast)', () => {
    const parsed = recorded(
      'yoast/how-to-remove-www-from-your-url/index.html',
      'https://yoast.com/how-to-remove-www-from-your-url/',
    );

    expect(parsed.title).toBe('How to remove www from your URL • Yoast');
    expect(parsed.jsonLd.keywords).toEqual(
      expect.arrayContaining(['Domains', 'Technical SEO', 'URL']),
    );
    expect(parsed.jsonLd.types).toContain('Article');
    expect(parsed.h1s.length).toBeGreaterThan(0);
  });

  it('sees that yoast /seo-blog/ declares itself a CollectionPage', () => {
    const parsed = recorded(
      'yoast/seo-blog/index.html',
      'https://yoast.com/seo-blog/',
    );

    expect(parsed.jsonLd.types).toContain('CollectionPage');
  });

  it('reads main content without nav, header, footer and aside', () => {
    const parsed = page(
      `<header><h1>Site name</h1></header><nav><p>Menu words here</p></nav>
       <main><h1>Real title</h1><p>One two three.</p><h2>Part</h2><ul><li>Four five</li></ul></main>
       <aside><p>Related links</p></aside><footer><p>Copyright</p></footer>`,
    );

    expect(parsed.headings).toEqual([
      { level: 1, text: 'Real title' },
      { level: 2, text: 'Part' },
    ]);
    expect(parsed.blocks).toEqual([
      'Real title',
      'One two three.',
      'Part',
      'Four five',
    ]);
    expect(parsed.wordCount).toBe(8);
    expect(parsed.firstParagraph).toBe('One two three.');
    expect(parsed.h1s).toEqual(['Site name', 'Real title']);
  });

  it('falls back to <article>, then <body>', () => {
    expect(
      page('<article><p>In article</p></article><p>Outside</p>').blocks,
    ).toEqual(['In article']);
    expect(page('<div>Just text</div>').blocks).toEqual(['Just text']);
  });

  it('prefers the <article> holding the h1 over the <main> around it', () => {
    // travelsmart.bg closes </article> and opens its related posts next to it, inside
    // the same <main>; reading <main> made other destinations the post's keywords.
    const parsed = page(
      '<main>' +
        '<article><h1>Flights to Rome</h1><p>Rome is warm.</p></article>' +
        '<div class="ast-single-related-posts-container">' +
        '<h2>Similar offers</h2><p>Flights to Karlsruhe</p>' +
        '</div>' +
        '</main>',
    );

    expect(parsed.blocks).toEqual(['Flights to Rome', 'Rome is warm.']);
  });

  it('does not mistake a listing card for the article', () => {
    const parsed = page(
      '<main><h1>All posts</h1><article><p>A card</p></article>' +
        '<p>And the rest</p></main>',
    );

    expect(parsed.blocks).toEqual(['All posts', 'A card', 'And the rest']);
  });

  it('removes the furniture a theme builds out of plain divs', () => {
    const parsed = page(
      '<main><h1>Story</h1><p>The story itself.</p>' +
        '<ul class="c-infoBox__ul"><li>Another headline</li></ul>' +
        '<div class="sidebar"><p>Most popular</p></div>' +
        '<div class="newsletter-signup"><p>Subscribe now</p></div>' +
        '<div role="complementary"><p>Elsewhere on the site</p></div>' +
        '<div id="comments"><p>A reader said</p></div>' +
        '</main>',
    );

    expect(parsed.blocks).toEqual(['Story', 'The story itself.']);
  });

  it('reads head metadata, resolving the canonical', () => {
    const parsed = page(
      '<p>x</p>',
      `<title> A   title </title>
       <meta name="Description" content="The description">
       <meta name="robots" content="noindex, follow">
       <link rel="canonical" href="/canonical/">
       <meta property="og:title" content="OG">
       <meta property="article:tag" content="SEO">`,
    );

    expect(parsed).toMatchObject({
      title: 'A title',
      metaDescription: 'The description',
      metaRobots: 'noindex, follow',
      canonical: 'https://a.example/canonical/',
      openGraph: { 'og:title': 'OG' },
      articleTags: ['SEO'],
      lang: 'en-GB',
    });
  });

  // practices/search-engines/references/field-study-2026-10.md, finding 7.
  it('a copy-link control inside an h2 is not part of the heading (vercel.com)', () => {
    const parsed = page(
      '<main>' +
        '<h2 id="agentic-infrastructure">' +
        '<a href="#agentic-infrastructure" class="copy-link">' +
        '<span class="sr-only">Copy link to heading</span>' +
        '<svg aria-hidden="true"><path/></svg>' +
        '</a>' +
        'Agentic infrastructure' +
        '</h2>' +
        '<p>The platform runs the agent.</p>' +
        '</main>',
    );

    expect(parsed.headings).toEqual([
      { level: 2, text: 'Agentic infrastructure' },
    ]);
    expect(parsed.blocks).toEqual([
      'Agentic infrastructure',
      'The platform runs the agent.',
    ]);
  });

  it('strips a control from an h1 the same way, wherever the h1 sits', () => {
    expect(
      page(
        '<h1><button type="button">Copy link to heading</button>The future</h1>' +
          '<main><p>Words.</p></main>',
      ).h1s,
    ).toEqual(['The future']);
  });

  it('an element hidden from assistive technology contributes no text', () => {
    const parsed = page(
      '<main>' +
        '<h2><span aria-hidden="true">#</span>Rankings</h2>' +
        '<p>Visible copy.<span hidden>Hidden copy.</span>' +
        '<span class="visually-hidden">Label only.</span></p>' +
        '</main>',
    );

    expect(parsed.headings).toEqual([{ level: 2, text: 'Rankings' }]);
    expect(parsed.blocks).toEqual(['Rankings', 'Visible copy.']);
  });

  it('separates adjacent blocks so their words never fuse', () => {
    expect(page('<main><h1>Title</h1><p>One</p></main>').wordCount).toBe(2);
  });

  it('tells a missing alt from an empty one', () => {
    expect(
      page('<main><img src="a.png"><img src="b.png" alt=""></main>').images,
    ).toEqual([
      { src: 'a.png', alt: null },
      { src: 'b.png', alt: '' },
    ]);
  });

  it('survives broken JSON-LD and missing everything', () => {
    const parsed = extractPage(
      '<script type="application/ld+json">{broken</script>',
      'https://a.example/',
    );

    expect(parsed).toMatchObject({
      title: null,
      lang: null,
      canonical: null,
      jsonLd: { types: [], keywords: [] },
      wordCount: 0,
    });
  });
});
