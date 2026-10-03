## ADDED Requirements

### Requirement: PAGELIST-006 — the row leads with the score and the list opens on the worst page

Each row MUST show the page's score as a number with a band colour — poor 0–49, average 50–89,
good 90–100 — and the fraction it came from; the list MUST present rows in the order the API
returned them, worst first, and MUST NOT re-sort them on the client. The score MUST never render
as an absent or pending state.

#### Scenario: a poor page

- **WHEN** a page scores 42 out of 17 applicable checks
- **THEN** its cell reads 42 in the poor band with the note "15/17 checks"

#### Scenario: the first row

- **WHEN** the API returns pages scoring 42, 71 and 95
- **THEN** the first row is the page scoring 42
