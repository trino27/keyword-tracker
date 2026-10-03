# Tasks — pages-and-position-history

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 6. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Zone conversion (6a) — TZ-002

- [ ] 1.1 Write tests for `day-range-to-utc` (2026-03-08 and 2026-11-01 Toronto, a July day, Asia/Tokyo, UTC), `today-in-zone` (2026-11-02T03:30Z is 2026-11-01 in Toronto), `add-days`, `is-iso-day` (2026-02-30 false); they fail. Verify: `pnpm --filter @app/contracts test:ci` fails
- [ ] 1.2 Implement with `Intl` only; `iso-day.type.ts`, `history-range.constant.ts`; barrel. Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`

## 2. Trigram indexes (6b) — PAGES-003

- [ ] 2.1 Write the `page-list.repository.int-spec.ts` case "pages_url_trgm_idx and keywords_term_trgm_idx exist"; it fails. Verify: `pnpm --filter be test:db -- page-list` fails
- [ ] 2.2 `pnpm --filter be db:generate --custom --name enable_pg_trgm`; body `CREATE EXTENSION IF NOT EXISTS pg_trgm;` only. Verify: the file exists and sorts before the next migration in `be/drizzle/meta/_journal.json` (read, never edited)
- [ ] 2.3 Add the two GIN indexes to the schemas; `pnpm db:generate`; read both files; `pnpm db:migrate`. Verify: `docker compose exec -T postgres dropdb -U tracker seo_tracker_test && pnpm --filter be test:db -- page-list`

## 3. Pages list (6c) — PAGES-002…PAGES-005, ISO-005, CRAWL-009

- [ ] 3.1 Write `page-list.repository.int-spec.ts` (a page absent from the latest run is not listed; a failed re-crawl keeps the previous pages; q on URL and keyword; q '%' literal; order; latest positions per keyword), `pick-best-position.spec.ts` (min, ties, null), `page-read.service.spec.ts` with `describe('cost')` (four repository calls for 50 rows), `escape-like.util.spec.ts`, `be/test/e2e/pages.e2e-spec.ts` (pagination totals, pageSize 51 → 400, foreign clientId 404); they fail. Verify: `pnpm --filter be test:db -- page-list pages` fails
- [ ] 3.2 Implement `PagesModule` controller, `ListPagesQueryDto`, `PageReadService.listPages`, `pickBestPosition`, `PageListRepository`, `escapeLike`. Verify: `pnpm --filter be test:ci -- src/modules/pages src/core/utils && pnpm --filter be test:db -- page-list pages`
- [ ] 3.3 Isolation-matrix row for `GET /pages?clientId`. Verify: `pnpm --filter be test:db -- isolation-matrix default-deny`
- [ ] 3.4 EXPLAIN on seeded data with `be/test/explain/pages-list.explain.sql`. Verify: `docker compose up -d --build && docker compose run --rm seed && docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql` shows `Index Scan … rank_snapshots_pk` under the LATERAL `Limit` and no `Seq Scan on rank_snapshots`

## 4. Page detail and history (6d) — PAGES-006…PAGES-008, TZ-001, TZ-003

- [ ] 4.1 Write `position-history.service.spec.ts` (default 30 days in the zone, clamp, from > to and 367 days → INVALID_DATE_RANGE) and `be/test/e2e/pages-history.e2e-spec.ts` (DST scenario, empty series kept, dropped-out page 404, unknown `timeZone` parameter 400, detail shape with lastCrawl); they fail. Verify: `pnpm --filter be test:db -- pages-history` fails
- [ ] 4.2 Implement `PositionsQueryDto`, `PositionHistoryService`, `PageReadService.getPage`; detail uses `ClientsService.getLatestRunSummary`. Verify: `pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be test:db -- pages-history`
- [ ] 4.3 Isolation-matrix rows for `GET /pages/:id` and `GET /pages/:id/positions`. Verify: `pnpm --filter be test:db -- isolation-matrix`
- [ ] 4.4 EXPLAIN of the history. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/position-history.explain.sql` shows one index range scan on `rank_snapshots_pk`
