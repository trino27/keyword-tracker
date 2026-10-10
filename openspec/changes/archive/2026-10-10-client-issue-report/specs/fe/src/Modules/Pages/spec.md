## ADDED Requirements

### Requirement: PAGELIST-009 — a row's issue count opens the report filtered to that page

The issues cell of each row MUST link to `/issues?clientId=<the row's client>&pageId=<the row's
page>`, and the link MUST NOT take over the row's other link to the page detail.

#### Scenario: clicking a row's issue count
- **WHEN** the user clicks "2 critical" on page 42 of client 7
- **THEN** the report opens at `/issues?clientId=7&pageId=42`
