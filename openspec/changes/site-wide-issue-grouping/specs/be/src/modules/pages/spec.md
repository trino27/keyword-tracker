## ADDED Requirements

### Requirement: PAGES-011 — a finding is reported with how many of the client's current pages carry it

The API MUST report, for each issue code, how many of that client's current pages carry it,
computed at read time over the client's current pages and NOT over the filtered or paginated
slice; storage MUST NOT change. The list MUST additionally report, per page, how many of its
findings are shared with at least one other current page of the same client. Both MUST be
produced without a query per row.

#### Scenario: a template problem across a client's pages

- **WHEN** H1_MULTIPLE is present on five of a client's fifteen current pages
- **THEN** each of those pages reports the code as affecting five pages

#### Scenario: a search that matches one page

- **WHEN** the list is filtered by a search that matches only one of those five pages
- **THEN** that page still reports the code as affecting five pages, not one

#### Scenario: a problem of one page only

- **WHEN** a code is present on exactly one of the client's current pages
- **THEN** it reports one page affected, and that page's shared count does not include it

#### Scenario: another client's pages

- **WHEN** two clients of the same user both have pages carrying the code
- **THEN** each client's pages count only their own client's pages
