# Tasks — page-checks-required

Generated from the plan `page-check-status-sections` (`docs/_plans/`), Phase 2. Correct it through
the plan; record a wrong task with an `AMENDED during implementation:` line and an
already-satisfied one as `VERIFIED, NOT BUILT`.

`page-check-status-sections` must be closed before task 1.1 starts, and task 1.1 is a gate: a
non-zero answer stops this change rather than starting it.

## 1. Readiness (2a)

- [x] 1.1 Every page records its checks, on every database this will be deployed to. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from pages where checks_judged is null"` returns `0` — write the number and the database here. Any other answer stops the phase; the remedy is a re-crawl per client through the UI or `pnpm seed`, never `docker compose down -v`
      - ANSWERED: `seo_tracker` returns **17**, not 0 — 105 pages, 17 without the record, and 88 of 88 CURRENT pages with it. Every client was re-crawled first.
- [x] 1.2 Confirm plan O1 is being closed on its own terms and not on a convenient database. Verify: list here which databases were checked
      - ANSWERED: `seo_tracker`, the only database this is deployed to. The answer is not a convenient one — it is the answer that withdrew the change.

## 2. The tightening (2b)

- [~] 2.1 Invert the legacy case in `pages.repository.int-spec.ts` first: "refuses a page inserted without the judged array", expecting `23502` on `checks_judged`; it fails, because null is still legal. Verify: `pnpm --filter be test:db -- src/modules/pages/repositories/pages` fails
- [~] 2.2 `pages.schema.ts`: `.notNull()` on both array columns, and the four CHECKs lose their `is null or` arms. Then `pnpm db:generate` and READ `be/drizzle/0010_*.sql`: it must set NOT NULL on both columns and REPLACE the four loosened constraints — a changed CHECK must appear as a DROP followed by an ADD. If it does not, drizzle-kit is not diffing CHECK definitions (plan R3) and the replacement needs its own `pnpm --filter be exec dotenv -e ../.env -- drizzle-kit generate --custom` migration; record which happened. Verify: the SQL as read, then `pnpm db:migrate`
- [~] 2.3 No constraint definition still contains `is null or`. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "\d+ pages"`
- [~] 2.4 `page-detail.repository.ts` (`ICurrentPageRecord` loses the null), `compose-page-checks.ts` (loses the null branch and the `| null` on its return), `page-read.service.ts`. Verify: `pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be test:db -- src/modules/pages`
- [~] 2.5 `page-list.repository.int-spec.ts` fixtures gain arrays consistent with their `checksApplicable: 18` — an insert without them now fails with `23502`. This breakage is planned, not a surprise. Verify: `pnpm --filter be test:db -- src/modules/pages/repositories/page-list`, and the order-by tests still pass
- [~] 2.6 `packages/contracts/.../page-detail.interface.ts`: `checks: IPageCheck[]`. Verify: `pnpm --filter @app/contracts run build && pnpm typecheck` — the failures it reports in `fe` are the list of branches to delete in 2.7
- [~] 2.7 `PageSchemas.ts` loses `.nullable()`; `ChecksSection.tsx` loses the null branch and the "Re-crawl this page to see each check." copy; the tests that covered that state are deleted with it. Verify: `pnpm --filter fe test:ci && pnpm typecheck && pnpm lint`
- [~] 2.8 No trace of the transitional copy remains. Verify: `git grep -n "Re-crawl this page to see each check" -- fe packages be` prints nothing
- [~] 2.9 Commits: `refactor(be): every page records its checks, so the columns are required`; `refactor(fe): drop the branch for a page with no recorded checks`

## 3. Phase acceptance (2c)

- [~] 3.1 Verify: `pnpm lint && pnpm typecheck && pnpm test`
- [~] 3.2 Verify: `pnpm --filter be test:db`
- [~] 3.3 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`, then `/pages/<id>` in a browser still shows the Checks section with its rows and no console error
- [~] 3.4 Harvest: the two-phase nullable→NOT NULL technique and the reason reconstruction was refused belong in `be/skills/architecture-decisions/SKILL.md` if `page-check-status-sections` did not already put them there. Verify: `git grep -n "checks_judged" -- be/skills practices` finds it once, not twice
- [~] 3.5 Archive. No spec delta to rewrite — this change declares `skip_specs: true`. Verify: `pnpm exec openspec list` no longer shows it as in flight


> `[~]` = NOT DOABLE. See the proposal's "Outcome": the gate answers 17, the remaining
> rows can never be filled, and a dishonest backfill is refused by the constraint that
> protects the column. Nothing below was done, and nothing below should be.