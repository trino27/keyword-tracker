# Test harness and CI database

## Why

Every later change of the keyword tracker pins its invariants against a real PostgreSQL: unique
and partial-unique indexes, `SKIP LOCKED`, `LATERAL`, trigram search, `AT TIME ZONE`, and the
isolation matrix over HTTP. None of that can run today — Jest knows only unit specs under `src/`,
and CI has no database. A suite that silently skips without a database would report green, so the
skip must become a failure in CI.

## What Changes

- `runMigrations(databaseUrl)` extracted from `be/src/migrate.ts`, shared by the CLI and the test
  setup.
- A second Jest configuration (`be/test/jest-db.config.json`) collecting `*.int-spec.ts` and
  `*.e2e-spec.ts`, run in band, with a global setup that refuses any database whose name does not
  end in `_test`, migrates it, truncates once, and skips politely unless `E2E_REQUIRE_INFRA=1`.
- `be/test/support/` (app factory over the real `AppModule` + `configureApp`, reset helper) and a
  first e2e spec over `GET /api/health`.
- `pnpm --filter be test:db` and root `pnpm test:db`; `TEST_DATABASE_URL` in `.env.example`.
- CI job `db-tests` with a `postgres:18-alpine` service container.

No requirement changes: this change is infrastructure (`skip_specs: true`).

## Impact

- `be/package.json`, `be/tsconfig.build.json`, `be/src/migrate.ts`, new `be/test/**`, root
  `package.json`, `.env.example`, `.github/workflows/ci.yml`.
- Pre-push is unchanged (DB tests need Docker); CI is where they are mandatory.
