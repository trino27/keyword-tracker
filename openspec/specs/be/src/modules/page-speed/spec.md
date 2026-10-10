# be/src/modules/page-speed Specification

## Purpose

Google PageSpeed Insights measurements of every crawled page: when a page is queued and
measured, which value each Core Web Vital takes and where it came from, what a failure of
Google's does to the queue and to the stored measurement, and the findings a measurement writes.

## Requirements

### Requirement [SPEED-001]: a finished crawl queues its pages in the same transaction that makes them current

The crawl's finalize MUST queue each page it stored for a PageSpeed measurement inside the same
transaction that writes the page and the run's outcome, and MUST announce the queue on
`page_speed_queued` in that transaction. A finalize that rolls back — including one refused by
the attempt fence — MUST queue nothing. The crawl MUST NOT call Google.

#### Scenario: a crawl of fifteen posts
- **WHEN** a run finishes `succeeded` with 15 pages, none measured before
- **THEN** 15 `page_speed` rows exist with status `queued`, committed with the run

#### Scenario: a superseded attempt reaches finalize
- **WHEN** attempt 1 reaches finalize after attempt 2 claimed the run
- **THEN** attempt 1's transaction writes no `page_speed` row

### Requirement [SPEED-002]: a page is re-measured at most once a day

A crawl MUST (re)queue a page only when it has no row, its last attempt failed, or its last
measurement is at least `PAGE_SPEED_FRESH_FOR_MS` (24 hours) old; a row already queued or running
MUST be left as it is. Re-queuing MUST NOT clear the stored measurement.

#### Scenario: measured exactly 24 hours ago
- **WHEN** a page measured 24 h before the crawl's finalize is crawled again
- **THEN** its row is `queued` with attempts 0, and its old measurement is still stored

#### Scenario: measured one second less than 24 hours ago
- **WHEN** a page measured 23 h 59 min 59 s before the finalize is crawled again
- **THEN** its row is unchanged

#### Scenario: the last attempt failed
- **WHEN** a page whose row is `failed` is crawled again
- **THEN** its row is `queued` with attempts 0

### Requirement [SPEED-003]: one slot measures a page at a time, and only the attempt holding it writes

A slot MUST claim a row with a single `UPDATE … WHERE page_id = (SELECT … FOR UPDATE SKIP LOCKED
LIMIT 1)` that sets it running, increments `attempts` and takes a lease; every write of an
attempt's outcome MUST carry `status = 'running' and attempts = <its attempt>` and write nothing
when that no longer holds. A running row whose lease expired MUST be claimable again while
`attempts < 5`; past the fifth it MUST become `failed` with `ABANDONED`.

#### Scenario: two slots claim at once
- **WHEN** two claims run concurrently against two queued rows
- **THEN** each claims a different row

#### Scenario: the process dies mid-call
- **WHEN** a running row's lease expires at attempt 2
- **THEN** the next claim takes it as attempt 3, and attempt 2's late completion writes nothing

#### Scenario: the fifth lease expires
- **WHEN** a row's lease expires at attempt 5
- **THEN** it becomes `failed` with `ABANDONED` and is never claimed again

### Requirement [SPEED-004]: only pages their client's current run still has are measured

A slot MUST NOT claim a row whose page is not on its client's latest succeeded or partial run.
Such a row MUST stay as it is, so a later crawl that finds the page again can re-queue it.

#### Scenario: a post leaves the sitemap
- **WHEN** a re-crawl no longer finds a queued page
- **THEN** no slot claims its row and no PageSpeed request is made for its URL

### Requirement [SPEED-005]: each metric takes the closest real measurement available, and says where it came from

For LCP and CLS the measurement MUST take, per metric, Google's real-visitor figure for the page's
URL, else for the site's origin, else the Lighthouse lab figure; for INP the URL figure, else the
origin figure, else none. Each value MUST carry its source — `url`, `origin` or `lab` — and INP's
source MUST never be `lab`. The URL measured MUST be the page's final URL after redirects, with
strategy mobile.

#### Scenario: a low-traffic post on a busy site
- **WHEN** Google has no URL data for the post and has origin data for the site
- **THEN** LCP, INP and CLS are stored with source `origin`

#### Scenario: a site with no field data at all
- **WHEN** Google has neither URL nor origin data
- **THEN** LCP and CLS are stored with source `lab` and INP is stored as absent

### Requirement [SPEED-006]: a measurement is stored whole, and a failure never touches it

A measurement MUST be written as one act — LCP, CLS, the lab performance score and the time
measured, with INP and its source when present — together with the page's speed findings, in one
transaction; the database MUST refuse a partial one. A failed, released or abandoned attempt MUST
write only the row's job state and MUST leave the stored measurement exactly as it was.

#### Scenario: a measurement missing its CLS
- **WHEN** a write sets `measured_at` and `lcp_ms` but no `cls`
- **THEN** the database rejects it on `page_speed_measurement_whole`

#### Scenario: Google is down for a measured page
- **WHEN** an attempt for a page measured yesterday times out
- **THEN** the row's measurement columns are byte-for-byte what they were, and the row says why
  the attempt failed

### Requirement [SPEED-007]: a metric outside the good band is exactly one finding, and only the speed worker writes it

