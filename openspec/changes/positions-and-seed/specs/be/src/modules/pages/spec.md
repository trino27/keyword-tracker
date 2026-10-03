## ADDED Requirements

### Requirement: PAGES-001 — a rank snapshot is a page-keyword pair's position at an instant

A rank snapshot MUST be keyed by page, keyword and the instant it was captured, stored as
`timestamptz` in UTC; it MUST belong to an existing page-keyword pair (composite foreign key, cascading
with the pair), and its position MUST be between 1 and 100.

#### Scenario: a snapshot for a pair the page does not have
- **WHEN** a snapshot is inserted for a keyword not paired with the page
- **THEN** the insert fails on `rank_snapshots_page_keyword_fk`

#### Scenario: an out-of-range position
- **WHEN** a snapshot with position 0 or 101 is inserted
- **THEN** the insert fails on `rank_snapshots_position_range`
