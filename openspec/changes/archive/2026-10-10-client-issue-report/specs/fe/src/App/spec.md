## MODIFIED Requirements

### Requirement: SHELL-004 — one shell, one status vocabulary

Every screen MUST render inside the AppShell (product name, Pages, Issues and Clients navigation, a
user menu with the email and Sign out) and open with a page header; crawl statuses MUST be coloured
from one `Record` over the status set: queued grey, running blue with a loader, succeeded green,
partial yellow, failed red; issue severities MUST be named and coloured from one `Record` over the
severity set: error "Critical" red, warning "Important" yellow, notice "Improvement" grey.

Modified by `client-issue-report`: the navigation gains Issues, and severity gains the same
single-source vocabulary crawl statuses already have — the report introduces the names Critical,
Important and Improvement, and one scale under two sets of names on two screens reads as two
scales.

#### Scenario: a new run status added to the contract
- **WHEN** a status is added to `CRAWL_RUN_STATUSES` without a colour
- **THEN** `pnpm --filter fe typecheck` fails

#### Scenario: a new severity added to the contract
- **WHEN** a severity is added to `SEO_ISSUE_SEVERITIES` without a name and colour
- **THEN** `pnpm --filter fe typecheck` fails

#### Scenario: the navigation
- **WHEN** a signed-in user looks at the header
- **THEN** it offers Pages, Issues and Clients in that order
