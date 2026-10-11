# fe/src/Modules/Pages Specification

## Purpose

The pages list: every current page of the user’s clients, worst first, searchable and
filterable, with each page’s score, keywords and best position.

## Requirements

### Requirement [PAGELIST-006]: the row leads with the score and the list opens on the worst page

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

### Requirement [PAGELIST-007]: the row says how many of its findings the client's other pages share

The issues cell MUST show, beside the severity badges, how many of the page's findings also
appear on at least one other current page of the same client, and MUST show nothing extra when
that number is zero.

#### Scenario: a page carrying two template problems

- **WHEN** two of a page's seven findings are also on other pages of the same client
- **THEN** the cell reads the severity badges followed by "2 site-wide"

#### Scenario: a page whose problems are its own

- **WHEN** none of a page's findings appear on another page of the client
- **THEN** the cell shows only the severity badges

### Requirement [PAGELIST-001]: the list's state is the URL

Client filter, search text, page and page size MUST live in the URL search parameters, validated
with defaults; malformed values MUST fall back to defaults; changing a filter or the search MUST
return to page 1; the search MUST be applied about 300 ms after typing stops.

#### Scenario: reload on page 3 of a filtered list
- **WHEN** the user reloads `/pages?clientId=2&q=audit&page=3`
- **THEN** the same filtered page 3 is shown

#### Scenario: a hand-edited page size
- **WHEN** the URL says `pageSize=999`
- **THEN** the list uses 20

### Requirement [PAGELIST-002]: each row shows keywords, best position, issues and last capture

Each row MUST show the page title with its muted URL and client badge; keyword chips with their
latest positions (the first 3–4 and "+N"); the best position with its keyword, coloured by bucket
1–3 / 4–10 / 11–20 / 21+; the issue count, red when any issue is an error; and the last capture date
in the user's zone. The whole row MUST open the page detail. Under the table: pagination with a
20/50 page-size select and "Showing X–Y of N".

#### Scenario: a page without positions
- **WHEN** a page has no snapshots yet
- **THEN** its best position shows "—" with the hint "appears after the next seed run"

### Requirement [PAGELIST-003]: empty states say what to do next

The list MUST distinguish a user with no clients (call to action: Add client) from filters that
match nothing (action: Clear filters).

#### Scenario: a new user
- **WHEN** a user with no clients opens Pages
- **THEN** the empty state offers Add client, not Clear filters

### Requirement [PAGELIST-004]: a crawl banner follows the filtered client's run

With a client filter whose latest run is not succeeded, a banner MUST show the run's progress
("Crawling yoast.com — 6 of 15 pages"), polling every 2 seconds while queued or running and
stopping at a terminal status or when the screen unmounts; when the run ends succeeded or partial
the list MUST reload by itself; partial and failed MUST say why in plain words.

#### Scenario: a crawl finishes while watched
- **WHEN** the banner observes the run turn `succeeded`
- **THEN** polling stops and the list reloads without a spinner

### Requirement [PAGELIST-005]: the header summarises the user's portfolio

The header MUST read "Pages" with the subtitle "N pages across M clients" and the primary action
Add client; the client select MUST show each client's latest crawl status as a badge.

#### Scenario: two seeded clients
- **WHEN** the Semrush manager opens Pages after the seed
- **THEN** the subtitle reads "15 pages across 1 client"

### Requirement [PAGELIST-008]: each row shows its three Core Web Vitals as traffic lights beside the score

The list MUST show, in a column right of Score, three badges LCP · INP · CLS coloured by band —
good green, needs improvement yellow, poor red, no data grey — each with a tooltip giving the
value, the source in plain words (this page's real visitors, the whole site's real visitors, or a
lab test that may vary) and the date measured. A row with nothing measured MUST read "In queue"
while its page waits its turn and "Measuring…" while Google is testing it, MUST show its last
badges with a warning marker and the plain reason when the latest attempt failed after an earlier
success, MUST read "Couldn't measure: <reason>" when nothing was ever measured, and "Not measured"
when the page has no queue row. When PageSpeed's state is `notConfigured` the column header MUST
say so and the cells MUST NOT show grey badges. When it is `keyRejected` the column header MUST say
"PageSpeed key rejected" with a tooltip saying measurements are paused and pointing at the README,
stored badges MUST stay visible, and a row that would read "In queue" or "Measuring…" MUST read
"Paused".
A legend MUST say that red is Important and yellow is Improvement in Issues, and that speed is
scored separately. The Score column, its values and the row order MUST NOT change.

#### Scenario: a page with a slow LCP
- **WHEN** a row's LCP is 3100 ms from this page's real visitors, measured Oct 9
- **THEN** its LCP badge is yellow and its tooltip reads "LCP 3.1 s — needs improvement. Real
  visitors to this page, measured Oct 9."

#### Scenario: no INP data
- **WHEN** a measurement has no INP
- **THEN** the INP badge is grey and its tooltip says Google has no real-visitor INP for the page
  or the site

#### Scenario: PageSpeed not configured
- **WHEN** the list says `state: 'notConfigured'`
- **THEN** the column header reads "PageSpeed not configured" and every cell shows a dash

#### Scenario: Google rejected the key
- **WHEN** the list says `state: 'keyRejected'`, one row has a measurement and another is queued
- **THEN** the header reads "PageSpeed key rejected", the first row keeps its badges, and the
  second reads "Paused"

### Requirement [PAGELIST-009]: a row's issue count opens the report filtered to that page

The issues cell of each row MUST link to `/issues?clientId=<the row's client>&pageId=<the row's
page>`, and the link MUST NOT take over the row's other link to the page detail.

#### Scenario: clicking a row's issue count
- **WHEN** the user clicks "2 critical" on page 42 of client 7
- **THEN** the report opens at `/issues?clientId=7&pageId=42`
