# fe/src/Modules/Clients Specification

## Purpose

The clients screen: adding a client, watching its crawl, and reading the run log that says
which sitemap entries were taken and why the rest were not.

## Requirements

### Requirement [CLIENTSUI-001]: the add form maps refusals to the Website URL field

The add form (Name, Website URL with the helper "We'll find its blog sitemap and crawl the first 15
posts") MUST validate on submit, show a backend 400 under Website URL, and show a 409 under Website
URL with a link to the existing client's pages; a 5xx or network failure MUST be a form message that
keeps the input; a second submit while one is in flight MUST be ignored.

#### Scenario: adding a site already tracked
- **WHEN** the user adds `https://www.yoast.com/blog` while tracking `yoast.com`
- **THEN** the Website URL field says the site is already tracked and links to `/pages?clientId=<yoast>`

### Requirement [CLIENTSUI-002]: after adding, the user watches the crawl on the filtered list

A successful add MUST navigate to `/pages?clientId=<new client>`, where the crawl banner follows
the run.

#### Scenario: adding a client
- **WHEN** the add succeeds
- **THEN** the pages list filtered to the new client opens with "Crawling …"

### Requirement [CLIENTSUI-003]: the clients table shows each client's crawl and refreshes while one runs

The table MUST show each client's name and site, current page count, latest run status badge and
time, and "done / 15" while running, with View pages and Re-crawl actions; it MUST refresh every 2
seconds while any run is queued or running and stop otherwise and on unmount.

#### Scenario: no active run
- **WHEN** every client's latest run is terminal
- **THEN** no request is made until the user acts

### Requirement [CLIENTSUI-004]: re-crawl is refused while a run is active

Re-crawl MUST be disabled while the client's run is queued or running; a 409 from a race MUST be
shown on that row without hiding the table.

#### Scenario: two tabs
- **WHEN** a re-crawl is refused with CRAWL_ALREADY_ACTIVE
- **THEN** the row shows "A crawl is already running" and the table stays

### Requirement [CLIENTSUI-005]: the run log shows every candidate in sitemap order

Expanding a client MUST show its latest run's selected sitemap and selection reason, then every
candidate in sitemap order with a status badge (crawled, listing skipped, robots disallowed, not
HTML, other site, failed) and its reason.

#### Scenario: Yoast's listing page
- **WHEN** the Yoast manager expands Yoast
- **THEN** the first candidate is `https://yoast.com/seo-blog/` marked listing skipped with its reason
