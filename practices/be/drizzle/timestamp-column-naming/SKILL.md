---
name: timestamp-column-naming
description: Timestamp columns on the backend - every instant is timestamptz stored in UTC, created_at/updated_at come from shared factories, event columns are <verb>ed_at. Use when adding any date or time column.
---

# Timestamp Columns

## UTC

- Every instant is `timestamp(name, { withTimezone: true })` (`timestamptz`), stored and sent as UTC.
  Linted: a `timestamp` without `withTimezone` fails. *Why: bare `timestamp` shifts with the session
  time zone.*
- Set `TZ=UTC` for the Node process and the database container.
- Converting to a person's zone (a user in Toronto) is the client's job. A rank snapshot taken at
  00:00 UTC belongs to the previous evening in Toronto.
- A value that is a calendar day, not an instant (the day a rank was captured), is a `date` column;
  state once, in one function, how an instant maps to its day.
- Changing a shipped `timestamp` to `timestamptz` rewrites the table; get it right at creation.

## Audit pair

`created_at` and `updated_at` come only from `...auditTimestampColumns()` (last in the table).
`created_at` is set on insert; `updated_at` is re-stamped on every update through
`$onUpdate(() => new Date())`, because a plain `defaultNow()` fires on insert only and freezes.
Append-only tables use `createdAtColumn()` alone. Never hand-write these columns, and do not pass
`updatedAt: new Date()` in `.set(...)`. `$onUpdate` does not fire for raw `sql` updates.

## Event columns

Name the column after the event, past tense: `<verb>ed_at` (`crawled_at`, `finished_at`,
`resolved_at`, `captured_at`); `<noun>_at` only when no verb fits (`scheduled_at`). Never
`*_timestamp`, `*_time`, or present tense (`finish_at`).

An event column is never a copy of `created_at`. Add it only if it can differ, and say how in a
comment:

```ts
// When the position was observed. Differs from created_at for seeded and backfilled rows.
capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
```

`crawled_at` on `pages` is bumped on each re-crawl while `created_at` keeps the first insert.

| Event | Column |
| --- | --- |
| page crawled | `crawled_at` |
| crawl run started / finished | `started_at` / `finished_at` (null until it happens) |
| rank observed | `captured_at` |
| seo issue resolved | `resolved_at` (null until resolved) |

Related: [database-patterns](../database-patterns/SKILL.md).


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable.

<!-- invariant: TZ-001 -->
**Every instant is a `timestamptz`, the process and the database run in UTC, and the wire carries ISO-8601 UTC.** Pinned by the ESLint `no-restricted-syntax` timestamp selector in `be/eslint.config.mjs`, which refuses a `timestamp()` column without `withTimezone`. That the PROCESS runs in UTC is NOT pinned by a test — it rests on `be/src/core/bootstrap/tz.ts` being each entry point’s first import, and on `TZ: UTC` in `docker-compose.yml`. Specified in `openspec/specs/_root/time-zones/spec.md`.
