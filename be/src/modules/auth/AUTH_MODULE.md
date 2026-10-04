# Auth module

Owns `users` and `sessions`. Mechanics are in the code; this file holds the why.

- **Sessions are server-side.** The cookie (`sid`, HttpOnly, SameSite=Lax, Secure behind HTTPS)
  carries 32 random bytes; Postgres stores only their SHA-256. Sign-out deletes the row, so a
  stolen cookie dies with it — a JWT would live until it expired. Sessions slide: a request in
  the last part of the lifetime extends it.
- **Default deny.** `SessionGuard` is the global `APP_GUARD`; a route is public only with
  `@Public()` (login, health). The e2e `default-deny` test lists every route and fails on a new
  unguarded one.
- **The user's scope is created in one place**, `create-user-scope.ts`; ESLint refuses
  `as IUserScope` anywhere else, so a service cannot fabricate another user's scope.
- **Passwords: scrypt** (`N=2^17, r=8, p=1`, `maxmem` 256 MiB), stored `$N$r$p$salt$hash` so the
  parameters can rise without a migration. Chosen over argon2/bcrypt because it is in Node's
  crypto — no native dependency to build in the image.
- **Unknown email and wrong password are indistinguishable**: one message, one status, and a
  dummy hash is verified for an unknown email so the timing matches.
- **There is no sign-up.** Accounts come from the seed (`UserAccountsService.upsertUserForWorker`).
- **Next:** Postgres row-level security keyed on the session's user, as a second line behind the
  scoped queries.


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8). Each marker carries the requirement's
permanent id, what must stay true, and what pins it. Stated as a trailing section rather than
interleaved so the set is greppable and a reader can see at once what this module is held to.
Unless another path is named, the requirement is in `openspec/specs/be/src/modules/auth/spec.md`.

<!-- invariant: AUTH-001 -->
**A password is stored only as a self-describing `scrypt$N$r$p$salt$hash`, and verification reads the parameters from the stored string rather than from today’s defaults.** Pinned by `services/password-hasher/password-hasher.service.spec.ts` -> "hashes into scrypt$N$r$p$salt$hash with the production parameters by default", "reads N, r and p from the stored string, not from the current defaults", "produces a different salt every time".

<!-- invariant: AUTH-002 -->
**The 32-byte session token exists only in the `sid` cookie; the database holds only its sha256.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "the session row holds sha256 of the cookie value, never the value itself"; `services/session-token/session-token.spec.ts` -> "is 32 random bytes, base64url-encoded".

<!-- invariant: AUTH-003 -->
**The session cookie is HttpOnly, SameSite=Lax, Path=/, seven days, and slides at most once a minute.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "login sets an HttpOnly, SameSite=Lax session cookie for 7 days and returns the user"; `services/auth/auth.service.spec.ts` -> `describe('resolveSession')` -> "does not slide the expiry within the touch interval" and "slides the expiry to now + 7 days once the touch interval has passed".

<!-- invariant: AUTH-004 -->
**An unknown email and a wrong password answer identically, at comparable cost.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "answers an unknown email and a wrong password identically"; `services/auth/auth.service.spec.ts` -> "verifies against the dummy hash when the user is unknown, so timing reveals nothing".

<!-- invariant: AUTH-006 -->
**Sign-out deletes the session row and clears the cookie; the old token authenticates nothing.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "logout answers 204, clears the cookie, and the session no longer works"; `repositories/sessions/sessions.repository.int-spec.ts` -> "deleteByTokenHash removes exactly that session".

<!-- invariant: AUTH-007 -->
**The session endpoint returns the user’s own `users.time_zone`, never a zone the client supplied.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "me returns the user with their time zone"; `guards/session/session.guard.spec.ts` -> "attaches a scope with userId and timeZone, and the session user".

<!-- invariant: AUTH-009 -->
**Every successful sign-in deletes every session whose expiry has passed.** Pinned by `services/auth/auth.service.spec.ts` -> "purges expired sessions on login and stores only the token hash"; `repositories/sessions/sessions.repository.int-spec.ts` -> "deleteExpired removes only expired rows".

<!-- invariant: ISO-001 -->
**Every route answers 401 without a session; the public set is exactly `POST /api/auth/login` and `GET /api/health`. (`openspec/specs/_root/data-isolation/spec.md`)** Pinned by `be/test/e2e/default-deny.e2e-spec.ts` -> "the @Public routes are exactly POST /api/auth/login and GET /api/health" and "every non-public route answers 401 without a session".

<!-- invariant: ISO-003 -->
**Only the session guard can mint an `IUserScope`; every repository method over user data takes one. (`openspec/specs/_root/data-isolation/spec.md`)** Pinned by the ESLint `no-restricted-syntax` scope-forgery selector in `be/eslint.config.mjs`, disabled only for `guards/session/create-user-scope.ts`. The "first parameter" half is not pinned by a rule — it is held by review.

<!-- invariant: ISO-004 -->
**An unscoped repository method is suffixed `ForWorker`, and no controller may call one. (`openspec/specs/_root/data-isolation/spec.md`)** Pinned by the ESLint `no-restricted-syntax` worker-call selector in `be/eslint.config.mjs`, scoped to `src/modules/**/controllers/**`. The naming half is not pinned — nothing detects an unscoped method named otherwise.

<!-- invariant: SEED-001 -->
**One idempotent command upserts the two Toronto demo accounts and their clients, taking the password from the environment. (`openspec/specs/be/src/seed/spec.md`; `be/src/seed/` has no document of its own)** Pinned by `be/src/seed/seed-runner/seed-runner.int-spec.ts` -> "first run: two users, two clients crawled by seed runs", "a second run on the same day adds no rows and crawls nothing", "--positions-only creates no crawl run and no account". "No secret in code" is not pinned — nothing greps for a literal.
