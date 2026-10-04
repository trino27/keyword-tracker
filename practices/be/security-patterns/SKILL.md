---
name: security-patterns
description: Security rules for the backend - per-owner data scoping on every query, password hashing, auth cookies, secrets, constant-time comparison, input validation. Use when writing an endpoint that reads or writes user-owned data or touches authentication.
---

# Security Patterns

## Per-owner data scoping

A user must never reach another user's data. The scope is part of the query, not a check after it.

- Every repository method that reads or writes owned rows takes the owner id and puts it in the
  `WHERE`. Pages, keywords, seo issues and rank snapshots are scoped through their client:
  `... JOIN clients ON clients.id = pages.client_id WHERE clients.user_id = :userId`.
  *Why: fetch-by-id then compare `row.userId` leaks the moment someone forgets the comparison.*
- A row owned by someone else answers exactly like a missing one (404, same body), so ids cannot
  be probed.
- The owner id comes from the verified token (`req.user.sub`), never from a path, query or body.
- A test for every owned resource logs in a second user and expects 404.

## Passwords and sessions

- Hash with argon2id or bcrypt; never store, log or return a password or its hash.
- Same error and similar timing for "unknown email" and "wrong password".
- The auth token goes in an `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`) cookie, not in
  `localStorage`. A cookie-authenticated API that changes state needs CSRF protection (a required
  custom header, or `SameSite` plus an origin check).
- Access tokens are short-lived. The signing secret comes from config, differs per environment and
  is never committed.

## Input and output

- Validate every body, query and param with a DTO; the global pipe uses `whitelist: true`
  ([nestjs-best-practices](../nestjs/nestjs-best-practices/SKILL.md)).
- SQL goes through Drizzle or parameterised `sql`; never concatenate user input.
- Never return a raw DB error or stack trace. 5xx bodies are generic.
- A URL the user submits (a client's website) is untrusted: see
  [remote-api-core](../remote-api-core/SKILL.md) for the SSRF guard.
- Rate-limit login and any endpoint that starts a crawl.

## Comparing secrets

Never compare a secret or MAC with `===`; it leaks match progress through timing. Use
`crypto.timingSafeEqual` behind a length check (it throws on unequal lengths).


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable — these are this product’s requirements, carried here because this is the document that states the rule they rest on.

<!-- invariant: AUTH-005 -->
**Sign-in is rate-limited per address and per email; past the limit the answer is 429, not a slower 401.** Pinned by `be/test/e2e/auth.e2e-spec.ts` -> "the 11th login attempt for one email within a minute is 429". The per-address half of the key is NOT separately pinned — no test varies the client address. Specified in `openspec/specs/be/src/modules/auth/spec.md`.

<!-- invariant: AUTH-008 -->
**A mutating request whose body is not `application/json` is refused — the defence against a cross-site form post.** Pinned by `be/src/core/middleware/json-only/json-only.middleware.spec.ts` -> "refuses a form-encoded body — what a cross-site form would send", "accepts JSON, with or without a charset", "ignores safe methods"; `be/test/e2e/auth.e2e-spec.ts` -> "a login that is not application/json is refused with 415". Specified in `openspec/specs/be/src/modules/auth/spec.md`.

<!-- invariant: ISO-002 -->
**A row owned by someone else answers exactly like a missing one — same status, same body — and the decision is made in the query’s SQL.** Pinned by `be/test/e2e/isolation-matrix.e2e-spec.ts` -> "%s: user B gets the not-found answer for user A’s object", which compares status AND body against the same request with a never-existing id; `be/test/e2e/pages-history.e2e-spec.ts` -> "another user gets 404 for this page and its positions". Specified in `openspec/specs/_root/data-isolation/spec.md`.

<!-- invariant: ISO-005 -->
**Every route taking an id or a `clientId` has a row in the isolation matrix, and the suite fails when a new one does not.** Pinned by `be/test/e2e/isolation-matrix.e2e-spec.ts` -> "covers every route that takes an id or a clientId", which compares the matrix’s keys against the application’s own route list. Specified in `openspec/specs/_root/data-isolation/spec.md`.
