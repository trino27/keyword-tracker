## ADDED Requirements

### Requirement: SHELL-001 — signed-in screens are reachable only with a session, and sign-in returns the user where they were going

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

### Requirement: SHELL-002 — a 401 from any request signs the user out once

A 401 from any gateway call other than sign-in and the session probe MUST clear the session,
reset every ViewModel and navigate to `/sign-in` carrying the current location, handled in one
place.

#### Scenario: a session expiring while a list is open
- **WHEN** the pages list reload answers 401
- **THEN** the sign-in screen opens and no error box is shown

### Requirement: SHELL-003 — sign-out leaves nothing of the previous user

Sign-out MUST end the server session and reset every ViewModel to its initial state, including
stopping every polling timer.

#### Scenario: another user signs in on the same tab
- **WHEN** user A signs out and user B signs in
- **THEN** no client, page or run of user A is rendered at any point

### Requirement: SHELL-004 — one shell, one status vocabulary

Every screen MUST render inside the AppShell (product name, Pages and Clients navigation, a user
menu with the email and Sign out) and open with a page header; crawl statuses MUST be coloured from
one `Record` over the status set: queued grey, running blue with a loader, succeeded green, partial
yellow, failed red.

#### Scenario: a new run status added to the contract
- **WHEN** a status is added to `CRAWL_RUN_STATUSES` without a colour
- **THEN** `pnpm --filter fe typecheck` fails
