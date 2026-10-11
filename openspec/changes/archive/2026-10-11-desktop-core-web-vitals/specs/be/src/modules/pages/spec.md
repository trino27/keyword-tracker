## MODIFIED Requirements

### Requirement: PAGES-014 — the list and the detail carry each page's speed summary and PageSpeed's state

Each pages-list item MUST carry the page's mobile speed summary, and each page detail MUST carry a
summary per strategy, mobile and desktop. A summary holds the queue status, the last measurement
with each metric's value, band and source and the time measured, and the reason of the last
failure, or null when the page was never queued on that strategy. Each metric's band MUST be
derived when read, from the stored value and `CWV_THRESHOLDS`, by the same function the PageSpeed
worker uses to choose findings; the band MUST NOT be stored. The failure reason MUST be sent only
for a failed row. The list response and the detail MUST carry PageSpeed's state in the API
process — `notConfigured` without a key, `keyRejected` after Google refused the key and the worker
halted, `active` otherwise — answered by the one function every read path uses. The list MUST
still be read in a constant number of statements, MUST list a page once however many strategies
it has rows for, and a page's score and place in the list's order MUST be read from its mobile
row alone.

Modified by `desktop-core-web-vitals`: a page now has a row per strategy (SPEED-020). The list
keeps the mobile badge (plan D21), and a join that does not name the strategy would list every
page twice and compute its Lighthouse share once per row (plan D43). The detail carries both,
keyed by strategy, so a third strategy would be a compile error on every reader rather than a
field nobody reads.

#### Scenario: a page with a poor CLS from the lab
- **WHEN** a page's stored mobile measurement holds CLS 0.31 from `lab`
- **THEN** its list summary's CLS reads value 0.31, band `poor`, source `lab`, and its detail
  lists `CWV_CLS_POOR`

#### Scenario: a page Google could not load, measured yesterday
- **WHEN** a mobile row is `failed` with `PAGE_LOAD_FAILED` and holds yesterday's measurement
- **THEN** the summary carries yesterday's values, status `failed` and `lastError`
  `PAGE_LOAD_FAILED`

#### Scenario: a page in backoff
- **WHEN** a row is `queued` after a timeout with `last_error` set
- **THEN** the summary's `lastError` is null

#### Scenario: no key
- **WHEN** the API runs with no PageSpeed key
- **THEN** the list and the detail carry `state: 'notConfigured'`

#### Scenario: Google rejected the key
- **WHEN** the worker has halted on a rejected key
- **THEN** the list and the detail carry `state: 'keyRejected'`, and stored measurements are
  still returned

#### Scenario: a page measured on both devices
- **WHEN** a page has a mobile and a desktop row
- **THEN** the list returns it once with its mobile summary, and its detail carries both summaries
  under `mobile` and `desktop`

#### Scenario: a page never measured on desktop
- **WHEN** a page has a mobile row and no desktop row
- **THEN** its detail's desktop summary is null

#### Scenario: a desktop measurement lands
- **WHEN** a page scoring 88 is measured on desktop
- **THEN** it still scores 88 and keeps its place in the list
