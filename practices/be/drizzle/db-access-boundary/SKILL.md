---
name: db-access-boundary
description: Where Drizzle and the table row types (*DbModel / *InsertModel) may be imported (repositories only) and where domain interfaces (I*) are used instead. Use when adding a repository or service, or when the DB-access ESLint error appears.
---

# DB Access Boundary

**Rule:** `drizzle-orm` and `@persistence/schema/*` are imported only from `repositories/**`.
Everything above a repository (services, controllers) speaks domain interfaces (`IPage`,
`IClient`) and never names a `*DbModel` or `*InsertModel`. *Why: the ORM and the row shape stay
replaceable, and a query cannot be written in a controller by accident.*

Enforced by an ESLint restricted-imports rule over `be/src/modules/**` that also bans
`import type`. The rule additionally permits `services/domain/**`; this app has no such folder, so
do not add one to get around the rule.

| Layer | May import Drizzle / schema |
| --- | --- |
| `repositories/**` | yes |
| `services/**`, controllers, schedulers | no, use `I*` |

## Mapping

- A repository returns `I*` (or a record interface), selecting the columns it needs or mapping the
  row before returning.
- `IPage` is the joined aggregate (`keywords`, `seoIssues`, `latestRank`). A method that returns the
  bare row returns `IPageRecord`; a row is structurally assignable to it.
- Write inputs are interfaces too (`IClientCreateInput`), not `*InsertModel`.
- If a caller needs a field the interface lacks, add it to the interface and populate it. A cast at
  the call site is the signal that this was skipped.

Raw SQL that spans several tables (for example deleting everything a user owns) goes in a
repository named for the act (`UserErasureRepository`), not in a service.
