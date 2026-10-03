# Crawl module

Executes crawl runs; owns no table. Discovery → selection → analysis → one finalize transaction.

- **No site is special.** Nothing under `be/src` names semrush or yoast; both are found the way
  any blog is, and recorded fixtures of both (`be/test/fixtures/`) pin it. Guard:
  `git grep -n -i -E "semrush|yoast" -- be/src/modules be/src/infrastructure ':!*spec.ts' ':!*/_testing/*'`.
- **Finding the blog sitemap.** Sitemaps come from robots.txt (relative lines resolved; the site
  or its subdomains — `sitemap.canva.com` serves canva's), else the usual addresses; indexes are
  expanded best-name-first under a budget (depth 3, 50 fetches). Only same-site URLs are kept.
  Numbered siblings (`post-sitemap.xml`, `post-sitemap2.xml`) form one group. A group scores
  name (best of blog +3 / post, article +2 / news +1, minus 3 for page, product, tag…; +3 when
  the host itself is `blog.`/`news.`/…) + 2 for a Google News sitemap +
  3 × its share of URLs under `/blog/`, `/news/`, `/articles/` +
  4 × the share of the site's RSS/Atom items it contains. Threshold 2. On the live sites:
  semrush `/blog/sitemap/` scores 10, yoast's post group 6. Rejected: name and path only
  (misses unusual names), sampling page content (costs fetches before choosing).
- **When no sitemap is confirmed** the next source wins, in order: the feed's own items; the
  links of a `/blog/`-style index page (three or more); the best sitemap scoring ≥ 0. The last
  two are guesses, so the run is `articlesOnly`: a page counts only when it says `og:type=article`
  or a JSON-LD Article type, and nothing crawled ends `BLOG_SITEMAP_NOT_FOUND`, not
  `NO_POSTS_CRAWLED`.
- **A site that refuses robots** (every answer 401/403/429 or none) fails `SITE_BLOCKED`. The
  crawler never disguises its User-Agent (D36 Q9), so washingtonpost.com and canva.com stay
  uncrawlable by design.
- **No post is fetched before the sitemap is chosen** — a spec asserts the transport's request
  log holds only robots, sitemaps, the home page and feeds.
- **"The first 15 blog posts in sitemap order":** entries are considered in order, three fetched
  at a time, up to 15 crawled or 30 considered. An entry that is not a post is skipped with a
  reason — another site, the home page, a file, robots.txt, an error, a redirect off the site,
  not HTML, or a page whose JSON-LD declares `CollectionPage`/`ItemList` (yoast's `/seo-blog/`).
  Every considered entry is logged; the log ends at the 15th post.
- **Outbound HTTP** goes through `SiteHttpClient` (extends `RemoteApiCore`): per-kind size caps,
  `.gz` sitemaps inflated under a second cap, retries for 429/5xx/network only, private and
  metadata addresses refused at connect time.
- **Tests never touch the network:** `createTestApp` swaps in `FixtureHttpTransport`; an unknown
  URL is a 404. `node be/test/fixtures/record-fixtures.ts` refreshes the recordings.
