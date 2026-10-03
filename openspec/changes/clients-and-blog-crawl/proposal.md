# Clients and blog crawl

## Why

Adding a client (name + website URL) must find the site's blog sitemap and crawl its first 15
blog posts in sitemap order, the same way for a UI user and for the seed, with nothing
site-specific in code. The crawl is slow and fallible, so it cannot run inside the request; its
status, its failure reason and every candidate it considered must be data the UI can explain. The
URL is user input that makes the server fetch things, so every hop must be bounded and guarded
against SSRF.

## What Changes

- `@app/contracts`: `parseWebsiteUrl` / `isSameSite` (the site-key rule, D9), crawl vocabulary
  (statuses, triggers, item statuses, limits, run error catalogue), client and run wire shapes.
- Tables `clients`, `crawl_runs` (queue + lease + fencing columns), `crawl_run_items`, `pages`.
- `GET/POST /api/clients`, `GET /api/clients/:id`, `POST /api/clients/:id/crawl-runs`,
  `GET /api/crawl-runs/:id`; isolation-matrix rows for each id route.
- A Postgres queue worker on `crawl_runs` (claim with `SKIP LOCKED`, lease, heartbeat, three
  attempts, NOTIFY wake-up), enabled in the `be` container.
- `be/src/infrastructure/remote-api/`: a DNS-pinned SSRF guard, bounded transport,
  `RemoteApiCore` (redirects, retries, timeouts, user agent), a fixture transport for tests.
- Blog sitemap discovery by score, post selection with a logged item per candidate, and an atomic
  finalize under the attempt fence.
- Recorded fixtures of both live sites plus synthetic sites.

## Capabilities

- `be/src/modules/clients` — CLIENT-001…CLIENT-007 (new).
- `be/src/modules/crawl` — CRAWL-001…CRAWL-010 (new).
- `be/src/infrastructure/remote-api` — REMOTE-001…REMOTE-004 (new).

## Impact

- New modules `clients`, `crawl`; new `pages` module (table, `PagesRepository`,
  `CrawlResultsService`); `TransactionRunner`; env `CRAWL_WORKER_ENABLED`; compose `be` gains the
  flag; deps `undici`, `cheerio`, `fast-xml-parser`, `robots-parser`.
- Pages get keywords and issues only in `page-analysis`; positions in `positions-and-seed`.
