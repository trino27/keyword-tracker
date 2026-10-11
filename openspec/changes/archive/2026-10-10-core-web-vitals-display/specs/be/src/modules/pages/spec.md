## ADDED Requirements

### Requirement: PAGES-014 — the list and the detail carry each page's speed summary and PageSpeed's state

Each pages-list item and each page detail MUST carry the page's speed summary — its queue status,
its last measurement with each metric's value, band and source and the time measured, and the
reason of its last failure — or null when the page was never queued. Each metric's band MUST be
derived when read, from the stored value and `CWV_THRESHOLDS`, by the same function the PageSpeed
worker uses to choose findings; the band MUST NOT be stored. The failure reason MUST be sent only
for a failed row. The list response and the detail MUST carry PageSpeed's state in the API
process — `notConfigured` without a key, `keyRejected` after Google refused the key and the worker
halted, `active` otherwise — answered by the one function every read path uses. The list MUST
still be read in a constant number of statements.

#### Scenario: a page with a poor CLS from the lab
- **WHEN** a page's stored measurement holds CLS 0.31 from `lab`
- **THEN** its summary's CLS reads value 0.31, band `poor`, source `lab`, and its detail lists
  `CWV_CLS_POOR`

#### Scenario: a page Google could not load, measured yesterday
- **WHEN** a row is `failed` with `PAGE_LOAD_FAILED` and holds yesterday's measurement
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
