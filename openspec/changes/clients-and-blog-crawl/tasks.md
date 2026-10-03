# Tasks — clients-and-blog-crawl

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 3. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. The website rule (3a) — CLIENT-001, CLIENT-002

- [x] 1.1 Write `packages/contracts/src/domain/clients/website-url/parse-website-url.util.test.ts` and `site-key/is-same-site.util.test.ts` tables (www, port, path, punycode, subdomain; refused scheme, credentials, IPv4/IPv6 literal, localhost, dotless host); they fail. Verify: `pnpm --filter @app/contracts test:ci` fails
- [x] 1.2 Implement both utils; add crawl enums, `crawl-limits.constant.ts`, `crawl-run-error.constant.ts`, client and run interfaces; barrel. Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`

## 2. Schema (3b) — CLIENT-003, CLIENT-005, CRAWL-002, CRAWL-007

- [x] 2.1 Write int-specs: `clients.repository.int-spec.ts` (clients_user_id_site_key_uq), `crawl-runs.repository.int-spec.ts` (crawl_runs_client_id_active_uq, crawl_runs_finished_at_required, crawl_runs_started_at_required, attempts range), `crawl-run-items.repository.int-spec.ts` (page and reason CHECKs), `pages.repository.int-spec.ts` (upsert on (client_id, url) keeps the id); they fail. Verify: `pnpm --filter be test:db -- clients crawl-run pages` fails
  AMENDED during implementation: the constraint cases live in `crawl-runs.constraints.int-spec.ts` (clients, runs and items together, they share their seed rows); the client uniqueness is also pinned end to end by `clients.e2e-spec.ts`. `test:db` takes its filters without `--` (`pnpm --filter be test:db crawl-run pages`).
- [x] 2.2 Schemas `clients`, `crawl-runs` (exporting `crawlStatusEnum`, `crawlTriggerEnum`), `crawl-run-items` (exporting `crawlItemStatusEnum`), `pages`; register; generate; read the SQL for the partial predicate, all CHECKs and three `CREATE TYPE`. Verify: `pnpm db:generate && pnpm db:migrate`
- [x] 2.3 Repositories and `TransactionRunner`. Verify: `pnpm --filter be test:db -- clients crawl-run pages`
  AMENDED during implementation: each repository landed with the step that first calls it — `ClientsRepository` and the run reads in 3c, the queue queries in 3d — so 3b shipped the schema, `TransactionRunner` and `PagesRepository` only.

## 3. Clients API (3c) — CLIENT-002…CLIENT-007, ISO-002, ISO-005

- [x] 3.1 Write `be/test/e2e/clients.e2e-spec.ts` (201 queued, 400, 409 duplicate, concurrent 201/409, re-crawl 409, list with latestRun and currentPageCount) and `clients.service.spec.ts` (one tx; 23505 mapping by constraint name); they fail. Verify: `pnpm --filter be test:db -- clients` fails
- [x] 3.2 `ClientsModule`: controllers, `CreateClientDto`, `ClientsService`, `ClientCrawlRunsService` (`…ForWorker` methods), error constants, exceptions; NOTIFY `crawl_run_queued` in the enqueue transaction. Verify: `pnpm --filter be test:ci -- src/modules/clients && pnpm --filter be test:db -- clients`
  AMENDED during implementation: `currentPageCount` is the `pages_done` of the client's latest succeeded/partial run, read with the run summary — the same number the pages list will show, without the clients module reading the `pages` table. The per-minute throttle is `PER_MINUTE_THROTTLE` in `be/src/core/constants/throttle.constant.ts`, shared by the login and add-client guards; the channel name is `CRAWL_QUEUED_CHANNEL` in `be/src/shared/crawl-queue/`.
- [x] 3.3 Isolation-matrix rows for `GET /clients/:id`, `POST /clients/:id/crawl-runs`, `GET /crawl-runs/:id` (the static partner fails until they exist). Verify: `pnpm --filter be test:db -- isolation-matrix default-deny`

## 4. Queue worker (3d) — CRAWL-001…CRAWL-003

- [x] 4.1 Write int cases (concurrent claims, reclaim with attempt 2, abandoned after 3, stale attempt cannot lock for finalize, stale lease renewal updates 0 rows) and `crawl-worker.spec.ts` (2 slots, wake on notify, stop on shutdown); they fail. Verify: `pnpm --filter be test:db -- crawl-runs` fails
- [x] 4.2 Claim/renew/abandon/lock queries; `CrawlWorker`, `CrawlWakeupListener`, `CRAWL_WORKER_ENABLED` in `EnvKeys` and `envSchema` (+ spec case), default false. Verify: `pnpm --filter be test:ci -- src/modules/crawl/workers src/infrastructure/config && pnpm --filter be test:db -- crawl-runs`
  AMENDED during implementation: the LISTEN connection is `PgNotificationListener` in `be/src/persistence/connections/postgres/notification-listener/` — a dedicated `pg` client is a persistence concern, not a worker — and `CrawlWorker` subscribes through it. `crawl.module.ts` was created in 3g, when the module first had a real executor to bind.
- [x] 4.3 Verify compose is unchanged: `docker compose up -d --build` and `docker compose logs be` shows no worker start
  VERIFIED, NOT BUILT: the module was not registered until 3g, so nothing could start; superseded by 7.3.

## 5. Outbound HTTP (3e) — REMOTE-001…REMOTE-004

- [x] 5.1 Write `address-guard.spec.ts`, `guarded-lookup.spec.ts`, `remote-api.core.spec.ts` (timeout, 6th redirect, private redirect, retry 503→200, no retry 404, Retry-After, UA), `undici-http-transport.spec.ts` (body cap, gunzip on a local server), `fixture-http-transport.spec.ts` (unknown URL is 404); they fail. Verify: `pnpm --filter be test:ci -- src/infrastructure/remote-api` fails
- [x] 5.2 Implement `be/src/infrastructure/remote-api/**` with `undici` `fetch` + `Agent` (Q5). Verify: `pnpm --filter be test:ci -- src/infrastructure/remote-api`
  AMENDED during implementation: the transport uses undici `request` (not `fetch`) — it never follows redirects and exposes the raw body stream, so the cap counts decoded bytes (a gzip bomb test pins it). A body over the cap is a `RemoteApiTooLargeError`, not a `truncated` flag: a truncated page would be analysed as if whole. `.gz` sitemaps are inflated by `SiteHttpClient` under a second cap, since `Content-Encoding` and a gzipped file are different things.
- [x] 5.3 Record fixtures once with `pnpm --filter be exec ts-node test/fixtures/record-fixtures.ts`; add synthetic sites and `manifest.json`; commit. Verify: `pnpm --filter be test:ci -- src/infrastructure/remote-api/_testing`
  AMENDED during implementation: the recorder runs with Node's own TypeScript support, `node be/test/fixtures/record-fixtures.ts`; it trims scripts, styles, SVG paths and non-blog sitemaps (its header says why), leaving ~4 MB. `be/test/fixtures/README.md` describes the synthetic sites; `.gitattributes` keeps the recordings byte for byte.

## 6. Discovery (3f) — CRAWL-004, CRAWL-005, CRAWL-010

- [x] 6.1 Write `sitemap-scoring.spec.ts` (plan §10.1 expectations, grouping, ties) and `sitemap-discovery.service.spec.ts` (semrush, yoast, no-robots, gzip, root-blog-no-feed, unusual-name, pages-only, none, "no page URL before selection"); they fail. Verify: `pnpm --filter be test:ci -- src/modules/crawl/services` fails
- [x] 6.2 Implement parser, robots policy, feed discovery, scoring, discovery, `SiteHttpClient`. Verify: `pnpm --filter be test:ci -- src/modules/crawl/services`
  AMENDED during implementation: feed parsing is its own unit, `services/feed-parser/`, so `FeedDiscoveryService` only fetches. A name scores its best positive token (not the sum) plus one negative; `pageKeyOf` compares feed and sitemap URLs without scheme, `www.` or trailing slash. The unreachable site is a manifest pattern that fails every request.
- [x] 6.3 Verify no site name in code: `git grep -n -i -E "semrush|yoast" -- be/src/modules be/src/infrastructure` prints nothing
  AMENDED during implementation: the specs name the recorded sites on purpose, so the guard excludes them: `git grep -n -i -E "semrush|yoast" -- be/src/modules be/src/infrastructure ':!*spec.ts' ':!*/_testing/*'` prints nothing.

## 7. Selection, execution, finalize; worker live (3g) — CRAWL-003, CRAWL-006…CRAWL-009, CLIENT-007

- [x] 7.1 Write `post-selection.service.spec.ts` (15/30 limits, `/seo-blog/` at 0, robots, offsite redirect, 500 then next, window order), `crawl-run-executor.service.spec.ts` (status by count, discovery failure, fencing loss), `crawl-results.service.spec.ts` (pages upsert only), `be/test/e2e/crawl.e2e-spec.ts` (yoast fixture → succeeded, 15 pages, 16 items; re-crawl keeps a dropped page with its old `last_seen_run_id`); they fail. Verify: `pnpm --filter be test:db -- crawl` fails
- [x] 7.2 Implement `PostSelectionService`, `CrawlRunExecutor`, `CrawlResultsService` (pages). Verify: `pnpm --filter be test:ci -- src/modules/crawl src/modules/pages && pnpm --filter be test:db -- crawl clients`
  AMENDED during implementation: phase 4b's `extractPage` was built first (`modules/page-analysis/services/html-extraction/`), because selection needs a page's JSON-LD to recognise a listing and the pages row needs title, h1, lang and word count — a stand-in extractor would have been thrown away. A redirect that leaves the site is logged `skipped_other_site` before its status is judged. A sitemap URL longer than the 2048-character column is logged `failed` without a request. `createTestApp` always substitutes the fixture transport, and the DB test env forces `CRAWL_WORKER_ENABLED=false`.
- [x] 7.3 Enable the worker: `CRAWL_WORKER_ENABLED: "true"` for `be` in `docker-compose.yml`, `CRAWL_WORKER_ENABLED=true` in `.env.example`. Verify: `docker compose up -d --build && docker compose logs be | grep -i "crawl worker started"`
  VERIFIED beyond the task: with the stack up, adding yoast.com and www.semrush.com through the API crawled both live sites — `post-sitemap.xml` (+1 sibling, score 6) and `/blog/sitemap/` (score 10), 15 posts each, `/seo-blog/` logged as a listing.
- [x] 7.4 Note for CRAWL-009: "hidden from user-facing reads" is pinned when the reads exist — `page-list.repository.int-spec.ts` in `pages-and-position-history`. Verify here only that nothing deletes: `git grep -n -E "\.delete\((pages|crawlRunItems)\)" -- be/src` prints only the finalize's per-run item rewrite
