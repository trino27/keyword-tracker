## ADDED Requirements

### Requirement: SPEED-020 — a page has one measurement per device, each its own job, and only mobile holds Lighthouse

A page MUST have at most one `page_speed` row per strategy — `mobile` and `desktop` — removed with
the page. Each row MUST be queued, claimed, retried, failed and completed independently of the
other. The database MUST refuse a row that does not name its strategy, and MUST refuse a desktop
row that holds a Lighthouse list, a Lighthouse failed count or a category score. A desktop
measurement MUST NOT write, replace or remove the page's Lighthouse record or Lighthouse
findings. Rows that existed before desktop was measured MUST be `mobile` rows, unchanged.

#### Scenario: a page measured on both devices
- **WHEN** a page has a `done` mobile row and its desktop attempt times out
- **THEN** the mobile row and its findings are unchanged, and only the desktop row returns to the
  queue

#### Scenario: an insert that forgets the strategy
- **WHEN** a write inserts a `page_speed` row without a strategy
- **THEN** the database rejects it

#### Scenario: a desktop row with a Lighthouse verdict
- **WHEN** a write sets `lighthouse_judged` or `seo_score` on a desktop row
- **THEN** the database rejects it on `page_speed_lighthouse_mobile_only`

#### Scenario: a desktop measurement of a page with Lighthouse findings
- **WHEN** a page holds two Lighthouse findings from its mobile measurement and its desktop row
  is measured
- **THEN** both Lighthouse findings, the mobile row's Lighthouse lists and the page's score are
  unchanged

#### Scenario: after the migration
- **WHEN** the migration runs over a database of mobile measurements
- **THEN** every existing row is a `mobile` row with its measurement intact, and no desktop row
  exists until a crawl queues one

## MODIFIED Requirements

### Requirement: SPEED-001 — a finished crawl queues its pages in the same transaction that makes them current

The crawl's finalize MUST queue each page it stored for a PageSpeed measurement on each strategy
— mobile and desktop — inside the same transaction that writes the page and the run's outcome,
and MUST announce the queue on `page_speed_queued` in that transaction. A finalize that rolls
back — including one refused by the attempt fence — MUST queue nothing. The crawl MUST NOT call
Google.

Modified by `desktop-core-web-vitals`: each page is now measured on two devices (plan D9), so the
finalize queues two rows per page. The transaction boundary is unchanged.

#### Scenario: a crawl of fifteen posts
- **WHEN** a run finishes `succeeded` with 15 pages, none measured before
- **THEN** 30 `page_speed` rows exist with status `queued`, 15 per strategy, committed with the
  run

#### Scenario: a superseded attempt reaches finalize
- **WHEN** attempt 1 reaches finalize after attempt 2 claimed the run
- **THEN** attempt 1's transaction writes no `page_speed` row

### Requirement: SPEED-002 — a page is re-measured at most once a day

A crawl MUST (re)queue a page's measurement on a strategy only when that strategy has no row, its
last attempt failed, or its last measurement is at least `PAGE_SPEED_FRESH_FOR_MS` (24 hours)
old; a row already queued or running MUST be left as it is. Re-queuing MUST NOT clear the stored
measurement. The two strategies MUST be judged independently.

Modified by `desktop-core-web-vitals`: freshness is per row, and a row is now one strategy.

#### Scenario: measured exactly 24 hours ago
- **WHEN** a page's mobile row was measured 24 h before the crawl's finalize
- **THEN** its mobile row is `queued` with attempts 0, and its old measurement is still stored

#### Scenario: measured one second less than 24 hours ago
- **WHEN** a page's mobile row was measured 23 h 59 min 59 s before the finalize
- **THEN** its mobile row is unchanged

#### Scenario: the last attempt failed
- **WHEN** a page whose row is `failed` is crawled again
- **THEN** its row is `queued` with attempts 0

#### Scenario: a fresh mobile row and no desktop row
- **WHEN** a page measured on mobile an hour ago, never on desktop, is crawled
- **THEN** its mobile row is unchanged and a desktop row is `queued`

### Requirement: SPEED-014 — users and clients take turns in the queue

Of the due rows, a slot MUST claim one of the user served longest ago, then of that user's
client served longest ago, then, within that client, a mobile row before a desktop row, then
the oldest; a user or client never served goes first. A user or client is served at the latest
claim of any of its rows, on either device, so a backlog of one user's pages never stands in
front of a client added after it. A claim MUST take one row, page and strategy together, and
every outcome of the attempt MUST be written to that row alone.

