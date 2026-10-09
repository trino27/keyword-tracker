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
      canonicals: ['https://a.example/canonical/'],
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
      expect.objectContaining({ src: 'a.png', alt: null }),
      expect.objectContaining({ src: 'b.png', alt: '' }),
    ]);
  });

  // What the CLS and LCP checks read: whether the box is reserved, and how it loads.
  it('reads how each content image loads and whether its box is reserved', () => {
    expect(
      page(
        '<main><img src="a.png" width="800" height="450" loading="LAZY">' +
          '<img src="b.png" style="aspect-ratio: 16/9; width: 100%">' +
          '<img src="c.png" width="800"></main>',
      ).images.map(({ loading, sized, markup }) => ({
        loading,
        sized,
        markup,
      })),
    ).toEqual([
      {
        loading: 'lazy',
        sized: true,
        markup: '<img src="a.png" width="800" height="450" loading="LAZY">',
      },
      {
        loading: null,
        sized: true,
        markup: '<img src="b.png" style="aspect-ratio: 16/9; width: 100%">',
      },
      { loading: null, sized: false, markup: '<img src="c.png" width="800">' },
    ]);
  });

  it('finds the parser-blocking scripts in <head>, and the font preloads without crossorigin', () => {
    const parsed = page(
      '<p>x</p>',
      '<script src="/jquery.js"></script><script src="/a.js" defer></script>' +
        '<script src="/b.js" async></script><script type="module" src="/m.js"></script>' +
        '<script type="application/ld+json">{}</script>' +
        '<link rel="preload" as="font" href="/f.woff2" type="font/woff2">' +
        '<link rel="preload" as="font" href="/g.woff2" crossorigin>',
    );

    expect(parsed.renderBlockingScripts).toEqual([
      '<script src="/jquery.js"></script>',
    ]);
    expect(parsed.fontPreloadsWithoutCrossorigin).toEqual([
      '<link rel="preload" as="font" href="/f.woff2" type="font/woff2">',
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

  /**
   * A relative href means what it means against `<base>`, exactly as Googlebot reads
   * it. Resolving against the page URL instead reported the links the author meant,
   * not the ones the page has — and a wrong `<base>` is precisely the defect that sends
   * a whole site's relative links somewhere else.
   */
  it('resolves every relative URL against <base href>', () => {
    const parsed = page(
      '<main><p><a href="other/">Other</a></p><img src="i.png"></main>',
      '<base href="https://a.example/blog/"><link rel="canonical" href="post/">',
    );

    expect(parsed.links).toEqual(['https://a.example/blog/other/']);
    expect(parsed.canonicals).toEqual(['https://a.example/blog/post/']);
    expect(parsed.resourceUrls).toContain('https://a.example/blog/i.png');
  });

  // Google accepts the canonical only in <head>. The parser decides where the head
  // ends, as a browser's does: an <img> in <head> closes it early.
  it('reads canonicals in <head> only, and keeps the ones in <body> apart', () => {
    const parsed = extractPage(
      '<!doctype html><html><head><link rel="Canonical" href="/one/">' +
        '<link rel="canonical" href="/two/"><link rel="canonical" href="/one/#x">' +
        '</head><body><link rel="canonical" href="/body/"><p>x</p></body></html>',
      'https://a.example/post/',
    );

    expect(parsed.canonicals).toEqual([
      'https://a.example/one/',
      'https://a.example/two/',
    ]);
    expect(parsed.canonicalsOutsideHead).toEqual(['https://a.example/body/']);
  });

  it('reads <meta name="googlebot"> beside <meta name="robots">', () => {
    expect(
      page('<p>x</p>', '<meta name="Googlebot" content="noindex">')
        .metaGooglebot,
    ).toBe('noindex');
  });

  /**
   * What a crawler can follow, what it is asked not to, and what it cannot follow at
   * all. `mailto:` names no page, `<a name>` is a target and `<a role="button">` is a
   * control: none of them is a link to judge.
   */
  it('sorts the content links by what a crawler can do with them', () => {
    const parsed = page(
      '<main><p>' +
        '<a href="/one/">One</a> <a href="/two/" rel="nofollow ugc">Two</a> ' +
        '<a href="mailto:x@a.example">Mail</a> <a name="top"></a> ' +
        '<a href="javascript:void(0)">Script</a> ' +
        `<a onclick="go('/three/')">Three</a> ` +
        '<a role="button" onclick="toggle()">Menu</a>' +
        '<a href="#/pricing">Pricing</a> <a href="/#!about">About</a>' +
        '<a href="https://forum.b.example/#!topic/1">Forum</a>' +
        '</p></main>',
    );

    expect(parsed.links).toEqual([
      'https://a.example/one/',
      'https://a.example/two/',
      // Another site's hashbang URL is its own routing: an ordinary outbound link.
      'https://forum.b.example/#!topic/1',
    ]);
    expect(parsed.nofollowLinks).toEqual(['https://a.example/two/']);
    expect(parsed.uncrawlableLinks).toEqual([
      '<a href="javascript:void(0)">Script</a>',
      `<a onclick="go('/three/')">Three</a>`,
      // Client-side routes in the fragment: Google drops everything after #.
      '<a href="#/pricing">Pricing</a>',
      '<a href="/#!about">About</a>',
    ]);
  });

  it('collects the scripts and stylesheets a renderer needs, and nothing else', () => {
    const parsed = page(
      '<main><img src="/i.png"><script src="/late.js"></script></main>',
      '<script src="/app.js"></script><link rel="stylesheet" href="/site.css">' +
        '<link rel="preload" href="/font.woff2">',
    );

    expect(parsed.renderResources).toEqual([
      'https://a.example/app.js',
      'https://a.example/late.js',
      'https://a.example/site.css',
    ]);
  });

  // Recorded: semrush's /analytics/traffic/competitor-monitoring ships an empty mount
  // point and nothing else — the one page of the corpus with no server-rendered text.
  it('recognises a client-rendered shell, and no real post as one', () => {
    expect(
      page('<div id="root"></div><script src="/app.js"></script>')
        .clientRendered,
    ).toBe(true);
    expect(
      page(
        '<div></div><noscript>You need to enable JavaScript to run this app.</noscript>',
      ).clientRendered,
    ).toBe(true);
    expect(
      recorded(
        'semrush/analytics/traffic/competitor-monitoring.html',
        'https://www.semrush.com/analytics/traffic/competitor-monitoring',
      ).clientRendered,
    ).toBe(true);
    expect(
      recorded(
        'semrush/blog/seo-specialist/index.html',
        'https://www.semrush.com/blog/seo-specialist/',
      ).clientRendered,
    ).toBe(false);
  });

  /**
   * An author is often a reference into the graph — `{"@id": "#jane"}` — and only the
   * node carrying that @id has the name. Each source is kept as the evidence it is.
   */
  it('names the author from the article graph and the markup alike', () => {
    const parsed = page(
      '<main><p>x</p><span itemprop="author"><span itemprop="name">Jane Doe</span></span>' +
        '<a rel="author" href="/team/jane/">Jane</a></main>',
      '<meta name="author" content="Jane Doe"><script type="application/ld+json">' +
        JSON.stringify({
          '@graph': [
            {
              '@type': 'BlogPosting',
              author: { '@id': '#jane' },
              datePublished: '2026-01-10',
              dateModified: '2026-02-01',
            },
            { '@type': 'Person', '@id': '#jane', name: 'Jane Doe' },
          ],
        }) +
        '</script>',
    );

    expect(parsed.authors).toEqual([
      'JSON-LD author: Jane Doe',
      '<meta name="author" content="Jane Doe">',
      '<a rel="author" href="https://a.example/team/jane/">',
      'itemprop="author": Jane Doe',
    ]);
    expect(parsed).toMatchObject({
      datePublished: '2026-01-10',
      dateModified: '2026-02-01',
    });
  });

  it('falls back to the article:* dates when the markup has none', () => {
    expect(
      page(
        '<p>x</p>',
        '<meta property="article:modified_time" content="2026-03-03T10:00:00+00:00">',
      ).dateModified,
    ).toBe('2026-03-03T10:00:00+00:00');
  });

  // The fingerprint is of the words, so markup around them does not move it.
  it('fingerprints the main text, not the markup around it', () => {
    const a = page('<main><p>Same words here.</p></main><footer>One</footer>');
    const b = page(
      '<main><div><p>Same   words here.</p></div></main><footer>Two</footer>',
    );
    const c = page('<main><p>Other words here.</p></main>');

    expect(a.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(b.contentHash).toBe(a.contentHash);
    expect(c.contentHash).not.toBe(a.contentHash);
  });

  /**
   * Strict JSON forbids a raw line break inside a string; Google's parser and every
   * structured-data validator accept one. CMSes paste a multi-line description into
   * the markup as is, so a strict parse throws the whole article node away.
   */
  it('reads an article whose string values carry raw line breaks (semrush)', () => {
    const parsed = recorded(
      'semrush/blog/seo-split-test-result-does-bolded-text-help-your-seo/index.html',
      'https://www.semrush.com/blog/seo-split-test-result-does-bolded-text-help-your-seo/',
    );

    expect(parsed.jsonLd.types).toEqual(
      expect.arrayContaining(['BreadcrumbList', 'Article']),
    );
    expect([...parsed.jsonLd.articleFields].sort()).toEqual([
      'author',
      'dateModified',
      'datePublished',
      'description',
      'genre',
      'headline',
      'identifier',
      'image',
      'mainEntityOfPage',
      'publisher',
      'url',
    ]);
  });

  it.each([
    ['a line feed', '\n'],
    ['a carriage return and line feed', '\r\n'],
    ['a tab', '\t'],
  ])('reads JSON-LD with %s inside a string value', (_, character) => {
    const parsed = page(
      '',
      '<script type="application/ld+json">' +
        `{"@type": "Article", "headline": "A post",` +
        ` "description": "First line.${character}Second line."}` +
        '</script>',
    );

    expect(parsed.jsonLd.types).toEqual(['Article']);
    expect([...parsed.jsonLd.articleFields].sort()).toEqual([
      'description',
      'headline',
    ]);
  });

  const ldJson = (text: string) =>
    `<script type="application/ld+json">${text}</script>`;

  it('reads an article inside a @graph whose strings carry raw line breaks', () => {
    const parsed = page(
      '',
      ldJson(
        '{"@context": "https://schema.org", "@graph": [' +
          '{"@type": "WebPage", "name": "A\npage"},' +
          '{"@type": ["BlogPosting", "Article"], "headline": "A\npost",' +
          ' "author": {"@type": "Person", "name": "Ann\nLee"}}]}',
      ),
    );

    expect([...parsed.jsonLd.types].sort()).toEqual([
      'Article',
      'BlogPosting',
      'WebPage',
    ]);
    expect([...parsed.jsonLd.articleFields].sort()).toEqual([
      'author',
      'headline',
    ]);
  });

  it('splits keywords that a raw line break separates', () => {
    const parsed = page(
      '',
      ldJson(
        '{"@type": "Article", "keywords": "SEO,\n bold text,\r\nsplit\ttest"}',
      ),
    );

    expect(parsed.jsonLd.keywords).toEqual(['SEO', 'bold text', 'split test']);
  });

  // A repaired block gets the same scrutiny as any other: a field holding only the
  // line break a CMS left behind carries nothing.
  it('does not count a field holding only a raw line break', () => {
    const parsed = page(
      '',
      ldJson(
        '{"@type": "Article", "headline": "A post", "author": "\n", "image": ["\t"]}',
      ),
    );

    expect(parsed.jsonLd.articleFields).toEqual(['headline']);
  });

  it('reads the blocks it can when one beside them is broken', () => {
    const parsed = page(
      '',
      ldJson('{"@type": "BreadcrumbList"}') +
        ldJson('{"@type": "Organization",}') +
        ldJson('{"@type": "Article", "description": "a\nb"}'),
    );

    expect(parsed.jsonLd.types).toEqual(['BreadcrumbList', 'Article']);
    expect(parsed.jsonLd.articleFields).toEqual(['description']);
  });

  // The og:image and the resized copy in the page meet by file stem: a CMS serves the
  // featured image as hero-1200x630.jpg in og:image and hero-768x432.jpg in the post.
  it('finds the featured image by the file og:image names, wherever it sits', () => {
    const parsed = page(
      '<header><img src="/uploads/hero-768x432.jpg" loading="lazy" alt="Hero"></header>' +
        '<main><p>x</p><img src="/other.png"></main>',
      '<meta property="og:image" content="https://a.example/uploads/hero-1200x630.jpg">',
    );

    expect(parsed.featuredImage).toEqual({
      loading: 'lazy',
      markup: '<img src="/uploads/hero-768x432.jpg" loading="lazy" alt="Hero">',
    });
    expect(page('<main><img src="/x.png"></main>').featuredImage).toBeNull();
  });

  it('survives broken JSON-LD and missing everything', () => {
    const parsed = extractPage(
      '<script type="application/ld+json">{broken</script>',
      'https://a.example/',
    );

    expect(parsed).toMatchObject({
      title: null,
      lang: null,
      canonicals: [],
      jsonLd: { types: [], keywords: [], articleFields: [] },
      wordCount: 0,
    });
  });

  // Text only a screen reader sees is a name: it is read before hidden text goes.
  it('finds links with no accessible name, and none where a name is hidden or alt', () => {
    const parsed = page(
      '<main><p>' +
        '<a href="/icon/"><img src="i.svg"></a>' +
        '<a href="/alt/"><img src="i.svg" alt="Pricing"></a>' +
        '<a href="/more/">More<span class="visually-hidden"> about INP</span></a>' +
        '<a href="/sr/"><span class="sr-only">Pricing</span><svg aria-hidden="true"></svg></a>' +
        '<a href="/label/" aria-label="Close"></a>' +
        '<a href="/titled/" title="Archive"></a>' +
        '<a href="/hidden/"><span aria-hidden="true">→</span></a>' +
        '</p></main>',
    );

    expect(parsed.unnamedLinks).toEqual([
      {
        href: 'https://a.example/icon/',
        markup: '<a href="/icon/"><img src="i.svg"></a>',
      },
      {
        href: 'https://a.example/hidden/',
        markup: '<a href="/hidden/"><span aria-hidden="true">→</span></a>',
      },
    ]);
  });

  it('keeps a JSON-LD block that is not JSON, with the parser error', () => {
    const parsed = page(
      '',
      '<script type="application/ld+json">{"@type": "Article",}</script>',
    );

    expect(parsed.jsonLdErrors).toEqual([
      expect.stringMatching(/^\{"@type": "Article",\}… — .+position/),
    ]);
  });

  it('keeps canonical hrefs written as a path', () => {
    expect(
      page('<p>x</p>', '<link rel="canonical" href="/canonical/">')
        .relativeCanonicals,
    ).toEqual(['/canonical/']);
  });

  it('finds where the charset declaration ends, in bytes', () => {
    const late = extractPage(
      `<!doctype html><html><head><style>${'a{}'.repeat(400)}</style><meta charset="utf-8"></head><body></body></html>`,
      'https://a.example/',
    );

    expect(
      page('<p>x</p>', '<meta charset="utf-8">').charsetDeclarationEnd,
    ).toBeLessThan(200);
    expect(late.charsetDeclarationEnd).toBeGreaterThan(1024);
    expect(page('<p>x</p>').charsetDeclarationEnd).toBeNull();
  });
});
