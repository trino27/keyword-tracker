# Pages list, page detail and position history

## Why

The Pages screen and the page detail need three scoped reads: a filterable, searchable, paginated
list with each page's keywords, latest and best positions and issue counts; a page's detail; and a
position history over a calendar range the user picks in their own zone. Snapshots are UTC
instants and the user is in Toronto, so the range conversion must be correct across DST, and the
list must stay fast at the seeded volume without denormalizing positions.

## What Changes

- `@app/contracts`: `TIsoDay`, `dayRangeToUtc`, `todayInZone`, `addDays`, `isIsoDay`, history
  limits; page list, detail and history wire shapes; page-size limits.
- `pg_trgm` (a drizzle-kit `--custom` migration) and GIN trigram indexes on `pages.url` and
  `keywords.term`.
- `GET /api/pages`, `GET /api/pages/:id`, `GET /api/pages/:id/positions`, each scoped, each in the
  isolation matrix.
- `EXPLAIN` scripts for the list and the history on seeded data.

## Capabilities

- `be/src/modules/pages` — PAGES-002…PAGES-008 (new; PAGES-001 came with `positions-and-seed`).
- `_root/time-zones` — TZ-001…TZ-003 (new; TZ-004 arrives with `tracker-screens`).

## Impact

- `pages` module gains its controller, DTOs, `PageReadService`, `PositionHistoryService`,
  `pick-best-position`, `PageListRepository`; `be/src/core/utils/escape-like/`; two migrations.
