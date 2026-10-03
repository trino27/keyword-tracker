---
name: database-patterns
description: Drizzle + Postgres rules - naming of tables, columns, enums and indexes, bigint ids, shared column factories, closed sets, foreign-key delete policy, indexes for the queries you run, keyset vs offset pagination, batch inserts, locking, repositories and migrations. Use when touching a schema, a repository or a migration.
---

# Database Patterns

Examples use `users`, `clients`, `pages`, `keywords`, `seo_issues`, `rank_snapshots`, `crawl_runs`.
Timestamps: [timestamp-column-naming](../timestamp-column-naming/SKILL.md). Where Drizzle may be
imported: [db-access-boundary](../db-access-boundary/SKILL.md).

## Naming

- Tables and columns `snake_case`; tables plural (`rank_snapshots`); the Drizzle property is the
  camelCase mirror (`pageId`).
- Postgres enum type names end `_enum` (`crawl_run_status_enum`); the TS const is `crawlRunStatusEnum`.
  Linted.
- A `jsonb` column ends `_json` (`payload_json`), mapped to a clean property:
  `payload: jsonb('payload_json')`. Linted. Scalars get no type suffix.
- Indexes `<table>_<columns>_idx`, unique ones `<table>_<columns>_uq`, checks
  `<table>_<column>_<rule>`, so a violation names itself in the log.
- An append-only table of facts has `log` or `events` in its name (`crawl_fetch_log`).
- Renaming a shipped table or column is a two-deploy change ([Migrations](#migrations)); get names right first.

## Schema

- Every file in `persistence/schema/tables/` is also added to the `schema` object of the Drizzle
  provider in the same change; an unregistered table silently breaks relational queries and the
  migration generator.
- Primary key: the shared `primaryId()` factory (`bigserial`, `mode: 'number'`). Never hand-write it.
- **All ids are `bigint` with `mode: 'number'`**, including foreign keys; an int4 FK to a bigint PK
  overflows first. Never `mode: 'bigint'` (it leaks `bigint` into the API).
- Shared column factories live in `persistence/schema/_shared/columns/`, one per file, each returning
  a fresh builder per call (builders are stateful; sharing one instance corrupts the schema).
  Foreign keys stay explicit: `bigint('client_id', { mode: 'number' }).references(() => clients.id, { onDelete: 'cascade' })`.
- A 1:1 table (`user_settings`) uses the parent FK as its primary key, no surrogate id, unless
  another table references its rows.
- Table options return an array: `(table) => [index(...), check(...)]`.

## Closed sets

| The set is | Use |
| --- | --- |
| small, stable, ours (`crawl_run_status`, `user_role`) | pgEnum, built from the TS enum so values cannot drift |
| large or growing, ours (`seo_issues.code`: `missing_title`, `duplicate_h1`, ...) | `varchar` + one TS const + validation at the boundary |
| growing and needs DB integrity | lookup table with the code as PK and an FK to it |
| owned by an outside system (page `content_type`, an IANA zone name) | `varchar`, stored verbatim, no enum |

Never `varchar` + `CHECK (x IN (...))`; that is a worse enum. A `CHECK` relating two columns of one
row is fine and is the right tool for state invariants:

```ts
check('crawl_runs_finished_at_required', sql`${table.status} <> 'finished' OR ${table.finishedAt} IS NOT NULL`)
```

A rule that needs other rows or the previous status (a legal transition) is a guard in the service,
not a trigger.

## Indexes

- Index the queries you run, and verify with `EXPLAIN`. A rank history read filtered by page and
  date range needs `(page_id, captured_at)`; listing a user's clients needs `clients(user_id)`.
- Index every foreign key you filter or join on.
- Column order: equality columns first, then the range column.
- A unique index states a business rule: `pages (client_id, url)`,
  `rank_snapshots (page_id, keyword_id, captured_on)`. Upserts rely on it (`onConflictDoUpdate`).

## Foreign keys

User-owned rows die with the user: `onDelete: 'cascade'` from `clients.user_id`, and from `pages`,
`keywords`, `seo_issues`, `rank_snapshots` down through their client. Each cascade is a deliberate
choice; never cascade from a table that several users share. Rows are hard-deleted; no `deleted_at`
(Drizzle has no global scopes, so one missed filter leaks "deleted" rows).

## Reads and pagination

- Paginate every list. Avoid N+1 with joins or relational queries; load a page's keywords and issues
  for the whole page of results in one query, not one per row.
- **Keyset** (`WHERE (captured_at, id) < (:cursor_at, :cursor_id) ORDER BY captured_at DESC, id DESC LIMIT n`)
  for large or growing tables (rank snapshots) and infinite lists: cost does not grow with depth.
- **Offset** (`LIMIT n OFFSET m`) only for small bounded lists (a user's clients) that need page
  numbers. Always order by a unique tiebreaker (`id`).
- A history over a date range filters on the indexed columns and returns an array ordered by time;
  do not return a row per request per day when the chart wants one query.

## Writes

- Insert large sets (the seed of 50 000+ rank snapshots) in batches of 1 000-5 000 rows, one
  multi-row `insert().values([...])` per batch inside a transaction. A row-per-statement loop is
  orders of magnitude slower, and one giant statement hits the parameter limit (65 535).
- Idempotent writes use `onConflictDoUpdate` on a unique index; the `set` must not be empty.
- `updatedAt` is stamped by the column factory; do not pass it by hand
  ([timestamp-column-naming](../timestamp-column-naming/SKILL.md)).

## Repositories

- Contain Drizzle calls only: no business rules, no error mapping, no calls to other repositories.
- Methods that may run in a transaction take `tx?: Transaction` as the last parameter and use
  `(tx ?? this.db)`. The service opens the transaction and passes `tx` down.
- Every query on owned data takes the owner id ([security-patterns](../../security-patterns/SKILL.md)).
- Parameterised queries only; never concatenate SQL.

## Locking

A write that depends on a value the same transaction just read needs a lock, or two requests both
pass the check on a stale read (two crawls started for one client). Lock the aggregate's root row
first with `.for('update')` (the client row), then read, then write; child tables inherit that one
lock, so there is no lock ordering to get wrong. No lock for: creating a row, a last-write-wins
single-column update, an upsert protected by a unique index, plain reads. `FOR UPDATE` outside a
transaction locks nothing.

## Migrations

1. Edit the TS schema.
2. `pnpm --dir be run db:generate`; read the generated SQL.
3. Apply it, then run the schema test.

Never hand-write migration SQL except where Drizzle cannot express it (`generate --custom`); never
edit `_journal.json`; never `db:push`. A migration runs before the new code starts, so it must work
with the old code: no `DROP COLUMN` the old code reads, no `RENAME`, no tightening to `NOT NULL` in
one deploy; use expand then contract across two deploys. A `CHECK` added to an existing table
validates immediately: audit for violating rows first, or add it `NOT VALID` then `VALIDATE`.
`ADD VALUE` on an enum and a `SET DEFAULT` using it go in two migration files.
