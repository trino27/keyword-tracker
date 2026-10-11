## MODIFIED Requirements

### Requirement: SEED-006 — the seed queues every current page that was never queued, once

The seed MUST queue for a PageSpeed measurement every page on its client's current run that has no
`page_speed` row for a strategy, on that strategy, for every client in the database, and MUST NOT
wait for any measurement. Re-running it MUST queue nothing already queued, measured or failed.
It MUST report how many measurements it queued.

Modified by `desktop-core-web-vitals`: a page has a row per strategy (SPEED-020), so "never
queued" is judged per strategy, and the report counts measurements rather than pages. A database
seeded before desktop gains its desktop rows on its next seed run. That is this requirement
applied per strategy, not a migration backfill (plan D13, D20).

#### Scenario: a database crawled before PageSpeed existed
- **WHEN** the seed runs over 30 current pages with no `page_speed` rows
- **THEN** 60 rows are `queued`, 30 per strategy, and the seed reports "60 measurements queued"

#### Scenario: a database measured on mobile only
- **WHEN** the seed runs over 30 current pages that each have a mobile row
- **THEN** 30 desktop rows are `queued`, no mobile row changed, and the seed reports "30
  measurements queued"

#### Scenario: a second run
- **WHEN** the seed runs again at once
- **THEN** it reports "0 measurements queued" and no row changed
