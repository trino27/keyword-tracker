## ADDED Requirements

### Requirement: SEED-006 — the seed queues every current page that was never queued, once

The seed MUST queue for a PageSpeed measurement every page on its client's current run that has no
`page_speed` row, for every client in the database, and MUST NOT wait for any measurement.
Re-running it MUST queue nothing already queued, measured or failed.

#### Scenario: a database crawled before PageSpeed existed
- **WHEN** the seed runs over 30 current pages with no `page_speed` rows
- **THEN** 30 rows are `queued` and the seed reports "30 pages queued"

#### Scenario: a second run
- **WHEN** the seed runs again at once
- **THEN** it reports "0 pages queued" and no row changed
