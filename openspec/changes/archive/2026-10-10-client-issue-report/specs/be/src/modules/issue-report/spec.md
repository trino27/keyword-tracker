## ADDED Requirements

### Requirement: REPORT-001 — a client's report is one snapshot, answered only to its owner

`GET /api/clients/:id/issues` MUST return, in one response, the client's id and name, the run the
snapshot was read from with its finish time (or null when no crawl of the client has finished),
PageSpeed's state in the API process (`notConfigured`, `active` or `keyRejected`, answered by the
same function as the pages list), the client's current page count, and every finding of the
snapshot with its code, severity, details and location. Ownership MUST be decided in the SQL of
each statement; a client of another user and a missing client MUST answer the same 404
`CLIENT_NOT_FOUND` with the same body. The response MUST carry no copy and MUST NOT be filtered or
paginated by the server.

#### Scenario: user B asks for user A's client
- **WHEN** user B requests `/api/clients/<A's client>/issues`
- **THEN** the answer is 404 with the body user B gets for `/api/clients/2000000000/issues`

#### Scenario: a client whose only crawl is still running
- **WHEN** the report of a client with no succeeded or partial run is requested
- **THEN** `generatedFrom` is null and the findings are empty

### Requirement: REPORT-002 — the report reads the run the pages list reads

The report MUST read the client's current run — its latest succeeded or partial run — and from it
only: the findings of pages that run saw, and the site checks of that run whose status is
`failed`, each located at the whole site. Site checks of any other run, including a newer failed
one, and passed or skipped site checks MUST NOT appear.

#### Scenario: a newer crawl failed
- **WHEN** a client's latest run failed after a succeeded one
- **THEN** the report's site findings are the failed checks of the succeeded run, and none of the
  failed run's

#### Scenario: a page a re-crawl no longer found
- **WHEN** a page is not on the current run
- **THEN** none of its findings appear

### Requirement: REPORT-003 — a speed figure Google only has for the whole site appears once

Speed findings whose source is the site's origin MUST be returned as one finding per code located
at all pages, with the number of current pages that carry it and the details of the most recently
measured of them; speed findings from the page's own data or from the lab MUST stay located at
their page. Only a speed finding MAY be located at all pages.

#### Scenario: the same origin INP on fifteen pages
- **WHEN** fifteen current pages carry `CWV_INP_NEEDS_IMPROVEMENT` with source `origin`
- **THEN** the report holds one such finding located at all pages with a page count of 15, and no
  page-located one

#### Scenario: mixed sources
- **WHEN** two pages carry `CWV_LCP_POOR` from their own data and thirteen from the origin
- **THEN** the report holds two page-located `CWV_LCP_POOR` findings and one located at all pages
  with a page count of 13

### Requirement: REPORT-004 — the report never calls PageSpeed and never writes

Reading a report MUST make no outbound request and MUST write nothing.

#### Scenario: opening the report
- **WHEN** the report of a measured client is requested
- **THEN** the outbound transport has recorded no request and no row changed
