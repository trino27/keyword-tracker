# be/src/modules/pages Specification

## Purpose
What the user reads back — the page list, one page's detail, and the rank history
behind it, each scoped to that user's own clients.

## Requirements

### Requirement [PAGES-001]: a rank snapshot is a page-keyword pair's position at an instant

A rank snapshot MUST be keyed by page, keyword and the instant it was captured, stored as
`timestamptz` in UTC; it MUST belong to an existing page-keyword pair (composite foreign key, cascading
with the pair), and its position MUST be between 1 and 100.

#### Scenario: a snapshot for a pair the page does not have
- **WHEN** a snapshot is inserted for a keyword not paired with the page
- **THEN** the insert fails on `rank_snapshots_page_keyword_fk`

#### Scenario: an out-of-range position
- **WHEN** a snapshot with position 0 or 101 is inserted
- **THEN** the insert fails on `rank_snapshots_position_range`
### Requirement [PAGES-002]: the pages list shows the user's current pages, paginated in the database

`GET /api/pages` MUST return only pages of the signed-in user's clients that were seen by their
client's latest succeeded or partial run, optionally filtered by `clientId`, ordered by client
name then sitemap position, paginated with `pageSize` at most 50, with the total of matching pages.

#### Scenario: a page dropped by a re-crawl
- **WHEN** a re-crawl no longer finds a page
- **THEN** the page is not listed and the total does not count it

#### Scenario: a failed re-crawl
- **WHEN** a client's newest run failed
- **THEN** the pages of its previous successful run are still listed

#### Scenario: a page size above the limit
- **WHEN** a request asks for `pageSize=51`
- **THEN** the answer is 400

### Requirement [PAGES-003]: search matches a page's URL or any of its current keywords, literally

The `q` parameter MUST match pages whose URL contains it, or that have a current keyword whose term
contains it, case-insensitively; `%` and `_` in `q` MUST match themselves.

#### Scenario: searching for a percent sign
- **WHEN** a user searches `%`
- **THEN** only pages whose URL or keyword literally contains `%` are returned

### Requirement [PAGES-004]: latest and best positions are computed at read time

Every keyword of a listed page MUST carry its latest position and capture instant, and each page
MUST carry its best position — the minimum latest position among its current keywords, with the
keyword that produced it (ties: higher relevance, then term) — or null when it has no snapshot;
these MUST be read from the snapshot primary key for the listed page only, never stored.

#### Scenario: a page crawled after the last seed
- **WHEN** a UI-added client's page has no snapshots
- **THEN** its best position is null and every keyword's latest position is null

### Requirement [PAGES-005]: filtering by a client the user does not own is a 404

A `clientId` that is not the signed-in user's MUST answer 404 `CLIENT_NOT_FOUND`, the same as a
non-existent one.

#### Scenario: user B filters by user A's client
- **WHEN** user B requests `/api/pages?clientId=<A's client>`
- **THEN** the answer is 404 CLIENT_NOT_FOUND

### Requirement [PAGES-006]: a page's detail carries its keywords, issues and last crawl

`GET /api/pages/:id` MUST return a current page of the signed-in user with its client, its current
keywords with latest positions, its best position, its SEO issues, and its client's latest crawl
run; any other id MUST answer 404 `PAGE_NOT_FOUND`.

#### Scenario: a page that dropped out
- **WHEN** the detail of a page absent from the latest run is requested
- **THEN** the answer is 404

### Requirement [PAGES-007]: the history has one series per current keyword

`GET /api/pages/:id/positions` MUST return `{ from, to, timeZone, series }` with one series per
current keyword of the page, each a list of `{ capturedAt (UTC ISO), position }` in time order; a
keyword without points in the range MUST keep an empty series. The read MUST be one range scan of
the snapshot primary key for that page.

#### Scenario: a keyword added by a re-crawl
- **WHEN** the range ends before the keyword's first snapshot
- **THEN** its series is present and empty

### Requirement [PAGES-008]: the history range is bounded

Without `from` and `to` the range MUST be the last 30 days ending today in the user's zone; a `to`
after today MUST be clamped to today; `from` after `to`, or a span above 366 days, MUST answer 400
`INVALID_DATE_RANGE`; a malformed date MUST answer 400.

#### Scenario: a range of 367 days
- **WHEN** a request spans 367 calendar days
- **THEN** the answer is 400 INVALID_DATE_RANGE

