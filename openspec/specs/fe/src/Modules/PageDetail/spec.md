# fe/src/Modules/PageDetail Specification

## Purpose

One page of a client: what it is, how it ranks over time, what was checked on it, how its score
follows from those checks, and what to fix. Requirements here are about what the SCREEN must
say; the values it says them about are specified in `be/src/modules/pages`.

## Requirements

### Requirement [PAGEDETAIL-009]: the detail lists every check with its outcome and the reason it was skipped

The page detail MUST show a section listing every catalogue check with its label and its status,
in the order the backend sent them, and MUST NOT derive a status itself. A check that could not be
judged MUST be shown with the static reason its catalogue entry declares, and a check added after
the last crawl MUST be shown as such. The section MUST summarise how many checks were judged and
how many were not, and MUST point at the SEO issues section for the details of the failures rather
than repeating them. A page whose last crawl recorded no check outcomes MUST show a line asking
for a re-crawl and no check rows.

#### Scenario: a page with two skipped checks and two failures

- **WHEN** the detail is opened
- **THEN** the section reads "16 judged · 2 not applicable", shows a row per catalogue check,
  shows "The page has no images." under the skipped image check, and closes with "Details for the
  2 failed checks are in SEO issues below."

#### Scenario: a page with nothing failing

- **WHEN** every judged check passed
- **THEN** no closing line pointing at SEO issues is shown

#### Scenario: a page whose crawl predates the recording

- **WHEN** the detail carries no check outcomes
- **THEN** the section shows "Re-crawl this page to see each check." and no rows and no subtitle

#### Scenario: the SEO issues section

- **WHEN** the checks section is added above it
- **THEN** the issues remain grouped by severity, worst first, with their sentences, hints and
  shared-finding counts unchanged

### Requirement [PAGEDETAIL-010]: the score is explained on the page's own numbers and bounded in what it claims

The page detail MUST show how its health score was computed, using this page's own passed and
applicable counts and the rounding that produced the displayed value. It MUST state that every
check counts the same and why, that the denominator is the checks that could be judged on this
page, and which bands the score falls in. It MUST state that the score claims only the absence of
obvious technical defects, and MUST NOT present it as a traffic forecast, a comparison with a
competitor, or a judgement of the writing. The arithmetic shown MUST agree with the score shown.

#### Scenario: sixteen applicable checks of which two failed

- **WHEN** the detail is opened
- **THEN** it reads that 14 of the 16 checks that applied passed, shows the division and the
  rounding that produced the displayed score, and names the poor/average/good bands

#### Scenario: a quotient that would round the other way at one decimal

- **WHEN** 1 of 16 checks passed, so the quotient is 6.25 and the score is 6
- **THEN** the quotient is shown with enough precision that the rounding stated beside it is
  correct

#### Scenario: a page that passed everything that applied

- **WHEN** the quotient is a whole number
- **THEN** no rounding clause is shown

### Requirement [PAGEDETAIL-007]: the detail shows the score with the denominator it came from

The page detail MUST show the health score as a KPI card with its band colour and the count of
applicable checks it was computed from, and MUST NOT describe it as a prediction of traffic, a
comparison with other sites, or a judgement of content quality.

#### Scenario: a page with two failures out of sixteen applicable checks

- **WHEN** the detail of that page is opened
- **THEN** the score card reads 88 with the note "14 of 16 checks passed"

### Requirement [PAGEDETAIL-006]: the crawl's response time is shown as a measurement, never as a verdict

The page detail MUST show the time to first byte of the last fetch among the page's crawl facts,
and MUST NOT present it as an issue, a warning or a score input; the screen MUST say, where the
value is shown, that it is one fetch from this crawler and not a measurement of real visitors.

#### Scenario: a slow fetch

- **WHEN** the last crawl of a page took 1728 ms to the first byte
- **THEN** the facts line reads "1728 ms to first byte" and the issues section contains no timing issue

#### Scenario: what the value claims

- **WHEN** the user hovers the response time
- **THEN** the explanation says it is one fetch from our crawler, not a field measurement of their visitors

### Requirement [PAGEDETAIL-008]: a shared finding says how many of the client's pages it affects

An issue affecting more than one of the client's current pages MUST say so on its own line, with
the number of pages affected and the client's current page count; an issue affecting only this
page MUST say nothing extra, so the clause stays a signal rather than decoration.

#### Scenario: a template problem

- **WHEN** an issue is present on five of the client's fifteen current pages
- **THEN** its line carries "on 5 of 15 pages" after the issue's sentence

#### Scenario: a problem of this page only

- **WHEN** an issue is present on this page alone
- **THEN** its line carries no page count

### Requirement [PAGEDETAIL-001]: the detail opens with the page's summary

The detail MUST show a breadcrumb Pages / client / page whose Pages link restores the list's
search parameters, a header with the title, an external link to the URL, the client badge and the
last crawl time, and KPI cards for best position (with keyword), keywords tracked, issues by
severity and last crawl status.

#### Scenario: returning to a filtered list
- **WHEN** the user opened the detail from `/pages?clientId=2&page=2` and clicks Pages
- **THEN** the list opens at `/pages?clientId=2&page=2`

### Requirement [PAGEDETAIL-002]: the history range is chosen in the user's zone and kept in the URL

The history MUST offer presets 7d, 30d (default), 90d, 12m and a custom range, computed as calendar
days ending today in the user's zone from the session; the range and the Chart/Table view MUST live
in the URL; changing the range twice quickly MUST show the second range's data.

#### Scenario: a fast double change
- **WHEN** the user selects 90d and then 7d before the first answer arrives
- **THEN** the chart shows 7 days

### Requirement [PAGEDETAIL-003]: the chart puts position 1 on top

The chart MUST plot one line per visible keyword with an inverted Y axis from 1 to 100 and dates on
the X axis in the user's zone; keyword chips MUST toggle lines and act as the legend; an empty range
MUST say there are no positions in it.

#### Scenario: hiding a keyword
- **WHEN** the user toggles off a keyword chip
- **THEN** its line disappears and the chip shows it is hidden

### Requirement [PAGEDETAIL-004]: the table summarises each keyword over the range

The table view MUST list per keyword its term, relevance, latest position in the range, change
over the range with a direction arrow (a lower number is an improvement), and best and worst
positions in the range.

#### Scenario: a keyword that moved from 12 to 7
- **WHEN** the first point in range is 12 and the last is 7
- **THEN** the change shows an improvement of 5

### Requirement [PAGEDETAIL-005]: issues are grouped by severity in plain words, and an unreachable page is not found

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
