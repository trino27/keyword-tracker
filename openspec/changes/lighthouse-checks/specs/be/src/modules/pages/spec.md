## ADDED Requirements

### Requirement: PAGES-016 — a Lighthouse finding counts among a page's issues, in the client-wide spread and in the score, even when it repeats one of ours

A Lighthouse finding MUST be counted in the page's issue counts by severity and in the
client-wide spread of its code, exactly as a crawl finding is. It MUST be returned among the
detail's issues and MUST count as a failed check in the page's score. A Lighthouse finding that
repeats a crawl finding of the same counterpart group MUST still be counted on its own. Neither
finding MAY hide the other.

#### Scenario: a page without a title
- **WHEN** a page with 16 applicable crawl checks and 7 judged Lighthouse audits holds
  `TITLE_MISSING` and Lighthouse's title code, and nothing else fails
- **THEN** its issue counts include both, and its score is 21 passed of 23 applicable

#### Scenario: a problem on a template
- **WHEN** five of a client's fifteen current pages fail Lighthouse's `link-text`
- **THEN** each of those pages reports that code as affecting five pages

#### Scenario: a measurement stored before the accessibility audits were retired
- **WHEN** a page's measurement judged 37 Lighthouse audits, ten of them SEO audits, and failed
  `color-contrast`
- **THEN** its score counts the ten SEO audits only, and `color-contrast` neither fails nor
  appears among its checks

AMENDED after implementation (D24): the score counts the active Lighthouse codes only, read
through their weights in the query, not `cardinality(lighthouse_judged)` and `lighthouse_failed`.

### Requirement: PAGES-017 — the measurement carries the field TTFB, the shares of visits, the LCP breakdown and the category scores

A page's speed summary MUST carry, with its measurement:
- the field TTFB with its band and source, or none;
- for each metric whose source is real visitors, its good and poor shares;
- the LCP breakdown, with its element and phases, marked as a lab figure;
- the SEO and accessibility category scores, each or both absent when not measured.

TTFB's band MUST be derived when read from Google's published TTFB thresholds (good up to 800
ms, poor above 1800 ms), by one shared function, and MUST NOT be stored. TTFB MUST NOT produce a
finding. The list MUST still be read in a constant number of statements.

#### Scenario: a page measured with field data
- **WHEN** a page's measurement holds TTFB 620 ms from `url` and LCP shares 0.68 good, 0.11 poor
- **THEN** its summary reads TTFB 620 ms, band good, source `url`, and LCP shares 0.68 and 0.11

#### Scenario: a page measured before this change
- **WHEN** a page's measurement predates the new columns
- **THEN** its summary carries its Core Web Vitals as before and every new part as absent

## MODIFIED Requirements

### Requirement: PAGES-012 — a page answers every crawl-owned catalogue check with one of four statuses

A page's detail MUST carry, for each owner whose verdicts are scored (the crawl and Lighthouse),
either that owner's list of checks or null.

**What a list holds.** One entry per active code of that owner, in catalogue order, each with
exactly one of four statuses:
- the check passed;
- the check failed;
- the check could not be judged on this page;
- the owner did not record this check the last time it judged the page.

A code of an owner that is not scored MUST NOT appear as a check entry. Each owner's status MUST
be composed on the backend from the lists that owner stored, because only those lists can tell a
skipped check from one that was never recorded. The crawl's lists are stored on the page row,
and Lighthouse's lists on the page's mobile measurement.

**When a list is null.** An owner's list MUST be null when that owner has no stored lists for the
page: the crawl predates the recording, or Lighthouse has not measured the page. The other
owner's list MUST NOT depend on it.

**What the database enforces.** The crawl's stored lists MUST be written by the same statement
that writes the page's check counters. The database MUST refuse a row whose judged list
disagrees with its applicable count, whose two lists share a code, or whose lists hold a
duplicate, a null or an empty code. A re-crawl MUST replace both lists rather than merge them.

Modified by `issue-catalogue-owners`: the catalogue gained codes the crawl does not run. Listed as
checks they would read "not yet checked" on every page forever, since no crawl will ever judge
them; a speed finding is shown in the page's issues and in its Speed block instead.

