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
  uncrawlable by design. A Cloudflare challenge (`cf-mitigated: challenge`, often a 503) counts
  as a refusal, on robots.txt, sitemaps and posts alike.
- **robots.txt per RFC 9309 and Google:** 4xx allows everything — except 429, which like a 5xx
  forbids everything and fails the run `ROBOTS_UNAVAILABLE` without reading anything else. A
  robots.txt that cannot be fetched at all (timeout, refused connection) is a server error too,
  and fails `SITE_UNREACHABLE` before anything else is asked; reading it as "no rules" crawled
  sites Google would have left alone. A file past 500 KiB is read up to the limit, as Google
  reads it, minus the line the limit cut; more than five redirects is Google's 404, no rules.
  A post answered 200 whose title or h1 announces a missing page ("Page not found", "404") is
  logged as a soft 404; every candidate disallowed fails
  `ROBOTS_DISALLOWED`. A home page redirecting to another site fails `SITE_REDIRECTS_ELSEWHERE`
  when nothing else was found, and so does a run whose every candidate redirects off the site
  (a Blogger blog moved to its own domain keeps a sitemap of blogspot URLs).
- **Formats read:** XML sitemaps and indexes (gzip, CDATA, namespaces), text sitemaps (one URL
  per line), a feed named as a sitemap, RSS 2.0/1.0, Atom and JSON Feed (FeedBurner's
  `origLink`, a permalink `guid`; `utm_*` and fragments dropped). Text is decoded by BOM, then
  the header's charset, then `<meta charset>`/the XML declaration — windows-1251 sites declare
  it only in the page.
- **No post is fetched before the sitemap is chosen** — a spec asserts the transport's request
  log holds only robots, sitemaps, the home page and feeds.
- **"The first 15 blog posts in sitemap order":** entries are considered in order, three fetched
  at a time, up to 15 crawled or 30 considered. An entry that is not a post is skipped with a
  reason — another site, the home page, a file, robots.txt, an error, a redirect off the site,
  not HTML, a page whose JSON-LD declares `CollectionPage`/`ItemList` (yoast's `/seo-blog/`), or
  a page with fewer than `MIN_POST_WORD_COUNT` words of main content. The last one needs the
  parse and so is checked last. It exists because an index or author card has a title and a list
  of links, nothing for the analysis to read but the site's own navigation, and a different part
  of that navigation on each crawl: blog.google's author pages were tracked, and their keywords
  changed under their own recorded position history. Measured here, real posts start at 256
  words and those pages ran 30–87, well under the catalogue's 300-word THIN_CONTENT warning,
  which judges a page that IS a post. A page under the floor that is a client-rendered shell —
  an empty framework mount point, or a `<noscript>` asking for JavaScript — is logged as
  "Rendered by JavaScript" instead, because that is the finding: every crawler that runs no
  scripts reads it as empty.
  Every considered entry is logged; the log ends at the 15th post.
- **The site checks' own requests** (`SiteProbeService`): after the posts, the home page at the
  site's other scheme and www-variants and one made-up address, at most four requests, never a
  failure of the run. Discovery keeps what the site checks read — robots.txt as answered, the
  candidates' `<lastmod>` — and the verdicts are written with the run, in its transaction.
- **What the analysis is handed beyond the page:** every redirect hop with its status, the
  run's robots.txt as `IRobotsRules`, so the checks can ask it about Googlebot and the AI search
  crawlers — the crawl itself only ever asks about its own name — and what the client's previous
  crawl recorded for each URL, read before the transaction opens.
- **Outbound HTTP** goes through `SiteHttpClient` (extends `RemoteApiCore`): per-kind size caps,
  `.gz` sitemaps inflated under a second cap, retries for 429/5xx/network only, private and
  metadata addresses refused at connect time.
- **Tests never touch the network:** `createTestApp` swaps in `FixtureHttpTransport`; an unknown
  URL is a 404. `node be/test/fixtures/record-fixtures.ts` refreshes the recordings.


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable — the queue’s own invariants (CRAWL-001..003) sit in `CLIENTS_MODULE.md`, which owns `crawl_runs`. Unless another path is
named, the requirement lives in `openspec/specs/be/src/modules/crawl/spec.md`.

<!-- invariant: CRAWL-004 -->
**The blog sitemap is chosen by score from robots and well-known sources before any page URL is fetched.** Pinned by `services/sitemap-discovery/sitemap-discovery.service.spec.ts` -> "no page URL is requested before selection" and "semrush: selects /blog/sitemap/ and never reads another subdomain"; `services/sitemap-scoring/sitemap-scoring.spec.ts` -> `describe("selectBlogGroup")`.

<!-- invariant: CRAWL-005 -->
**Only the client’s own site is crawled: a foreign sitemap, a foreign URL and an off-site redirect are all refused.** Pinned by `sitemap-discovery.service.spec.ts` -> "semrush: selects /blog/sitemap/ and never reads another subdomain"; `services/post-selection/post-selection.service.spec.ts` -> "logs and skips each kind of non-post, then keeps going".

<!-- invariant: CRAWL-006 -->
**At most 15 crawled posts out of at most 30 candidates, taken in sitemap order despite fetching in parallel.** Pinned by `post-selection.service.spec.ts` -> "takes the first 15 posts in order and stops the log at the 15th" and "considers at most 30 entries"; `be/test/e2e/crawl.e2e-spec.ts` -> "crawls yoast: 15 posts, 16 log lines, /seo-blog/ skipped as a listing".

<!-- invariant: CRAWL-007 -->
**Every considered candidate becomes exactly one log row carrying its reason, and the next candidate is still tried.** Pinned by `post-selection.service.spec.ts` -> "logs and skips each kind of non-post, then keeps going"; the CHECKs `crawl_run_items_page_required` and `crawl_run_items_reason_required`.

<!-- invariant: CRAWL-008 -->
**A run ends succeeded at 15 posts, partial at 1–14 and failed at none, each with a catalogued error code.** Pinned by `crawl-run-executor.service.spec.ts` -> `describe("outcomeOf")`, its "%d posts → %s" cases and its error-code cases; `be/test/e2e/crawl.e2e-spec.ts` -> "a site with no sitemap finalizes failed SITEMAP_NOT_FOUND".

<!-- invariant: CRAWL-010 -->
**No seed client’s name, host or path appears anywhere in crawl, discovery or analysis code.** Pinned by NOT pinned by a test — this document records a manual `git grep` guard, and nothing in CI, ESLint or a spec runs it.

<!-- invariant: SEED-002 -->
**The seed enqueues a `trigger=seed` run executed by the same worker as a UI run, waits for it, and fails loudly naming the error code. (`openspec/specs/be/src/seed/spec.md`)** Pinned by `be/src/seed/seed-runner/seed-runner.int-spec.ts` -> "a failed crawl makes the seed fail with its error code"; `seed-runner.service.spec.ts` -> "enqueues a seed crawl and polls until it ends" and "waits for a run already in flight instead of enqueueing another". The non-zero process exit is NOT pinned — no test runs the CLI.
