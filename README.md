# SEO Keyword Tracker

An agency tool: add a client's website, and it finds the blog, crawls the first 15 posts,
works out which keywords each post targets, flags its SEO issues, and tracks the posts'
Google positions over time. Each user sees only their own clients.

## Run it from a clean clone

Requirements: Docker with Compose v2. Ports 8080 (app) and 55433 (Postgres) must be free.

```bash
git clone https://github.com/trino27/keyword-tracker.git seo-keyword-tracker
cd seo-keyword-tracker
cp .env.example .env
docker compose up -d --build
docker compose run --rm seed
```

Open http://localhost:8080 and sign in as **`semrush.manager@example.com`** or
**`yoast.manager@example.com`**, password `demo-password-change-me` (the demo value of
`SEED_USER_PASSWORD` in `.env`). The seed crawls both live sites (about a minute) and writes a
year of daily positions — about 56 000 snapshots. It is idempotent: run it again any time; it crawls
nothing twice and fills positions up to today, including for clients added in the UI.

Local development and checks (Node 24, pnpm 10):

```bash
pnpm install && pnpm dev:db && pnpm db:migrate     # Postgres in Docker, schema applied
pnpm dev:be & pnpm dev:fe                          # API :3000, SPA :5173 (proxies /api)
pnpm lint && pnpm typecheck && pnpm test && pnpm test:db
```

## Decisions, and why

- **Keywords are a global dictionary** (`keywords`) linked to pages (`page_keywords`); a position
  snapshot belongs to that pair, by a composite foreign key — it cannot exist for a keyword the
  page does not have.
- **Time:** every instant is `timestamptz` in UTC. The user's zone is a column (`users.time_zone`,
  seeded `America/Toronto`); the API turns a calendar range into UTC bounds in that zone
  (`[from 00:00, to+1 00:00)`, right across DST) and the UI formats in it — never the browser's
  zone. The seed captures at 12:00 UTC, which keeps the UTC date and the Toronto date the same.
- **Best and latest positions are computed at read time** (a `LATERAL … LIMIT 1` on the snapshot
  primary key — 0.8 ms for a 15-page slice, plan checked with `EXPLAIN`), never stored twice.
- **Isolation:** every query is scoped by the session's user; a foreign id answers exactly like a
  missing one (404, same body); every route is signed-in by default; an e2e matrix proves it per
  route, and a static test fails if a new id-taking route has no row in it.
- **Sessions** are server-side (an opaque cookie, its SHA-256 in Postgres), passwords scrypt.
- **The crawl is a Postgres queue** on `crawl_runs` (`FOR UPDATE SKIP LOCKED`, leases, an attempt
  fence, `LISTEN/NOTIFY` wake-ups): adding a client answers at once and the run is done by a worker;
  nothing else to deploy.
- **Finding the blog without knowing the site:** sitemaps from robots.txt (or the usual addresses),
  scored by name, URL paths and overlap with the site's RSS feed. semrush.com and yoast.com are not
  special-cased anywhere; fixtures recorded from both pin the result.
- **"The first 15 blog posts in sitemap order"** skips entries that are not posts — and says so:
  Yoast's first sitemap entry, `/seo-blog/`, declares itself a listing (JSON-LD
  `CollectionPage`) and is skipped. Every considered entry, crawled or not, is in the run log on
  the Clients screen, with the reason.
- **Keywords** are scored by where a phrase appears (title, H1, URL slug, description, headings,
  body), the page's own declared keywords, and an IDF penalty across the client's pages — so
  "yoast" does not top every Yoast page. 18 SEO rules, one per catalogued code, compile-checked.
- **A page's score is the share of the checks that could apply to it.** Five of the eighteen are
  conditional — a page with no images is not judged on alt text, a page with no description is not
  judged on its length — so the denominator is counted at crawl time, while the parsed page is
  still in hand, and shown beside the number: two pages with different denominators do not compare
  as equals. Every check weighs the same; severity is how the screen reads, not arithmetic.
- **The pages list is ordered worst first**, interleaving clients rather than grouping by name.
  The score exists so a portfolio can be triaged, and an order that buries the worst page of the
  second client under the best page of the first defeats it. The sort ends in a unique key, so a
  page appears on exactly one page of the list.
- **Positions are invented**, as the brief says — a mean-reverting walk seeded by `url + term`,
  so a re-seeded database regenerates the same history. `pnpm seed` (or `docker compose run --rm
  seed`) stays the way to produce them; **Generate positions** on the page detail screen runs the
  same fill for the signed-in user's clients only, so a client added in the UI gets a chart
  without a shell. Nothing here talks to a search engine either way.
- **A re-crawl deletes nothing.** Pages and keyword pairs a newer crawl no longer finds keep their
  history and are hidden; issues describe the latest fetch only.
- **Outbound HTTP is guarded:** private, loopback and metadata addresses are refused at connect
  time (no DNS-rebinding window), with size caps, timeouts and bounded retries.

## Not done, and next

- Postgres row-level security as a second line behind the scoped queries.
- Sites without a blog sitemap (an HTML/feed-only fallback); network SEO checks (Lighthouse,
  broken links); real rank data instead of the seed's simulated walk.
- A browser end-to-end test (Playwright); sorting the list by position.
- The position fill runs inside the request (a few seconds for a fresh client); it belongs on the
  crawl queue next to the crawl itself.
- Whether a future change to the check catalogue needs a stale-analysis mechanism. There is none
  today, deliberately: nothing has been deployed, so every page is scored by the current
  catalogue and no row carries a verdict from an older one. The first deploy is what reopens it.
- What changed against the plan while building is recorded as `AMENDED` lines in
  `openspec/changes/*/tasks.md`.

## AI tools used

Claude Code (Anthropic) throughout: interviewing the requirements into a plan (decisions D1–D36)
and OpenSpec changes, test-first implementation phase by phase, and review. Every line was run
against the real stack. The plans are in `docs/_plans-archive/`, the changes in
`openspec/changes/`.

## Map

`be/` NestJS API · `fe/` React + Vite SPA (Mantine, zustand ViewModels, TanStack Router) ·
`packages/contracts/` types and rules both sides share · `caddy/` web server ·
`openspec/` requirements · `docs/_plans-archive/` the plans, as executed · `AGENTS.md` entry
point for contributors.
