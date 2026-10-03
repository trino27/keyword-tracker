## ADDED Requirements

### Requirement: PAGES-009 — a page's health score is the share of the checks that could apply to it

The pages list and the page detail MUST each carry a score derived at read time from the page's
stored check counts as the rounded percentage of applicable checks that passed, together with the
applicable and failed counts it came from, so two pages with different denominators are never
presented as comparable without the denominator being visible. One implementation of the formula
MUST serve both the backend and the frontend.

#### Scenario: sixteen applicable, two failed

- **WHEN** a page stored 16 applicable checks of which 2 failed
- **THEN** its score is 88, reported with `applicable: 16` and `failed: 2`

#### Scenario: a page that passed everything that applied

- **WHEN** a page stored 18 applicable checks and 0 failures
- **THEN** its score is 100

### Requirement: PAGES-010 — the pages list is ordered worst first under a total order

The list MUST be ordered by score ascending, then by the number of failed checks descending, and
MUST end its ordering on the page id so that the order is total; every page matching the filter
MUST appear exactly once across the paginated walk. The score expression used for ordering MUST
be evaluated in a type that preserves fractions.

#### Scenario: two pages with different scores

- **WHEN** one page scores 50 and another 90
- **THEN** the page scoring 50 comes first

#### Scenario: walking every page of a list whose scores tie

- **WHEN** four pages share a score and the list is walked at a page size of 3
- **THEN** each page id is returned exactly once and all of them are returned

#### Scenario: integer division

- **WHEN** the ordering expression divides two smallint columns without a cast
- **THEN** the two-page ordering scenario above fails
