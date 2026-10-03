# be/src/infrastructure/remote-api Specification

## Purpose
The HTTP this server makes on a user's behalf: where it may go, how long it may take,
what it retries, and how it names itself to the site it is reading.

## Requirements

### Requirement [REMOTE-001]: no outbound request reaches a non-public address

Every outbound connection MUST go to an address that was resolved and checked in the same step,
and MUST be refused when any resolved address is loopback, private, link-local, carrier-grade NAT,
multicast, reserved or unspecified (IPv4 and IPv6, including IPv4-mapped forms). The check MUST
apply on every redirect hop, and URLs with credentials or IP literals MUST be refused before
resolution.

#### Scenario: a redirect to the metadata address
- **WHEN** a crawled URL redirects to `http://169.254.169.254/`
- **THEN** the request fails with a forbidden-address error and nothing is fetched from that address

#### Scenario: a public name resolving to a private address
- **WHEN** a host resolves to `10.0.0.5`
- **THEN** no connection is opened

### Requirement [REMOTE-002]: every outbound request is bounded

Every outbound request MUST time out after 10 seconds, follow at most 5 redirects, and stop
reading past its size cap (HTML 5 MB; a sitemap 10 MB as downloaded, inflated to at most 50 MB).

#### Scenario: an oversized page
- **WHEN** a response body exceeds its cap
- **THEN** the read is aborted and the request fails with a too-large error

### Requirement [REMOTE-003]: only safe failures are retried

A request MUST be retried at most twice, with exponential backoff and jitter, and only after a
network error, a timeout, 429 or a 5xx; it MUST honour `Retry-After` up to 10 seconds and MUST NOT
retry any other 4xx.

#### Scenario: a 404
- **WHEN** a page answers 404
- **THEN** it is requested exactly once

### Requirement [REMOTE-004]: the crawler identifies itself

Every outbound request MUST send the User-Agent `SeoKeywordTrackerBot/1.0 (+<repository URL>)`.

#### Scenario: any crawl request
- **WHEN** the crawler fetches robots.txt, a sitemap, a feed or a page
- **THEN** the request carries that User-Agent
