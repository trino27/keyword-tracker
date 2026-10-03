# Tasks — positions-and-seed

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 5. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Snapshot storage (5a) — PAGES-001

- [ ] 1.1 Write `rank-snapshots.repository.int-spec.ts` (composite FK, position CHECK, ON CONFLICT DO NOTHING keeps the first row, page delete cascades); it fails. Verify: `pnpm --filter be test:db -- rank-snapshots` fails
- [ ] 1.2 Schema `tables/rank-snapshots/rank-snapshots.schema.ts`, register, generate, read the SQL (composite FK present), migrate; `RankSnapshotsRepository`. Verify: `pnpm db:generate && pnpm db:migrate && pnpm --filter be test:db -- rank-snapshots`

## 2. Position generator (5b) — SEED-003…SEED-005

- [ ] 2.1 Write specs under `be/src/seed/position-generator/**` (determinism, a→c equals a→b continued, range 1..100, baselines for r=1 and r=0.2, latest noon at 11:59Z is yesterday, `historyDays(180)=365`, `historyDays(100)=500`); they fail. Verify: `pnpm --filter be test:ci -- src/seed/position-generator` fails
- [ ] 2.2 Implement `hash-seed`, `prng`, `baseline`, `generate-positions`, `history-days`. Verify: `pnpm --filter be test:ci -- src/seed/position-generator`

## 3. The seed command (5c) — SEED-001…SEED-004

- [ ] 3.1 Write `seed-runner.int-spec.ts` (fixture transport, `resetDatabase()` first: two users and clients, seed-triggered runs succeeded, ≥ 50 000 rows, second run adds 0, UI-added page gets full history, `--positions-only` creates no run, failed crawl → error) and `seed-runner.service.spec.ts` (no enqueue for a succeeded client); they fail. Verify: `pnpm --filter be test:db -- seed-runner` fails
- [ ] 3.2 `PositionSeedService`, `UserAccountsService.upsertUserForWorker`, `ClientCrawlRunsService.enqueueForWorker`; `be/src/seed/{seed.ts, seed.module.ts, seed-accounts.constant.ts, seed-runner/}`. Verify: `pnpm --filter be test:db -- seed-runner && pnpm --filter be test:ci -- src/seed`
- [ ] 3.3 Scripts `seed` (be, root); compose service `seed` (`profiles: [tools]`, after migrate, worker enabled, `SEED_USER_PASSWORD`); `.env.example` `SEED_USER_PASSWORD=demo-password-change-me`. Verify: `docker compose up -d --build && docker compose run --rm seed` exits 0
- [ ] 3.4 Live outcome. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots"` ≥ 50000; `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots where extract(hour from captured_at at time zone 'UTC') <> 12 or captured_at > now()"` = 0; a second `docker compose run --rm seed` reports 0 rows added
- [ ] 3.5 Seed users can sign in. Verify: `curl -s -H 'Content-Type: application/json' -d '{"email":"yoast.manager@example.com","password":"demo-password-change-me"}' -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login` prints 200
- [ ] 3.6 No secret in code. Verify: `git grep -n "demo-password" -- be/src` prints nothing
