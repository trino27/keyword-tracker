---
name: architecture-decisions
description: The few backend architecture decisions this app is built on, and the patterns deliberately not used at its scale. Read before adding a layer, a pattern or a piece of infrastructure.
---

# Backend architecture decisions

A small NestJS service over one Postgres database. The architecture is the simplest one
that keeps three things true: data access is in one place, errors have one shape, and a
user never reaches another user's data.

## Decided

- **One process, one database.** A write that spans several tables and is read back at
  once happens in ONE transaction. Atomicity is free here; do not trade it for eventual
  consistency.
- **Feature modules over shared layers.** `be/src/modules/<module>/` per business area;
  `core/`, `shared/`, `infrastructure/`, `persistence/` hold what is not a feature. Layout:
  [`practices/be/nestjs/root-module-structure`](../../../practices/be/nestjs/root-module-structure/SKILL.md).
- **Controller → service → repository.** Controllers validate input (DTOs) and map
  output; services hold the rules; repositories are the only code that speaks Drizzle
  (ESLint enforces it). A service that would only forward a repository call is skipped —
  the controller's service calls the repository directly.
- **Errors are exceptions with a code.** `createException()` declares a 4xx with a stable
  `errorCode`; `InvariantViolationException` is a 500 that should never happen. The
  frontend branches on `errorCode`, so codes are part of the API.
- **Transactions are explicit.** A repository method takes an optional
  `tx?: Transaction`; whoever opens the transaction passes it down. Visible in every
  signature, trivial to test.
- **Ownership is enforced in the query.** Every read and write of a user's data filters by
  the owner in the repository query itself — never "load, then check".
- **Slow work leaves the request path.** A crawl of 15 pages does not run inside the HTTP
  request that starts it; how it runs is decided in the plan.
- **Shared wire values live in `@app/contracts`.** The backend owns them; the frontend
  imports them ([`skills/be-canonical-fe-mirror`](../../../skills/be-canonical-fe-mirror/SKILL.md)).

## Not used here — and why

| Pattern | Why not |
| --- | --- |
| CQRS, event sourcing, outbox | No second consumer of events and no cross-service writes; plain transactions cover it. |
| Clean/Onion/hexagonal layering beyond the three layers above | Ceremony with no payoff on top of Nest modules. |
| `Result<T, E>` return types | Would duplicate the exception → `errorCode` contract the frontend already relies on. |
| Transactions through AsyncLocalStorage | Hides the transaction boundary; the explicit `tx` parameter shows it. |
| Microservices, API versioning | One frontend, deployed together with the backend from one compose file. |

If a real need argues against one of these, raise it with the reasoning — do not adopt it
silently.
