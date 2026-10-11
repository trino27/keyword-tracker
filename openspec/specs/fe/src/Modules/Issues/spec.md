# fe/src/Modules/Issues Specification

## Purpose

The Issues screen: one client's findings — or every client's, one section each — worst first,
explained in plain words, grouped by issue or by page and filtered in memory.

## Requirements

### Requirement [ISSUESUI-001]: the report shows the client the URL names, else every client grouped by client

The Issues screen MUST read its client from the URL. Without one it MUST show every client of the
user, with the same filters for all. By issue it MUST be one list of problems across the clients,
each card counting every client's affected pages and listing them under the client's name and site;
a client not in the list — loading, failed (with Try again), without a finished crawl, or with
nothing found — MUST be named once above it. By page each client MUST be a folded item ordered by
name, headed by the client's name, site, crawl date and count of findings under the filters, opening
onto its pages, with an "Only this client" action that narrows the report to it. It MUST offer every
client of the user in a selector whose empty choice reads "All clients". A client the API answers as
not found MUST show a not-found state with a link to Clients and no data; a user with no clients
MUST be offered Add client.

Modified after `client-issue-report` (plan D31, then D34): the screen opened on the first client by
name; the user asked for all clients — first as one section per client, then grouped inside each
issue card by issue, and folded per client by page.

#### Scenario: one problem on two clients, by issue
- **WHEN** a user whose clients "Semrush" and "Yoast" both have pages without a title opens `/issues`
- **THEN** one "no title" card is shown, listing Semrush's pages and Yoast's pages under each name,
  and the URL names no client

#### Scenario: by page
- **WHEN** the same user opens `/issues?group=page`
- **THEN** a folded "Semrush" item and a folded "Yoast" item are shown; opening one lists that
  client's pages and their problems

#### Scenario: another user's client id
- **WHEN** user B opens `/issues?clientId=<A's client>`
- **THEN** the not-found state is shown and no finding appears

### Requirement [ISSUESUI-002]: the report says what each level means before it lists anything

The report MUST show, above its findings and at all times, the three levels with their meaning:
Critical — the page will not appear in search or drops out of it; Important — the page shows but
ranks or is clicked less; Improvement — good practice. Levels MUST be named so everywhere on the
screen.

#### Scenario: the header
- **WHEN** the report is shown
- **THEN** the rubric's three lines are visible without any interaction

### Requirement [ISSUESUI-003]: findings are grouped by issue by default, worst and widest first

By default findings MUST be grouped by level, Critical first, then by issue, ordered by how many
pages the issue affects — a whole-site speed row counting its pages — with the affected locations
under each. A toggle MUST regroup by page: a Whole site group first, then pages ordered by their
count of Critical, then Important, then Improvement findings. The grouping MUST live in the URL.

#### Scenario: two Important issues
- **WHEN** META_DESCRIPTION_MISSING affects 2 pages and a whole-site `CWV_LCP_POOR` row affects 15
- **THEN** the LCP card comes first among Important issues

### Requirement [ISSUESUI-004]: filters show every level by default and never hide the whole site

The screen MUST filter by level, with every level shown by default, by type (SEO, Speed, Site) and
by URL, all in the URL, all applied to the one snapshot without a new request. A filter to one page
— by URL search or by the page the user came from — MUST keep the whole-site rows (site checks and
whole-site speed figures), because they affect that page too.

#### Scenario: from a page row of the list
- **WHEN** the user opens `/issues?clientId=7&pageId=42`
- **THEN** page 42's findings and every whole-site row are shown, and no other page's

#### Scenario: the default levels
- **WHEN** the report opens without level parameters
- **THEN** Critical, Important and Improvement findings are shown, and the type is All

Modified after `client-issue-report` (plan D30): Improvement was hidden by default; the user asked
for every level.

### Requirement [ISSUESUI-005]: each issue reads as what, why and what to do, with the technical text one click away

Each issue MUST lead with its plain `what`, then "Why it matters" with its plain `why`, then "What
to do" with its plain `fix`, and MUST keep the catalogue's label, hint, explanation and sources
under a collapsed "Technical details". Each page location MUST link to the page and read the
finding's own sentence from its stored details; a lab-sourced speed figure MUST say it may vary.

#### Scenario: a long title
- **WHEN** a page's TITLE_LENGTH finding stored `{ value: 72, min: 30, max: 60 }`
- **THEN** the card leads with the plain what, and that page's line reads "The title is 72
  characters; aim for 30–60."

### Requirement [ISSUESUI-006]: every state of the report is said in words

The screen MUST distinguish loading, a failed request (with Retry), no clients, client not found,
no finished crawl, no findings at all, no findings under the current filters (with Clear filters),
and a page filter naming a page the latest crawl does not have. When PageSpeed's state is
`notConfigured` it MUST say that speed issues need a key; when it is `keyRejected` it MUST say
"Google rejected the PageSpeed key — speed measurements are paused. See the README.", in the words
the pages list and the page detail use for the same state.

#### Scenario: filters that match nothing
- **WHEN** the type filter is Site and the client has no failed site check
- **THEN** the screen reads "No issues match these filters" and offers Clear filters

#### Scenario: Google rejected the key
- **WHEN** the report carries `state: 'keyRejected'`
- **THEN** a red notice above the findings reads "Google rejected the PageSpeed key — speed
  measurements are paused. See the README.", and stored speed findings are still listed
