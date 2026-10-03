# How a search engine gets to a page

Background for the crawler and the indexing rules. Claims are tagged `[official]` (Google's own
documentation) or `[industry]` (practitioners observing Google from outside).

## The three stages

Google describes its own pipeline as **crawling → indexing → serving**, and states plainly that a
page can be dropped at any stage: being crawled does not mean being indexed, and being indexed
does not mean being served. `[official]`

### 1. Crawling

There is no registry of pages, so discovery is the first problem. Google finds URLs by following
links from pages it already knows, and by reading submitted sitemaps. `[official]`

What governs how much it fetches is **crawl budget** — Google's own framing is that it is a
concern for large sites, and that the lever site owners actually hold is URL inventory
management: not making the crawler spend its visits on URLs that should not be crawled.
`[official]`

`robots.txt` controls fetching, not indexing. A URL disallowed in `robots.txt` can still appear in
the index without its content, because Google learned of the URL elsewhere and was merely
forbidden to fetch it. Google says directly not to use `robots.txt` for canonicalisation.
`[official]`

### 2. Rendering — the step that surprises people

Modern pages need JavaScript, so between crawling and indexing there is a **render** step, run by
a separate headless-Chromium service the industry calls the **Web Rendering Service (WRS)**.
`[official]` The flow is: the crawler fetches HTML → processing extracts links (which go back on
the crawl queue) and queues the page for rendering → the renderer executes scripts → the rendered
DOM goes back to processing for indexing, yielding more links. `[official]`

Consequences worth holding onto:

- **It is two waves.** Anything present in the server's HTML can be indexed immediately. Anything
  that only appears after scripts run waits for the render queue. `[industry]`
- **The wait is unbounded in practice.** Estimates of the render-queue delay range from hours to
  weeks depending on the site's priority. These are observations, not a published SLA.
  `[industry]`
- **The browser is current.** Googlebot has run an evergreen Chromium since 2019, so modern syntax
  is not the problem people assume it is. `[official]`
- **A non-200 response may skip rendering entirely.** Google's December 2025 documentation update
  states that pages with a 200 status go to the render queue, and that rendering "might be
  skipped" for non-200 responses such as 404s. `[official]` For a crawler of our shape this is the
  practical note: status code first, parse second — an error page still parses into a title and a
  heading and will happily be analysed as content if nothing checks the status.

### 3. Indexing

Google processes the text and the content tags, works out what the page is about, and decides
whether it is a duplicate of something else. Where it finds a cluster of near-identical pages, it
picks one **canonical** to represent them. `[official]`

The canonical signals are explicitly ranked in strength: **a redirect is the strongest**, a
`rel="canonical"` annotation is a strong signal, and **inclusion in a sitemap is a weak one**.
`[official]` A `rel="canonical"` is therefore a request, not an instruction — Google may pick a
different canonical than the page nominates.

`hreflang` tells Google about language variants of the same page. `[official]` It is only
meaningful on sites that have them, and the field study found it on one of three sampled sites.

### 4. Serving

Relevance starts from the obvious signal — the query's words appearing on the page, in headings
and in the body — and is then shaped by everything in
[`ranking-signals.md`](ranking-signals.md). `[official]`

## What the industry agrees is table stakes

Every major audit tool converges on roughly the same technical checklist: crawlability
(`robots.txt`, crawl errors), indexability (`noindex`, sitemaps), canonicalisation, redirect
hygiene (chains and loops), mobile usability, Core Web Vitals, structured data, URL structure,
site architecture and internal linking, and JavaScript/CSS handling. `[industry]`

The scale differs sharply by tool: Screaming Frog's issues tab catalogues on the order of 300
potential problems, Semrush runs on the order of 140 checks, and an Ahrefs audit template covers
roughly 20 grouped areas. `[industry]` The spread is itself the finding — there is no canonical
list of "the SEO checks", only products making different cuts of the same material.

Sitemap hygiene that all of them state: a sitemap should list only indexable, canonical URLs, and
should not carry redirected or `noindex` pages. `[industry]`

## Observations against our own crawler

From [`field-study-2026-10.md`](field-study-2026-10.md), measured 2026-10-03:

- **Sitemap discovery is not reliable in the wild.** Of four sites attempted, one
  (`ahrefs.com`) yielded no article URLs: its `robots.txt` declared no `Sitemap:` line and
  `/sitemap.xml` did not lead to blog posts by the obvious path. Two of the other three declared
  sitemaps in `robots.txt`; one had to be guessed at the conventional location.
- **Bot protection is a normal response, not an error.** `app.asana.com` answered `403`, and that
  403 page still parsed into a title and an `h1`. A fetch that "succeeded" at the HTTP level is
  not evidence that a page was seen.
- **Our crawler does not render.** It reads server HTML only, as this stage-1 description implies.
  On the sampled sites that cost nothing — all were server-rendered, with full word counts in the
  raw HTML. A client-rendered client site would be invisible to it, and nothing currently
  distinguishes "this page is thin" from "this page's content needs JavaScript".

## Open questions this raises

- Should a page whose fetch was non-200, or whose body looks like a bot-challenge, be analysed at
  all — or recorded as a crawl outcome distinct from an SEO issue?
- Is "thin content" separable from "content behind JavaScript" without a renderer, and is a
  renderer worth its cost for an agency's blog pages?
- Does sitemap discovery need fallbacks beyond `robots.txt` and `/sitemap.xml`, and what does the
  product say to a user whose client site yields nothing?

## Sources

Official — Google:
- [In-depth guide to how Google Search works](https://developers.google.com/search/docs/fundamentals/how-search-works)
- [Understand JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Crawl budget management](https://developers.google.com/crawling/docs/crawl-budget)
- [Consolidate duplicate URLs (canonicalisation)](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Technical SEO: get started](https://developers.google.com/search/docs/fundamentals/get-started)

Industry:
- [JavaScript SEO & rendering: how Google handles JS](https://www.seo-kreativ.de/en/blog/javascript-seo-rendering/)
- [JavaScript SEO in 2025: rendering, hydration, crawlability](https://agent6.com.au/javascript-seo-in-2025-rendering-hydration-and-crawlability-explained/)
- [How Google chooses canonical URLs](https://almcorp.com/blog/how-google-chooses-canonical-urls/)
- [Semrush site audit overview](https://www.webtonic.io/blog/semrush-site-audit)
- [Technical SEO audit checklist](https://www.digitalsilk.com/digital-trends/technical-seo-checklist/)
