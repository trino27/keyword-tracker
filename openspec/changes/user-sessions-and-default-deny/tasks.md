# Tasks — user-sessions-and-default-deny

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 2. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Users and sessions schema + contracts (2a)

- [x] 1.1 Contracts: `http/api-error-code.constant.ts`, `auth/session-user.interface.ts`, `auth/login-request.interface.ts`; write `time/is-time-zone/is-time-zone.util.test.ts` first (accepts America/Toronto, refuses Mars/Base), then the util; barrel. Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`
- [x] 1.2 Write `users.repository.int-spec.ts` and `sessions.repository.int-spec.ts` (users_email_lowercase, users_email_uq, cascade, deleteExpired) — they fail for missing tables. Verify: `pnpm --filter be test:db -- users sessions` fails
- [x] 1.3 Schema `tables/users/users.schema.ts`, `tables/sessions/sessions.schema.ts`, register in `database-schema.ts`; generate and read the SQL. Verify: `pnpm db:generate && pnpm db:migrate`
- [x] 1.4 Repositories `modules/auth/repositories/{users,sessions}/`. Verify: `pnpm --filter be test:db -- users sessions`
  AMENDED during implementation: pass Jest filters without `--` (`pnpm --filter be test:db users sessions`); pnpm 10 forwards a literal `--`, and Jest then runs every suite. drizzle-orm 0.45 has no `bytea`, so `token_hash` uses the new `byteaColumn` custom type (`persistence/schema/_shared/columns/bytea-column.ts`). DB tests got `testTimeout: 30000` — a cold ts-jest compile of AppModule overran Jest's 5 s default.

## 2. Hashing and tokens (2b) — AUTH-001, AUTH-002

- [ ] 2.1 Write `password-hasher.service.spec.ts` (format, verify true/false, parameters read from the string, malformed → false) and `session-token.spec.ts` (32 bytes base64url, sha256 32 bytes); both fail. Verify: `pnpm --filter be test:ci -- src/modules/auth/services` fails
- [ ] 2.2 Implement `PasswordHasher` with `maxmem` and `timingSafeEqual`, and `session-token.ts`; constants in `constants/session.constant.ts`. Verify: `pnpm --filter be test:ci -- src/modules/auth/services`

## 3. Endpoints, guard, default deny (2c) — AUTH-003…AUTH-009, ISO-001…ISO-005

- [ ] 3.1 Write `be/test/e2e/default-deny.e2e-spec.ts` with `be/test/support/list-routes.ts`; it fails because health is not `@Public`. Verify: `pnpm --filter be test:db -- default-deny` fails
- [ ] 3.2 `@Public()`, `@CurrentScope()`, `IUserScope`; `@Public()` on `HealthController`. Verify: `pnpm --filter be test:db -- default-deny`
- [ ] 3.3 Write `be/test/e2e/auth.e2e-spec.ts` (cookie flags, me with timeZone, logout, identical invalid answers, 429, 415, expired 401, token hash) and `auth.service.spec.ts`, `session.guard.spec.ts`, `json-only.middleware.spec.ts`; all fail. Verify: `pnpm --filter be test:db -- auth` fails
- [ ] 3.4 `json-only.middleware.ts` and `cookie-parser` in `configureApp`. Verify: `pnpm --filter be test:ci -- src/core`
- [ ] 3.5 `AuthModule`: controller, `LoginDto`, `AuthService`, `SessionGuard` as `APP_GUARD`, `create-user-scope.ts`, `UserAccountsService`, error constants and exceptions, `ThrottlerModule` + throttle constants. Verify: `pnpm --filter be test:db -- auth default-deny && pnpm --filter be test:ci -- src/modules/auth`
- [ ] 3.6 ESLint selectors in `be/eslint.config.mjs`: `as IUserScope` outside `create-user-scope.ts` and tests; `…ForWorker` calls in `src/modules/**/controllers/**`. Verify: `pnpm --filter be lint`, and a scratch `as IUserScope` in a service makes it fail (reverted)
- [ ] 3.7 `be/test/support/sign-in.ts` (asserts every seeding status) and `be/test/e2e/isolation-matrix.e2e-spec.ts` with its static partner (no id routes yet). Verify: `pnpm --filter be test:db -- isolation-matrix`
- [ ] 3.8 Stack check. Verify: `docker compose up -d --build`; `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/me` prints 401; `curl -fsS http://localhost:8080/api/health`; `docker compose ps` shows `be` healthy
