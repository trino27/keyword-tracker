# fe/src/App Specification

## Purpose

The router: the route tree, the guards that keep every screen behind a sign-in, and what
a bad or missing route id resolves to.

## Requirements

### Requirement [SHELL-001]: signed-in screens are reachable only with a session, and sign-in returns the user where they were going

Every screen except sign-in MUST sit under the pathless app route whose `beforeLoad` asks the
session ViewModel; a visitor without a session MUST be sent to `/sign-in` with the requested
location in `redirect`, and after signing in MUST land there when it is a same-origin path, else
on `/pages`.

#### Scenario: opening a deep link signed out
- **WHEN** a signed-out visitor opens `/pages?clientId=3&q=seo`
- **THEN** they see the sign-in screen and, after signing in, the list with that filter and search

#### Scenario: a hostile redirect
- **WHEN** the redirect parameter is `//evil.example` or an absolute URL
- **THEN** the user lands on `/pages`

### Requirement [SHELL-002]: a 401 from any request signs the user out once

A 401 from any gateway call other than sign-in and the session probe MUST clear the session,
reset every ViewModel and navigate to `/sign-in` carrying the current location, handled in one
place.

#### Scenario: a session expiring while a list is open
- **WHEN** the pages list reload answers 401
- **THEN** the sign-in screen opens and no error box is shown

### Requirement [SHELL-003]: sign-out leaves nothing of the previous user

Sign-out MUST end the server session and reset every ViewModel to its initial state, including
stopping every polling timer.

#### Scenario: another user signs in on the same tab
- **WHEN** user A signs out and user B signs in
- **THEN** no client, page or run of user A is rendered at any point

### Requirement [SHELL-004]: one shell, one status vocabulary

Every screen MUST render inside the AppShell (product name, Pages, Issues and Clients navigation, a
user menu with the email and Sign out) and open with a page header; crawl statuses MUST be coloured
from one `Record` over the status set: queued grey, running blue with a loader, succeeded green,
partial yellow, failed red; issue severities MUST be named and coloured from one `Record` over the
severity set: error "Critical" red, warning "Important" yellow, notice "Improvement" grey. The
navigation's Pages and Issues MUST reopen each screen with the client, filters and grouping it was
last left with in the session; a report never opened takes the client the pages list is filtered to.

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

#### Scenario: leaving a filtered screen and coming back
- **WHEN** the user filters Issues to Critical, grouped by page, opens Pages, then Issues again
- **THEN** Issues shows Critical only, grouped by page, for the same client (plan D30)
