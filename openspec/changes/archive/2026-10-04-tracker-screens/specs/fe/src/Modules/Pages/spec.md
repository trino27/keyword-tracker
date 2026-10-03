## ADDED Requirements

### Requirement: PAGELIST-001 — the list's state is the URL

Client filter, search text, page and page size MUST live in the URL search parameters, validated
with defaults; malformed values MUST fall back to defaults; changing a filter or the search MUST
return to page 1; the search MUST be applied about 300 ms after typing stops.

#### Scenario: reload on page 3 of a filtered list
- **WHEN** the user reloads `/pages?clientId=2&q=audit&page=3`
- **THEN** the same filtered page 3 is shown

#### Scenario: a hand-edited page size
- **WHEN** the URL says `pageSize=999`
- **THEN** the list uses 20

### Requirement: PAGELIST-002 — each row shows keywords, best position, issues and last capture

Each row MUST show the page title with its muted URL and client badge; keyword chips with their
latest positions (the first 3–4 and "+N"); the best position with its keyword, coloured by bucket
1–3 / 4–10 / 11–20 / 21+; the issue count, red when any issue is an error; and the last capture date
in the user's zone. The whole row MUST open the page detail. Under the table: pagination with a
20/50 page-size select and "Showing X–Y of N".

#### Scenario: a page without positions
- **WHEN** a page has no snapshots yet
- **THEN** its best position shows "—" with the hint "appears after the next seed run"

### Requirement: PAGELIST-003 — empty states say what to do next

The list MUST distinguish a user with no clients (call to action: Add client) from filters that
match nothing (action: Clear filters).

#### Scenario: a new user
- **WHEN** a user with no clients opens Pages
- **THEN** the empty state offers Add client, not Clear filters

### Requirement: PAGELIST-004 — a crawl banner follows the filtered client's run

With a client filter whose latest run is not succeeded, a banner MUST show the run's progress
("Crawling yoast.com — 6 of 15 pages"), polling every 2 seconds while queued or running and
stopping at a terminal status or when the screen unmounts; when the run ends succeeded or partial
the list MUST reload by itself; partial and failed MUST say why in plain words.

#### Scenario: a crawl finishes while watched
- **WHEN** the banner observes the run turn `succeeded`
- **THEN** polling stops and the list reloads without a spinner

### Requirement: PAGELIST-005 — the header summarises the user's portfolio

The header MUST read "Pages" with the subtitle "N pages across M clients" and the primary action
Add client; the client select MUST show each client's latest crawl status as a badge.

#### Scenario: two seeded clients
- **WHEN** the Semrush manager opens Pages after the seed
- **THEN** the subtitle reads "15 pages across 1 client"
