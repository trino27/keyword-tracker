## MODIFIED Requirements

### Requirement: REMOTE-002 — every outbound request is bounded

Every outbound request MUST time out after 10 seconds unless its caller declares a longer bound,
which MUST NOT exceed 90 seconds; it MUST follow at most 5 redirects, and stop reading past its
size cap (HTML 5 MB; a sitemap 10 MB as downloaded, inflated to at most 50 MB; a PageSpeed answer
at its client's declared cap).

Modified by `page-speed-measurement`: PageSpeed Insights runs Lighthouse on Google's side before
it answers, which routinely takes tens of seconds; at 10 seconds every measurement would time out.
The bound becomes the caller's to declare, capped, and the crawl's requests keep the 10 seconds.

#### Scenario: an oversized page
- **WHEN** a response body exceeds its cap
- **THEN** the read is aborted and the request fails with a too-large error

#### Scenario: a PageSpeed measurement
- **WHEN** the PageSpeed client sends a request declaring a 90-second bound
- **THEN** the request is not aborted before 90 seconds, and a crawl request sent at the same
  time is still aborted at 10

### Requirement: REMOTE-003 — only safe failures are retried

A request MUST be retried at most twice, or fewer when its caller declares fewer, with exponential
backoff and jitter, and only after a network error, a timeout, 408, 429 or a 5xx; it MUST honour
`Retry-After` up to 10 seconds and MUST NOT retry any other 4xx.

Modified by `page-speed-measurement`: a PageSpeed request is retried by its own queue — minutes
apart, with the quota-wide pause a 429 needs — so an in-call retry would be a second, faster retry
loop hammering a rate-limited API. It declares none. The listing of 408 records what the code
already retried (`RETRYABLE_STATUSES`).

#### Scenario: a 404
- **WHEN** a page answers 404
- **THEN** it is requested exactly once

#### Scenario: a 503 to a caller declaring no retries
- **WHEN** a request declaring zero retries answers 503
- **THEN** it is requested exactly once and the 503 is returned to the caller