Modified by `lighthouse-checks`: Lighthouse is a second owner whose verdicts are checks. It
judges the page at a different time from the crawl, and can be missing while the crawl is
present. Each owner therefore gets its own list and its own null, and one list never claims what
the other owner recorded.

#### Scenario: a page whose crawl skipped two checks

- **WHEN** its detail is read and the page stored 16 judged codes, 2 not-applicable codes and one
  failing finding
- **THEN** the crawl's list carries 18 entries: 15 passed, 1 failed and 2 not applicable, in
  catalogue order

#### Scenario: a page carrying a speed finding

- **WHEN** a page holds `CWV_CLS_POOR` among its findings
- **THEN** no check entry of any owner names a Core Web Vitals code, and every other entry's
  status is what it was without the speed finding

#### Scenario: a page Lighthouse has judged

- **WHEN** the page's mobile measurement holds 20 judged Lighthouse codes, 6 not applicable, and
  the page holds two Lighthouse findings
- **THEN** Lighthouse's list carries 18 passed, 2 failed and 6 not applicable entries, and the
  crawl's list is unchanged

#### Scenario: a page Lighthouse has not measured

- **WHEN** the page has no measurement, or one stored before Lighthouse's lists existed
- **THEN** Lighthouse's list is null and the crawl's list is composed as before

#### Scenario: a Lighthouse audit that errored

- **WHEN** a Lighthouse code is in neither of the measurement's lists
- **THEN** its status is that Lighthouse did not record it

#### Scenario: a check added to the catalogue after the crawl

- **WHEN** a crawl-owned code is in neither stored list
- **THEN** its status is "not yet checked", and the page's score is unchanged because the score
  reads the stored counters and lists and never today's catalogue

#### Scenario: a code that has left the catalogue since the crawl

- **WHEN** a stored list holds a code the catalogue no longer defines
- **THEN** no entry is produced for it

#### Scenario: a page last crawled before the lists were recorded

- **WHEN** its detail is read
- **THEN** the crawl's list is null, and the screen says the page must be re-crawled

#### Scenario: a write whose count and list disagree

- **WHEN** a page is written with an applicable count that is not the size of its judged list
- **THEN** the database rejects it and the crawl's finalize aborts

#### Scenario: a re-crawl that skips nothing

- **WHEN** a page that previously stored two not-applicable codes is re-crawled and every check
  applies
- **THEN** its stored not-applicable list is empty

### Requirement: PAGES-009 — a page's health score is the share of the checks that could apply to it

The pages list and the page detail MUST each carry a score derived at read time. It is the
rounded percentage of applicable checks that passed, where applicable and failed are summed over
every scored owner:
- **crawl:** the stored applicable and failed counters;
- **Lighthouse:** the number of codes in its stored judged list and the number of its findings.

An owner with no stored record MUST contribute nothing. The score MUST carry the summed
applicable and failed counts and each scored owner's own counts (or that owner's absence), so two
pages with different denominators are never presented as comparable without the denominator
being visible. One implementation of the formula MUST serve both the backend and the frontend,
and the list's order MUST be computed from the same sums.

Modified by `lighthouse-checks`: Lighthouse's verdicts count in the score. A page's score moves
when its first Lighthouse verdicts are stored. A client without a PageSpeed key keeps a
crawl-only score, and the per-owner counts say which kind each page has.

#### Scenario: sixteen applicable, two failed

- **WHEN** a page stored 16 applicable crawl checks of which 2 failed, and Lighthouse has not
  measured it
- **THEN** its score is 88, reported with `applicable: 16`, `failed: 2` and Lighthouse absent

#### Scenario: a page that passed everything that applied

- **WHEN** a page stored 18 applicable crawl checks and 0 failures, and Lighthouse has not
  measured it
- **THEN** its score is 100

#### Scenario: crawl and Lighthouse together

- **WHEN** a page stored 16 applicable crawl checks with 2 failed, and Lighthouse judged 20 audits
  of which 3 failed
- **THEN** its score is 86 (31 of 36), reported with `applicable: 36`, `failed: 5`, and crawl
  16/2 and Lighthouse 20/3

#### Scenario: the list orders by the same score

- **WHEN** page A scores 88 on crawl alone, and page B scores 90 on crawl alone but 80 once
  Lighthouse is added
- **THEN** page B is listed before page A
