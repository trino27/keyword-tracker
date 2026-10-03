## ADDED Requirements

### Requirement: CLIENT-001 — a website is identified by its site key

A client's website MUST be identified by its site key: the lower-cased host in punycode without a
leading `www.`, ignoring scheme, port, path, query and trailing slash. Subdomains other than `www`
MUST be different sites. `website_url` MUST store the origin, with `https://` added when no scheme
was given.

#### Scenario: the same site written differently
- **WHEN** a user adds `yoast.com` and later `https://WWW.Yoast.com:443/blog/?x=1`
- **THEN** both resolve to site key `yoast.com`

#### Scenario: a locale subdomain
- **WHEN** a user adds `de.semrush.com` while tracking `www.semrush.com`
- **THEN** it is a different site key and is accepted

### Requirement: CLIENT-002 — an address the server must not crawl is refused

Adding a client MUST be refused with 400 `INVALID_WEBSITE_URL` for a non-http(s) scheme,
credentials in the URL, an IP literal, `localhost`, or a host without a dot.

#### Scenario: an internal address
- **WHEN** a user adds `http://10.0.0.1` or `http://intranet`
- **THEN** the answer is 400 INVALID_WEBSITE_URL and no client or run is created

### Requirement: CLIENT-003 — a user tracks a website at most once

There MUST be at most one client per user and site key, enforced by a unique index; a duplicate,
including one from a concurrent request, MUST answer 409 `CLIENT_ALREADY_EXISTS`.

#### Scenario: two simultaneous adds
- **WHEN** two requests add the same site for one user at the same time
- **THEN** one answers 201 and the other 409

### Requirement: CLIENT-004 — adding a client queues its first crawl and returns at once

Adding a client MUST insert the client and a queued crawl run in one transaction and answer 201
without waiting for the crawl.

#### Scenario: adding with the worker stopped
- **WHEN** a client is added while no worker runs
- **THEN** the answer is 201 with `latestRun.status = 'queued'`

### Requirement: CLIENT-005 — a re-crawl can start only when no run is active

A client MUST have at most one queued or running run, enforced by a partial unique index; a
re-crawl requested while one is active MUST answer 409 `CRAWL_ALREADY_ACTIVE`.

#### Scenario: re-crawl during a crawl
- **WHEN** a re-crawl is requested while the client's run is running
- **THEN** the answer is 409 and no second run exists

### Requirement: CLIENT-006 — the clients list explains each client's crawl

`GET /api/clients` and `GET /api/clients/:id` MUST return each client with its latest run (status,
pages found and done, error code and message, times) and its current page count.

#### Scenario: polling a running crawl
- **WHEN** the client's run has crawled 6 posts
- **THEN** `latestRun` reports `status: 'running'` and `pagesDone: 6`

### Requirement: CLIENT-007 — a run's log lists every candidate in sitemap order

`GET /api/crawl-runs/:id` MUST return the run's selected sitemap, its selection reason, and every
candidate it considered, ordered by sitemap position, each with its status and reason.

#### Scenario: a listing page first in the sitemap
- **WHEN** the run log of a Yoast crawl is read
- **THEN** position 0 is `https://yoast.com/seo-blog/` with status `skipped_listing` and a reason naming the JSON-LD type
