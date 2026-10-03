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
