# Tasks — pages-and-position-history

Generated from the plan `keyword-tracker` (docs/_plans-archive/), Phase 6. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Zone conversion (6a) — TZ-002

- [x] 1.1 Write tests for `day-range-to-utc` (2026-03-08 and 2026-11-01 Toronto, a July day, Asia/Tokyo, UTC), `today-in-zone` (2026-11-02T03:30Z is 2026-11-01 in Toronto), `add-days`, `is-iso-day` (2026-02-30 false); they fail. Verify: `pnpm --filter @app/contracts test:ci` fails
- [x] 1.2 Implement with `Intl` only; `iso-day.type.ts`, `history-range.constant.ts`; barrel. Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`
  AMENDED during implementation: `add-days` also exports `daysBetweenInclusive` (the range-length rule), and `day-range-to-utc` exports `startOfDayInZone`; a test pins that the seeded 12:00 UTC point falls on the same Toronto date across both DST changes.

## 2. Trigram indexes (6b) — PAGES-003

- [x] 2.1 Write the `page-list.repository.int-spec.ts` case "pages_url_trgm_idx and keywords_term_trgm_idx exist"; it fails. Verify: `pnpm --filter be test:db -- page-list` fails
- [x] 2.2 `pnpm --filter be db:generate --custom --name enable_pg_trgm`; body `CREATE EXTENSION IF NOT EXISTS pg_trgm;` only. Verify: the file exists and sorts before the next migration in `be/drizzle/meta/_journal.json` (read, never edited)
  VERIFIED: pnpm forwards `--custom --name` unchanged; `0005_enable_pg_trgm` precedes `0006_fancy_prowler` in the journal.
- [x] 2.3 Add the two GIN indexes to the schemas; `pnpm db:generate`; read both files; `pnpm db:migrate`. Verify: `docker compose exec -T postgres dropdb -U tracker seo_tracker_test && pnpm --filter be test:db -- page-list`
  VERIFIED: after the drop, the whole `test:db` suite migrated a fresh database and passed.

## 3. Pages list (6c) — PAGES-002…PAGES-005, ISO-005, CRAWL-009

- [x] 3.1 Write `page-list.repository.int-spec.ts` (a page absent from the latest run is not listed; a failed re-crawl keeps the previous pages; q on URL and keyword; q '%' literal; order; latest positions per keyword), `pick-best-position.spec.ts` (min, ties, null), `page-read.service.spec.ts` with `describe('cost')` (four repository calls for 50 rows), `escape-like.util.spec.ts`, `be/test/e2e/pages.e2e-spec.ts` (pagination totals, pageSize 51 → 400, foreign clientId 404); they fail. Verify: `pnpm --filter be test:db -- page-list pages` fails
  AMENDED during implementation: the escape case covers `_` as well as `%`, and the spec file is `escape-like.spec.ts` beside `escape-like.ts`. The e2e lists the recorded yoast crawl through the real worker; `?q=` of spaces is no search rather than a 400.
- [x] 3.2 Implement `PagesModule` controller, `ListPagesQueryDto`, `PageReadService.listPages`, `pickBestPosition`, `PageListRepository`, `escapeLike`. Verify: `pnpm --filter be test:ci -- src/modules/pages src/core/utils && pnpm --filter be test:db -- page-list pages`
  AMENDED during implementation: a `clientId` is checked with `ClientsService.assertOwnedClient` (one extra scoped lookup, outside the four list statements the cost test counts). Keyword search matches the normalized form of `q` (keywords are stored normalized), URL search the raw `q`. The current run is a `DISTINCT ON` CTE rather than a LATERAL per client — same order, `finished_at desc, id desc`, now also used by the seed.
- [x] 3.3 Isolation-matrix row for `GET /pages?clientId`. Verify: `pnpm --filter be test:db -- isolation-matrix default-deny`
- [x] 3.4 EXPLAIN on seeded data with `be/test/explain/pages-list.explain.sql`. Verify: `docker compose up -d --build && docker compose run --rm seed && docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql` shows `Index Scan … rank_snapshots_pk` under the LATERAL `Limit` and no `Seq Scan on rank_snapshots`
  VERIFIED: `Index Scan Backward using rank_snapshots_pk` under `Limit (… loops=79)` — one probe per pair of the 15-page slice; 0.8 ms.

## 4. Page detail and history (6d) — PAGES-006…PAGES-008, TZ-001, TZ-003

- [x] 4.1 Write `position-history.service.spec.ts` (default 30 days in the zone, clamp, from > to and 367 days → INVALID_DATE_RANGE) and `be/test/e2e/pages-history.e2e-spec.ts` (DST scenario, empty series kept, dropped-out page 404, unknown `timeZone` parameter 400, detail shape with lastCrawl); they fail. Verify: `pnpm --filter be test:db -- pages-history` fails
  AMENDED during implementation: the range rule is the pure `resolve-history-range.ts` with its own spec. The e2e uses the past DST changes, 2025-11-02 (25 h) and 2026-03-08 (23 h): the plan's 2026-11-01 lies in the future when the tests run, and a future `to` is clamped to today by design. Pages are written directly by `test/support/seed-page.ts`.
- [x] 4.2 Implement `PositionsQueryDto`, `PositionHistoryService`, `PageReadService.getPage`; detail uses `ClientsService.getLatestRunSummary`. Verify: `pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be test:db -- pages-history`
  AMENDED during implementation: `lastCrawl` comes from `ClientsService.getClient(...).latestRun` — the method already exists and is scoped. "Current page" is `PageDetailRepository.findCurrentPage`; days are validated by an `@IsIsoDay()` decorator built on the contracts' `isIsoDay`, so `2026-02-30` is a 400 BAD_REQUEST.
- [x] 4.3 Isolation-matrix rows for `GET /pages/:id` and `GET /pages/:id/positions`. Verify: `pnpm --filter be test:db -- isolation-matrix`
- [x] 4.4 EXPLAIN of the history. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/position-history.explain.sql` shows one index range scan on `rank_snapshots_pk`
  VERIFIED: `Index Scan using rank_snapshots_pk` with the `captured_at` bounds in the Index Cond, one loop per pair (7), 30 rows each.
