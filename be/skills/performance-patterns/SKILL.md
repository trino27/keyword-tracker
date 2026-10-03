---
name: performance-patterns
description: How this backend stays fast with a large rank-snapshot table and a slow crawl — repository-owned queries, batched reads, windowed scans, outbound fetch limits. Read before writing a list query, touching the snapshots table, or adding work that calls another site.
---

# Performance patterns

Generic Node/NestJS performance advice is assumed. These are the rules this backend's
data makes necessary.

- **Queries live in repositories.** Tuning (indexes, `select` projections, joins instead of
  N+1) is therefore a repository-local change. Batch with one `inArray(...)` query instead
  of a per-id loop — e.g. the latest position for every page on a list screen in one query.
- **The snapshots table is read by window, never whole.** Every query takes a date range and
  a page or client scope; the composite index that serves it ships in the same change as
  the query, leading with the columns the query filters by. Check the plan with `EXPLAIN`
  on seeded data.
- **Lists paginate in the database.** `LIMIT`/`OFFSET` (or keyset for deep scans) with a
  separate `count(*)` only when the screen shows a total — never load and slice in memory.
- **"Latest position" is one query, not a scan per row.** Use `DISTINCT ON` or a lateral
  join over the index, not a subquery per page.
- **Large inserts are batched.** The seed writes tens of thousands of snapshot rows in
  chunks of a few thousand per `INSERT`.
- **Outbound fetches are bounded.** Timeout, response-size limit and a small concurrency
  limit on every crawl request ([`practices/be/remote-api-core`](../../../practices/be/remote-api-core/SKILL.md)).
- **Slow work stays off the request path.** Starting a crawl records it and returns at
  once; the crawl runs outside the request.

## Anti-patterns

- An unbounded `SELECT` on the snapshots table.
- Query logic in a service, or a per-row loop a single batched query replaces.
- A crawl awaited inside the HTTP request that started it.
