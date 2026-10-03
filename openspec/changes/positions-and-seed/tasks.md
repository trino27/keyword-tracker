# Tasks — positions-and-seed

Generated from the plan `keyword-tracker` (docs/_plans-archive/), Phase 5. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Snapshot storage (5a) — PAGES-001

- [x] 1.1 Write `rank-snapshots.repository.int-spec.ts` (composite FK, position CHECK, ON CONFLICT DO NOTHING keeps the first row, page delete cascades); it fails. Verify: `pnpm --filter be test:db -- rank-snapshots` fails
- [x] 1.2 Schema `tables/rank-snapshots/rank-snapshots.schema.ts`, register, generate, read the SQL (composite FK present), migrate; `RankSnapshotsRepository`. Verify: `pnpm db:generate && pnpm db:migrate && pnpm --filter be test:db -- rank-snapshots`
  AMENDED during implementation: the repository also lists the current pairs with their last snapshot (`listCurrentPairsForWorker`, one LATERAL per pair) — what the seed's fill-up reads. Deleting a client failed with a foreign-key error, because `pages.last_seen_run_id` and `page_keywords.last_seen_run_id` referenced `crawl_runs` without an action; migration 0004 makes both cascade, pinned by "deleting a client removes its runs, pages, pairs and snapshots, not the keywords".

## 2. Position generator (5b) — SEED-003…SEED-005

- [x] 2.1 Write specs under `be/src/seed/position-generator/**` (determinism, a→c equals a→b continued, range 1..100, baselines for r=1 and r=0.2, latest noon at 11:59Z is yesterday, `historyDays(180)=365`, `historyDays(100)=500`); they fail. Verify: `pnpm --filter be test:ci -- src/seed/position-generator` fails
- [x] 2.2 Implement `hash-seed`, `prng`, `baseline`, `generate-positions`, `history-days`. Verify: `pnpm --filter be test:ci -- src/seed/position-generator`
  AMENDED during implementation: `history-days` also holds `latestCapture(now)`; the tunables are `position-generator.constant.ts`.

## 3. The seed command (5c) — SEED-001…SEED-004

- [x] 3.1 Write `seed-runner.int-spec.ts` (fixture transport, `resetDatabase()` first: two users and clients, seed-triggered runs succeeded, ≥ 50 000 rows, second run adds 0, UI-added page gets full history, `--positions-only` creates no run, failed crawl → error) and `seed-runner.service.spec.ts` (no enqueue for a succeeded client); they fail. Verify: `pnpm --filter be test:db -- seed-runner` fails
- [x] 3.2 `PositionSeedService`, `UserAccountsService.upsertUserForWorker`, `ClientCrawlRunsService.enqueueForWorker`; `be/src/seed/{seed.ts, seed.module.ts, seed-accounts.constant.ts, seed-runner/}`. Verify: `pnpm --filter be test:db -- seed-runner && pnpm --filter be test:ci -- src/seed`
  AMENDED during implementation: `PositionSeedService` lives in `be/src/seed/position-seed/` and writes through `SnapshotWriterService`, the pages module's exported facade over the snapshots — the seed depends on modules, never the reverse. `ClientCrawlRunsService` also gained `upsertClientForWorker`, `getSeedStateForWorker` and `getRunStatusForWorker`; `enqueueForWorker` answers with the run already in flight instead of failing.
- [x] 3.3 Scripts `seed` (be, root); compose service `seed` (`profiles: [tools]`, after migrate, worker enabled, `SEED_USER_PASSWORD`); `.env.example` `SEED_USER_PASSWORD=demo-password-change-me`. Verify: `docker compose up -d --build && docker compose run --rm seed` exits 0
  AMENDED during implementation: `seed.ts` starts its crawl worker explicitly, so the compose service needs no `CRAWL_WORKER_ENABLED` and `pnpm seed` works whatever the local `.env` says.
- [x] 3.4 Live outcome. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots"` ≥ 50000; `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots where extract(hour from captured_at at time zone 'UTC') <> 12 or captured_at > now()"` = 0; a second `docker compose run --rm seed` reports 0 rows added
  VERIFIED: the first live run crawled both sites (≈ 70 s) and stored 156 pairs × 365 days = 56 940 rows; 0 rows off 12:00 UTC or in the future; the second run printed "crawl Semrush skipped, crawl Yoast skipped, 0 rows added".
- [x] 3.5 Seed users can sign in. Verify: `curl -s -H 'Content-Type: application/json' -d '{"email":"yoast.manager@example.com","password":"demo-password-change-me"}' -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login` prints 200
- [x] 3.6 No secret in code. Verify: `git grep -n "demo-password" -- be/src` prints nothing
