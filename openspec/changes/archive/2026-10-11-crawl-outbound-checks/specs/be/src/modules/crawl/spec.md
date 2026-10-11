## ADDED Requirements

### Requirement: CRAWL-011 — a crawl's outbound checks run in their own stage, before the transaction, within fixed bounds

After post selection and before analysis, a run MUST check the content links of its pages and
read the documents its checks need — out-of-run canonical targets first, then hreflang
alternates — in a stage that opens no transaction. It MUST request at most 300 unique link URLs
and read at most 30 documents. It MUST have at most 8 requests in flight and at most 2 to one
host. Each request MUST time out at 5 seconds, MUST NOT be retried, and MUST follow at most 5
redirects. The stage MUST stop at 60 seconds. A URL that is one of the run's own pages MUST be
answered from that page's fetch, without a request. When more links exist than the budget, the
links checked MUST be the first in pages' sitemap order, then each page's document order. No
outcome of the stage MAY fail the run or change its status.

#### Scenario: a site with more links than the budget
- **WHEN** a run's pages hold 412 unique content links, 9 of them run pages
- **THEN** at most 300 of the rest are requested, the others are recorded as unchecked for the
  budget, and the run's status is what it would have been without them

#### Scenario: a slow host
- **WHEN** every request to one host hangs
- **THEN** no more than 2 are in flight to it at once, each is abandoned at 5 seconds, and the
  stage ends by its 60-second deadline with the rest recorded as unchecked

#### Scenario: a host refusing every connection
- **WHEN** an external host refuses every connection
- **THEN** its links are recorded as failed to connect and the run finishes as it would have

### Requirement: CRAWL-012 — robots.txt is honoured for every host a crawl asks

Before requesting a URL on any host, a run MUST ask that host's robots.txt for its own user
agent, and MUST NOT request a URL it disallows. It MUST fetch each external host's robots.txt at
most once per run, and MUST answer the client's own host from the robots.txt discovery already
read. A robots.txt that answers 5xx or 429, times out, or cannot be reached MUST be treated as
disallowing that host.

#### Scenario: an external host disallowing crawlers
- **WHEN** a post links to three pages of a host whose robots.txt disallows all
- **THEN** none of the three is requested, and each is recorded as unchecked for robots.txt

#### Scenario: an unreachable robots.txt
- **WHEN** an external host's robots.txt answers 503
- **THEN** no URL on that host is requested

### Requirement: CRAWL-013 — what a crawl did not check is never presented as checked

Every link, document or target a run did not request, or got no conclusive answer for, MUST
reach the checks as unchecked, with why: the budget, the deadline, robots.txt, or no conclusive
answer. A finding that rests on links MUST say how many were checked out of how many when not all
were, and a page none of whose links could be checked MUST be "not applicable", never "passed".

#### Scenario: a page partly checked
- **WHEN** 38 of a page's 40 content links were checked and one is broken
- **THEN** its finding's evidence includes "Checked 38 of 40 links" and why the two were not

#### Scenario: a page with nothing checked
- **WHEN** none of a page's links could be checked
- **THEN** BROKEN_LINKS is not applicable for that page
