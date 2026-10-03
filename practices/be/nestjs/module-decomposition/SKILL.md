---
name: module-decomposition
description: The controller -> service -> repository layering inside a module and the few rules for when to split a controller, a service or a repository. Use when designing a module or deciding whether to split one.
---

# Module Decomposition

**Rule:** split by driver (different guards, different aggregates, different concerns), never by
file size.

```
Controller   routing, guards, DTO binding, response mapping. No rules, no SQL.
   |
Service      the use case: rules, orchestration, transactions
   |
Repository   Drizzle queries only (the only layer that imports it)
```

A controller never calls a repository. A service never imports Drizzle
([db-access-boundary](../../drizzle/db-access-boundary/SKILL.md)).

## Controllers

- One controller per aggregate or audience: `pages.controller.ts`, `clients.controller.ts`,
  `crawl-runs.controller.ts`.
- Split a controller only when the guard set differs or the aggregates are distinct. Never into
  `pages-read` / `pages-write` with the same guards.

## Services

- Named by the concern, not CRUD: `CrawlRunService` (start, finish, fail), `PageReadService`
  (list and detail reads), `RankHistoryService`.
- The service owns the transaction and passes `tx` to repositories.
- Split a service when its methods answer different questions or it passes ~300 lines of unrelated
  logic; keep it whole when all methods serve one use case.
- A boolean parameter that changes the shape of the result, with two callers passing different
  values, becomes two intent-named methods. With one caller, leave it.

## Repositories

- One repository per table or tight table group (`PagesRepository`, `RankSnapshotsRepository`).
- No business rules, no calls to other repositories, no transaction of its own: it takes
  `tx?: Transaction` and runs on it when given.
- Split into reads and writes classes only if one grows past what you can read in a sitting.

## New module checklist

1. Schema in `persistence/schema/tables/`, registered with the Drizzle provider, migration
   generated ([database-patterns](../../drizzle/database-patterns/SKILL.md)).
2. `<name>.module.ts`, repository, service, DTOs, controller, in that order.
3. `providers` lists services and repositories; `exports` lists only the service(s) other modules
   call ([cross-module-dependencies](../cross-module-dependencies/SKILL.md)).
4. Import the module in `AppModule`; colocate specs; run lint, typecheck, tests.
