# User sessions and default deny

## Why

Everything in the tracker is behind a login, and a user must never reach another user's data by
any route, including a changed id. That needs three things before any data route exists: a
session that survives a refresh, a backend that denies every route unless it is explicitly public,
and a scope object that every data query must take — so that a forgotten ownership check is a
missing argument rather than a forgotten `if`.

## What Changes

- Tables `users` (email, scrypt hash, IANA `time_zone`) and `sessions` (sha256 of the token,
  sliding expiry).
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- A global session guard (`APP_GUARD`) and `@Public()`; only login and health are public.
- `IUserScope` (branded) created only by the guard; `@CurrentScope()` to read it.
- A JSON-only rule for mutating requests (CSRF, with SameSite=Lax and one origin).
- Login rate limiting (`@nestjs/throttler`).
- ESLint: no forged `as IUserScope`; no `…ForWorker` call from a controller.
- e2e: default-deny route enumeration; the isolation-matrix harness with its static partner.

## Capabilities

- `be/src/modules/auth` — AUTH-001…AUTH-009 (new).
- `_root/data-isolation` — ISO-001…ISO-005 (new).

## Impact

- New `be/src/modules/auth/**`, `be/src/shared/user-scope/`, `be/src/core/decorators/**`,
  `be/src/core/middleware/json-only/`; changed `configure-app.ts`, `app.module.ts`,
  `health.controller.ts` (`@Public`), `be/eslint.config.mjs`; contracts `auth/*`,
  `http/api-error-code.constant.ts`, `time/is-time-zone/`.
- The frontend is unaffected: it calls only `GET /api/health`, which stays public.