Modified by `desktop-core-web-vitals`: a page now has two rows (SPEED-020). A desktop claim
serves its client as a mobile one does, or a client's desktop backlog would count as never
served and jump every queue. Within a client mobile goes first, because mobile feeds the score,
the list's badge and Lighthouse's verdicts (plan D44).

#### Scenario: a client is added behind a backlog
- **WHEN** one client has 3 pages queued and a second client then queues 1
- **THEN** the claims take the first client's page, the second client's page, then the rest

#### Scenario: a user with many clients
- **WHEN** one user's 3 clients have a page queued each and another user then queues 1
- **THEN** the second claim takes the other user's page

#### Scenario: a client measured on desktop a minute ago
- **WHEN** client A's desktop row was claimed a minute ago and client B, never served, queues a
  row
- **THEN** the next claim takes client B's row

#### Scenario: both devices due for one client
- **WHEN** a client whose turn it is has two pages due on both devices
- **THEN** the claims take both mobile rows before either desktop row

#### Scenario: a stale attempt on one device
- **WHEN** attempt 2 of a page's desktop row completes late, and the page's mobile row is also
  on attempt 2
- **THEN** neither row is written

### Requirement: SPEED-005 — each metric takes the closest real measurement available, and says where it came from

For LCP and CLS the measurement MUST take, per metric, Google's real-visitor figure for the page's
URL, else for the site's origin, else the Lighthouse lab figure; for INP the URL figure, else the
origin figure, else none. Each value MUST carry its source — `url`, `origin` or `lab` — and INP's
source MUST never be `lab`. The URL measured MUST be the page's final URL after redirects, with
the strategy of the row being measured.

Modified by `desktop-core-web-vitals`: "with strategy mobile" becomes the row's own strategy. A
desktop row asks PageSpeed for `strategy=desktop`. Which categories each strategy asks for is
`lighthouse-checks`' SPEED-016.

#### Scenario: a low-traffic post on a busy site
- **WHEN** Google has no URL data for the post and has origin data for the site
- **THEN** LCP, INP and CLS are stored with source `origin`

#### Scenario: a site with no field data at all
- **WHEN** Google has neither URL nor origin data
- **THEN** LCP and CLS are stored with source `lab` and INP is stored as absent

#### Scenario: a desktop row
- **WHEN** a slot claims a page's desktop row
- **THEN** its request asks PageSpeed for `strategy=desktop` for the page's final URL

### Requirement: SPEED-007 — a metric outside the good band is exactly one finding, and only the speed worker writes it

On each successful measurement the worker MUST replace the page's speed findings of that
measurement's strategy — and only those — with one finding per metric whose value is outside the
good band of `CWV_THRESHOLDS`: on mobile `CWV_<METRIC>_NEEDS_IMPROVEMENT` (notice) or
`CWV_<METRIC>_POOR` (warning), on desktop the same codes suffixed `_DESKTOP` with the same
severities, with details `{ value, max, source }`. A metric in the good band MUST have no
finding, a metric MUST never have two on one strategy, the source MUST NOT change the level, and
the band MUST be computed by the same function the screens use. The worker MUST NOT write a
page's check counters or lists. Which codes belong to which strategy MUST be declared in the
catalogue, and every speed code MUST declare exactly one.

Modified by `desktop-core-web-vitals`: there are now two sets of speed codes. A replace that
deleted every speed code would erase the other device's findings on every measurement.

#### Scenario: a slow page
- **WHEN** a page's mobile measurement is LCP 3100 ms (url), INP 180 ms (origin), CLS 0.31 (url)
- **THEN** its mobile speed findings are exactly `CWV_LCP_NEEDS_IMPROVEMENT { value: 3100, max:
  2500, source: 'url' }` and `CWV_CLS_POOR { value: 0.31, max: 0.25, source: 'url' }`

#### Scenario: on the threshold
- **WHEN** a page measures LCP exactly 2500 ms
- **THEN** it has no LCP finding

#### Scenario: the page's crawl findings
- **WHEN** the worker replaces a page's speed findings
- **THEN** every crawl-owned finding of the page is still stored, and its score is unchanged

#### Scenario: the other device's findings
- **WHEN** a desktop measurement of a page that holds `CWV_LCP_POOR` is written with LCP 1900 ms
- **THEN** `CWV_LCP_POOR` is still stored and no `CWV_LCP_*_DESKTOP` finding is
