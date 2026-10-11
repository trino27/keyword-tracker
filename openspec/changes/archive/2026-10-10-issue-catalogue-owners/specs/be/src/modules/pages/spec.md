## MODIFIED Requirements

### Requirement: PAGES-012 — a page answers every crawl-owned catalogue check with one of four statuses

A page's detail MUST carry one entry per active crawl-owned catalogue code, in catalogue order,
each with exactly one of four statuses: the check passed, the check failed, the check could not be
judged on this page, or the check did not exist when this page was last crawled. A code another
writer owns MUST NOT appear as a check entry. The status MUST be composed on the backend from the
lists the crawl stored on the page row, because only those lists can tell a check that was skipped
from one that did not yet exist. A page whose last crawl predates the recording MUST say so rather
than report a status it never observed.

The stored lists MUST be written by the same statement that writes the page's check counters, and
the database MUST refuse a row whose judged list disagrees with its applicable count, whose two
lists share a code, or whose lists hold a duplicate, a null or an empty code. A re-crawl MUST
replace both lists rather than merge them.

Modified by `issue-catalogue-owners`: the catalogue gained codes the crawl does not run. Listed as
checks they would read "not yet checked" on every page forever, since no crawl will ever judge
them; a speed finding is shown in the page's issues and in its Speed block instead.

#### Scenario: a page whose crawl skipped two checks

- **WHEN** its detail is read and the page stored 16 judged codes, 2 not-applicable codes and one
  failing finding
- **THEN** the detail carries 18 entries: 15 passed, 1 failed and 2 not applicable, in catalogue
  order

#### Scenario: a page carrying a speed finding

- **WHEN** a page holds `CWV_CLS_POOR` among its findings
- **THEN** no check entry names a speed code, and every other entry's status is what it was
  without the speed finding

#### Scenario: a check added to the catalogue after the crawl

- **WHEN** a crawl-owned code is in neither stored list
- **THEN** its status is "not yet checked", and the page's score is unchanged because the score
  reads the stored counters and never today's catalogue

#### Scenario: a code that has left the catalogue since the crawl

- **WHEN** a stored list holds a code the catalogue no longer defines
- **THEN** no entry is produced for it

#### Scenario: a page last crawled before the lists were recorded

- **WHEN** its detail is read
- **THEN** it carries no check entries at all, and the screen says the page must be re-crawled

#### Scenario: a write whose count and list disagree

- **WHEN** a page is written with an applicable count that is not the size of its judged list
- **THEN** the database rejects it and the crawl's finalize aborts

#### Scenario: a re-crawl that skips nothing

- **WHEN** a page that previously stored two not-applicable codes is re-crawled and every check
  applies
- **THEN** its stored not-applicable list is empty
