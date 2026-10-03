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
- **Passwords: scrypt** (`N=2^15, r=8, p=1`, `maxmem` 256 MiB), stored `$N$r$p$salt$hash` so the
  parameters can rise without a migration. Chosen over argon2/bcrypt because it is in Node's
  crypto — no native dependency to build in the image.
- **Unknown email and wrong password are indistinguishable**: one message, one status, and a
  dummy hash is verified for an unknown email so the timing matches.
- **There is no sign-up.** Accounts come from the seed (`UserAccountsService.upsertUserForWorker`).
- **Next:** Postgres row-level security keyed on the session's user, as a second line behind the
  scoped queries.
