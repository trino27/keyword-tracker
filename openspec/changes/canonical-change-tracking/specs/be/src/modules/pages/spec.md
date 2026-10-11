## ADDED Requirements

### Requirement: PAGES-015 — a page row remembers the canonical it declared, and whether that is known

Every crawl that writes a page MUST store the canonical the page declared — the first one,
`<head>` before the Link header, fragment removed — or none, and MUST mark the row as having
recorded it. A row last written before canonicals were recorded MUST read back as "not known",
distinct from "declared none". The database MUST refuse a canonical on a row that is not marked
as recorded. A declared canonical too long to store whole MUST be stored as not known rather than
truncated.

#### Scenario: a page declaring its canonical
- **WHEN** a crawl writes a page declaring `<link rel="canonical" href="https://a.example/post/#top">`
- **THEN** the row holds `https://a.example/post/` and is marked recorded

#### Scenario: a page declaring none
- **WHEN** a crawl writes a page with no canonical in its head or Link header
- **THEN** the row holds no canonical and is marked recorded

#### Scenario: a row from before the migration
- **WHEN** a page last crawled before the columns existed is read as a previous crawl
- **THEN** its canonical reads as not known

#### Scenario: an impossible row
- **WHEN** a write sets a canonical with the recorded mark false
- **THEN** the database rejects it on `pages_canonical_only_when_recorded`
