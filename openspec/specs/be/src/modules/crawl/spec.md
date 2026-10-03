# be/src/modules/crawl Specification

## Purpose
Turning a website into the pages the tracker holds — which sitemap is the blog,
which entries are posts, under what bounds, and what a re-crawl does to what is
already stored.

## Requirements

### Requirement [CRAWL-001]: a queued run is executed by one worker at a time

A worker MUST claim a run with a single `UPDATE … WHERE id = (SELECT … FOR UPDATE SKIP LOCKED
LIMIT 1)` that sets it running, increments `attempts` and sets a lease; two workers MUST never hold
the same run.

#### Scenario: two workers claim at once
- **WHEN** two claims run concurrently against two queued runs
- **THEN** each claims a different run

### Requirement [CRAWL-002]: an abandoned run is retried at most three times

A running run whose lease expired MUST be reclaimable while `attempts < 3`; after the third
attempt expires it MUST become `failed` with `CRAWL_ABANDONED` and a `finished_at`.

#### Scenario: the API process dies mid-crawl
- **WHEN** a running run's lease expires
- **THEN** the next claim takes it with attempt 2

### Requirement [CRAWL-003]: only the attempt that owns a run writes its results

A run's pages, keywords, issues, items and final status MUST be written in one transaction that
first locks the run where `status = 'running'` and `attempts` equals the executor's attempt; if the
lock finds no row the transaction MUST write nothing.

#### Scenario: a superseded executor finishes late
- **WHEN** attempt 1 reaches finalize after attempt 2 claimed the run
- **THEN** attempt 1's transaction rolls back and the run's rows are attempt 2's

### Requirement [CRAWL-004]: the blog sitemap is chosen by score before any page is fetched

Discovery MUST read robots.txt sitemap lines (else the well-known paths), expand indexes (depth ≤ 3,
≤ 50 fetches, `.gz` supported), group numbered siblings, and score each group by name tokens, the
share of URLs under `/blog|news|articles/` and the share of the site's feed items it contains; no
page URL MAY be fetched before the selection. Below the threshold the run MUST fail with
`BLOG_SITEMAP_NOT_FOUND`, or `SITEMAP_NOT_FOUND` when no sitemap exists.

#### Scenario: Yoast's numbered post sitemaps
- **WHEN** Yoast is crawled
- **THEN** `post-sitemap.xml` and `post-sitemap2.xml` are selected as one group in index order, and `selection_reason` names the feed share

#### Scenario: a site with only a pages sitemap
- **WHEN** the only sitemap lists product and about pages
- **THEN** the run fails with BLOG_SITEMAP_NOT_FOUND

### Requirement [CRAWL-005]: only the client's own site is crawled

Sitemaps and URLs whose site key differs from the client's MUST be ignored, and a post that
redirects to another site MUST be skipped as `skipped_other_site`.

#### Scenario: Semrush's locale blogs
- **WHEN** Semrush's sitemap index lists `de.semrush.com` sitemaps
- **THEN** they are not fetched

### Requirement [CRAWL-006]: at most the first 15 posts, from at most 30 candidates, in sitemap order

A run MUST consider candidates in sitemap order and stop at 15 crawled posts or 30 considered
candidates, whichever comes first; parallel fetching MUST NOT change which posts are taken.

#### Scenario: a sitemap of 940 posts
- **WHEN** a run crawls a sitemap whose first entry is a listing
- **THEN** it crawls positions 1–15 and records 16 items

### Requirement [CRAWL-007]: skipped and failed candidates are recorded with their reason

The site root, non-HTML resources, robots.txt-disallowed URLs and pages declaring themselves
listings (JSON-LD `CollectionPage` or `ItemList`) MUST be skipped, a failed fetch MUST be recorded
as `failed` with its HTTP status, and in every case the next candidate MUST be tried. Every
considered candidate MUST be one `crawl_run_items` row, and a `crawled` item MUST reference its page.

#### Scenario: a disallowed URL
- **WHEN** robots.txt disallows the third candidate
- **THEN** it is recorded `skipped_robots` and the fourth is fetched

### Requirement [CRAWL-008]: a run's status says how much was crawled

A run MUST end `succeeded` with 15 posts, `partial` with 1–14, and `failed` with 0 posts or a
discovery failure, carrying an error code from the run error catalogue when failed.

#### Scenario: only nine posts could be fetched
- **WHEN** a run crawls 9 posts before running out of candidates
- **THEN** its status is `partial` and `pages_done` is 9

### Requirement [CRAWL-009]: a re-crawl deletes nothing and what is current is computed

A re-crawl MUST upsert the pages it finds and MUST NOT delete any page or page-keyword pair;
pages and pairs not seen by the client's latest succeeded or partial run MUST be hidden from every
user-facing read while keeping their history.

#### Scenario: a post leaves the sitemap
- **WHEN** a re-crawl no longer finds a previously crawled post
- **THEN** its page row and snapshots still exist and it is not listed

### Requirement [CRAWL-010]: nothing site-specific is coded

Crawl, discovery and analysis code MUST contain no site name, host or path specific to a seed
client; both seed sites MUST be handled by the same code paths.

#### Scenario: searching the code
- **WHEN** `git grep -i -E "semrush|yoast" -- be/src/modules be/src/infrastructure` runs
- **THEN** it prints nothing
