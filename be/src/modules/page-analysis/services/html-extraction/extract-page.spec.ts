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
    // Headings are read as headings; `blocks` is the prose between them.
    expect(parsed.blocks).toEqual(['One two three.', 'Four five']);
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

    expect(parsed.blocks).toEqual(['Rome is warm.']);
  });

  it('does not mistake a related-post card for the article, h1 and all', () => {
    // canadiangeographic.ca does not wrap the post in an <article> at all, and the
    // cards under it are <article>s with an <h1> each. Taking the first one gave a
    // 2,555-word feature a word count of 30.
    const parsed = page(
      '<main><h1>Falling in love with Kananaskis</h1>' +
        '<p>The valley holds a quiet that the highway never reaches at dawn.</p>' +
        '<p>Mount Engadine Lodge sits where the moose come down to feed.</p>' +
        '<article><h1>Glacier ghosts of the Rockies</h1></article>' +
        '</main>',
    );

    expect(parsed.wordCount).toBeGreaterThan(20);
    expect(parsed.blocks[0]).toContain('The valley holds a quiet');
  });

  it('does not mistake a listing card for the article', () => {
    const parsed = page(
      '<main><h1>All posts</h1><article><p>A card</p></article>' +
        '<p>And the rest</p></main>',
    );

    expect(parsed.blocks).toEqual(['A card', 'And the rest']);
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

    expect(parsed.blocks).toEqual(['The story itself.']);
  });

  it('keeps a container whose class merely NAMES the furniture beside it', () => {
    // ratehub.ca wraps the article in `<div class="content-layout with-sidebar">`.
    // The fragment match took the whole post with it and stored a 1,842-word guide
    // as empty: a node holding most of the page is the page, not its furniture.
    const parsed = page(
      '<main><div class="content-layout with-sidebar">' +
        '<h1>Fall home maintenance checklist</h1>' +
        '<p>Clean the eavestroughs before the first frost arrives this year.</p>' +
        '<p>Seal the gaps a raccoon would otherwise find before November.</p>' +
        '<aside class="sidebar-content"><p>Compare quotes</p></aside>' +
        '</div></main>',
    );

    expect(parsed.blocks).toEqual([
      'Clean the eavestroughs before the first frost arrives this year.',
      'Seal the gaps a raccoon would otherwise find before November.',
    ]);
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
    expect(parsed.blocks).toEqual(['The platform runs the agent.']);
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
    expect(parsed.blocks).toEqual(['Visible copy.']);
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

  it('reads the viewport and the meta refresh, however the tag is cased', () => {
    const parsed = page(
      '',
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<meta HTTP-EQUIV="Refresh" content="0; url=/moved/">',
    );

    expect(parsed.viewport).toBe('width=device-width, initial-scale=1');
    expect(parsed.metaRefresh).toBe('0; url=/moved/');
    expect(page('').viewport).toBeNull();
    expect(page('').metaRefresh).toBeNull();
  });

  /**
   * Order and duplicates are kept: a page naming one language twice with two URLs has a
   * defect HREFLANG_INVALID exists to report, and de-duplicating here would hide it
   * before the check could see it. The href is resolved as a browser resolves it.
   */
  it('reads hreflang alternates as written, with their URLs resolved', () => {
    expect(
      page(
        '',
        '<link rel="alternate" hreflang="en" href="/post/">' +
          '<link rel="alternate" hreflang="en_US" href="https://a.example/us/">' +
          '<link rel="alternate" href="/feed/" type="application/rss+xml">',
      ).alternates,
    ).toEqual([
      { lang: 'en', href: 'https://a.example/post/' },
      { lang: 'en_US', href: 'https://a.example/us/' },
    ]);
  });

  /**
   * The whole document, not the main content: a tracking script in <head> fetched over
   * plain HTTP breaks the padlock exactly as a body image does. `srcset` and `data-src`
   * are read because a lazy-loading theme puts the real image in one of them and a
   * placeholder in `src` — reading `src` alone would call such a page clean.
   */
  it('collects every subresource URL, srcset candidates and lazy sources included', () => {
    const parsed = page(
      '<main><p>Copy.</p>' +
        '<img src="http://a.example/one.png" ' +
        'srcset="http://a.example/two.png 1x, /three.png 2x">' +
        '<img data-src="http://a.example/lazy.png" src="/placeholder.gif">' +
        '</main>',
      '<script src="http://cdn.example/t.js"></script>' +
        '<link rel="stylesheet" href="/site.css">',
    );

    expect([...parsed.resourceUrls].sort()).toEqual([
      'http://a.example/lazy.png',
      'http://a.example/one.png',
      'http://a.example/two.png',
      'http://cdn.example/t.js',
      'https://a.example/placeholder.gif',
      'https://a.example/site.css',
      'https://a.example/three.png',
    ]);
  });

  /**
   * Links come from the main content only, so what is collected is what the author wrote.
   * The nav and the related-posts rail are gone by then — counting them would make "this
   * page links somewhere" true of every page a theme renders.
   */
  it('collects the main content links and not the furniture around them', () => {
    expect(
      page(
        '<nav><a href="/home/">Home</a></nav>' +
          '<main><p>See <a href="/other/">the other post</a> and ' +
          '<a href="https://b.example/x">theirs</a>.</p>' +
          '<aside class="related"><a href="/related/">Related</a></aside></main>',
      ).links,
    ).toEqual(['https://a.example/other/', 'https://b.example/x']);
  });

  /**
   * Only the article node's own properties, and only those carrying something. A
   * BreadcrumbList beside the post has an `itemListElement` and no `author`, and a union
   * over every node would report the breadcrumb's fields as the article's; WordPress
   * emits `"author": ""` for a field nobody filled in.
   */
  it('reads the filled-in fields of an article node, and no other node', () => {
    const parsed = page(
      '',
      '<script type="application/ld+json">' +
        JSON.stringify({
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: 'A post',
              author: { '@id': '#person' },
              image: [],
              publisher: '',
            },
            { '@type': 'BreadcrumbList', itemListElement: ['Home'] },
          ],
        }) +
        '</script>',
    );

    expect([...parsed.jsonLd.articleFields].sort()).toEqual([
      'author',
      'headline',
    ]);
    expect(parsed.jsonLd.types).toContain('BreadcrumbList');
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
      jsonLd: { types: [], keywords: [], articleFields: [] },
      wordCount: 0,
    });
  });
});