On each successful measurement the worker MUST replace the page's speed findings — and only
those — with one finding per metric whose value is outside the good band of `CWV_THRESHOLDS`:
`CWV_<METRIC>_NEEDS_IMPROVEMENT` (notice) or `CWV_<METRIC>_POOR` (warning), with details
`{ value, max, source }`. A metric in the good band MUST have no finding, a metric MUST never have
two, the source MUST NOT change the level, and the band MUST be computed by the same function the
screens use. The worker MUST NOT write a page's check counters or lists.

#### Scenario: a slow page
- **WHEN** a page measures LCP 3100 ms (url), INP 180 ms (origin), CLS 0.31 (url)
- **THEN** its speed findings are exactly `CWV_LCP_NEEDS_IMPROVEMENT { value: 3100, max: 2500,
  source: 'url' }` and `CWV_CLS_POOR { value: 0.31, max: 0.25, source: 'url' }`

#### Scenario: on the threshold
- **WHEN** a page measures LCP exactly 2500 ms
- **THEN** it has no LCP finding

#### Scenario: the page's crawl findings
- **WHEN** the worker replaces a page's speed findings
- **THEN** every crawl-owned finding of the page is still stored, and its score is unchanged

### Requirement [SPEED-008]: a passing failure is retried with backoff; a lasting one fails with a plain reason

A timeout, a network error or a 5xx MUST return the row to the queue no sooner than 1, 4, 16 and
64 minutes after its 1st–4th failure, and MUST fail it `PSI_UNAVAILABLE` at the 5th. Google being
unable to load the page MUST fail the row at once with `PAGE_LOAD_FAILED` or `PAGE_ERRORED`; any
other refusal of the address with `PSI_REJECTED`; an answer with no usable LCP or CLS with
`NO_MEASUREMENT`. Every stored reason MUST be a key of `PAGE_SPEED_ERRORS`, and every key except
`ABANDONED` MUST be producible from a recorded or documented answer. A request MUST NOT be retried
inside the call.

#### Scenario: Google times out twice, then answers
- **WHEN** attempts 1 and 2 time out and attempt 3 succeeds
- **THEN** attempt 2 is not made before 1 minute after attempt 1, attempt 3 not before 4 minutes
  after attempt 2, and the row ends `done`

#### Scenario: Google cannot load the page
- **WHEN** PageSpeed answers that the document request failed
- **THEN** the row is `failed` with `PAGE_LOAD_FAILED` after one attempt

### Requirement [SPEED-009]: Google's rate limit pauses every slot and costs the page nothing

A 429 from PageSpeed MUST pause every slot of the process for the answer's `Retry-After`, or
60 seconds without one, during which no slot claims a row; the row in flight MUST return to the
queue with its attempt given back, not counted as a failure.

#### Scenario: a 429 with Retry-After 120
- **WHEN** slot 1's request answers 429 with `Retry-After: 120`
- **THEN** neither slot claims a row for 120 seconds, and slot 1's row is `queued` with the
  attempts it had before the claim

### Requirement [SPEED-010]: a rejected key stops measuring until restart, and loses nothing

An answer saying the key is invalid, expired, restricted or for an API not enabled MUST stop every
slot of the process from claiming until the process restarts; the row in flight MUST return to the
queue with its attempt given back; one error line MUST name the cause and MUST NOT contain the key;
and until the restart the API process MUST report PageSpeed's state as `keyRejected`.

#### Scenario: a mistyped key
- **WHEN** the first request answers that the API key is not valid
- **THEN** no further request is made, every row is still `queued`, the log says the key was
  rejected, and the process's PageSpeed state is `keyRejected`

#### Scenario: the key is fixed
- **WHEN** the key in `.env` is corrected and the API restarted
- **THEN** the state is `active` and the queued rows are measured

### Requirement [SPEED-011]: without a key nothing is measured, nothing is lost, and the API says so

With `PAGESPEED_API_KEY` empty or absent, the worker MUST NOT start and MUST NOT make a request,
crawls MUST still queue their pages, and the API process MUST report PageSpeed's state as
`notConfigured`; with a key and no rejection it MUST report `active`.
The worker MUST also not start in a process whose `CRAWL_WORKER_ENABLED` is not `true`. Adding a
key and restarting MUST drain the rows already queued.

#### Scenario: a clean clone
- **WHEN** the stack is started from `.env.example` and the seed runs
- **THEN** every current page has a `queued` row, no request reaches PageSpeed, and the log says
  PageSpeed is not configured

### Requirement [SPEED-012]: the key never leaves the request header

The key MUST be sent only in the `x-goog-api-key` request header. It MUST NOT appear in a request
URL, a log line, a stored error or a recorded fixture.

#### Scenario: a request that times out
- **WHEN** a PageSpeed request with the key `test-key-123` times out
- **THEN** no log line and no column of the row contains `test-key-123`, and the URL the transport
  saw has no `key` parameter

### Requirement [SPEED-013]: reading a screen never calls PageSpeed

The pages list, the page detail and the issue report MUST read stored measurements and findings
only; no request a user makes MAY cause a PageSpeed request.

#### Scenario: opening the list and a page
- **WHEN** a signed-in user opens the pages list and a page's detail
- **THEN** the outbound transport has recorded no PageSpeed URL
