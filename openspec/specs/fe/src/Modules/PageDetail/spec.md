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
