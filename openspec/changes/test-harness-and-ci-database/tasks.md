# Tasks — test-harness-and-ci-database

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 1. Correct it through the plan;
record a task that turned out wrong with an `AMENDED during implementation:` line, and one that
was already satisfied as `VERIFIED, NOT BUILT`.

## 1. Real-database test runner (1a)

- [ ] 1.1 Write `be/test/support/assert-test-database/assert-test-database.spec.ts` first ("refuses …/seo_tracker", "accepts …/seo_tracker_test"); add `<rootDir>/../test/support` to the unit Jest `roots`. Verify it fails for the missing module: `pnpm --filter be test:ci -- test/support`
- [ ] 1.2 Implement `assert-test-database.ts`. Verify: `pnpm --filter be test:ci -- test/support`
- [ ] 1.3 Extract `be/src/persistence/migrations/run-migrations/run-migrations.ts` from `be/src/migrate.ts`; the CLI calls it. Verify: `pnpm --filter be build && docker compose up -d --build` (migrate service completes)
- [ ] 1.4 Write `be/test/e2e/health.e2e-spec.ts` ("GET /api/health answers 200 with status ok through the real AppModule"). Verify it cannot run yet: `pnpm --filter be test:db` (unknown script)
- [ ] 1.5 Add `be/test/jest-db.config.json`, `be/test/support/{db-global-setup.ts,reset-database.ts,create-test-app.ts}`, `supertest` + `@types/supertest`, scripts `test:db` (be and root), `TEST_DATABASE_URL` in `.env.example`, `test` excluded in `be/tsconfig.build.json`, be lint glob `{src,test}/**/*.ts`. Verify: `pnpm dev:db && pnpm --filter be test:db`
- [ ] 1.6 Prove the skip turns into a failure. Verify: `E2E_REQUIRE_INFRA=1 TEST_DATABASE_URL=postgresql://x:y@localhost:1/none_test pnpm --filter be test:db` exits non-zero
- [ ] 1.7 Prove the dev database is refused. Verify: `TEST_DATABASE_URL=postgresql://tracker:change-me@localhost:5432/seo_tracker pnpm --filter be test:db` exits non-zero with the refusal
- [ ] 1.8 Verify `test/` stays out of the image: `pnpm --filter be build` and `dist/test` does not exist

## 2. CI runs the database tests (1b)

- [ ] 2.1 Add job `db-tests` to `.github/workflows/ci.yml`: postgres service (`seo_tracker_test`), install, `cp .env.example .env`, build contracts, `pnpm --filter be test:db` with `TEST_DATABASE_URL` and `E2E_REQUIRE_INFRA=1`. Verify: `gh pr checks --watch` shows `db-tests` green
- [ ] 2.2 Verify the existing jobs are untouched: `gh pr checks` shows `checks` and `docker` green in the same run
