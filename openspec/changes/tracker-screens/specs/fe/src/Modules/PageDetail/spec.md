## ADDED Requirements

### Requirement: PAGEDETAIL-001 — the detail opens with the page's summary

The detail MUST show a breadcrumb Pages / client / page whose Pages link restores the list's
search parameters, a header with the title, an external link to the URL, the client badge and the
last crawl time, and KPI cards for best position (with keyword), keywords tracked, issues by
severity and last crawl status.

#### Scenario: returning to a filtered list
- **WHEN** the user opened the detail from `/pages?clientId=2&page=2` and clicks Pages
- **THEN** the list opens at `/pages?clientId=2&page=2`

### Requirement: PAGEDETAIL-002 — the history range is chosen in the user's zone and kept in the URL

The history MUST offer presets 7d, 30d (default), 90d, 12m and a custom range, computed as calendar
days ending today in the user's zone from the session; the range and the Chart/Table view MUST live
in the URL; changing the range twice quickly MUST show the second range's data.

#### Scenario: a fast double change
- **WHEN** the user selects 90d and then 7d before the first answer arrives
- **THEN** the chart shows 7 days

### Requirement: PAGEDETAIL-003 — the chart puts position 1 on top

The chart MUST plot one line per visible keyword with an inverted Y axis from 1 to 100 and dates on
the X axis in the user's zone; keyword chips MUST toggle lines and act as the legend; an empty range
MUST say there are no positions in it.

#### Scenario: hiding a keyword
- **WHEN** the user toggles off a keyword chip
- **THEN** its line disappears and the chip shows it is hidden

### Requirement: PAGEDETAIL-004 — the table summarises each keyword over the range

The table view MUST list per keyword its term, relevance, latest position in the range, change
over the range with a direction arrow (a lower number is an improvement), and best and worst
positions in the range.

#### Scenario: a keyword that moved from 12 to 7
- **WHEN** the first point in range is 12 and the last is 7
- **THEN** the change shows an improvement of 5

### Requirement: PAGEDETAIL-005 — issues are grouped by severity in plain words, and an unreachable page is not found

SEO issues MUST be grouped Errors / Warnings / Notices, each as the catalogue's sentence with its
details; where the code has a bound, the sentence MUST be rendered from the measurement STORED on
the finding, never from the catalogue's current bounds. A page id that is foreign or missing MUST
show a not-found view with a link to Pages.

AMENDED during implementation (`seo-check-catalogue-correction`, task 5.2): the requirement said
"with its details" and left open where the numbers in a sentence come from. Reading them from the
catalogue at render time would make an old verdict explain itself against bounds it was never
judged against — "the title is 72 characters; aim for 30–65" over a crawl that failed it at 60.
The finding carries its own bounds, and the sentence reads those.

#### Scenario: another user's page id
- **WHEN** user B opens `/pages/<A's page id>`
- **THEN** the not-found view is shown and no data of the page appears

#### Scenario: a threshold moved after the crawl
- **WHEN** a finding stored `{ value: 72, min: 30, max: 60 }` and the catalogue now says 30–65
- **THEN** the sentence still reads "The title is 72 characters; aim for 30–60."

