## ADDED Requirements

### Requirement: PAGEDETAIL-013 — the Speed block says what real visitors wait for first, how visits split, and where LCP's time went

The Speed block MUST show:
- the field time to first byte with its value, band, source in plain words and the date. It MUST
  be shown as a line of its own and not as a fourth Core Web Vitals card, and it MUST be absent
  with a reason when Google has no field data;
- under each metric that comes from real visitors, a bar of the share of visits in the good,
  needs-improvement and poor bands, with each share in words in its tooltip;
- the LCP breakdown: the element named as Lighthouse names it, and one segment per phase sized
  by its share of the phases' total, each share in words in its tooltip. It MUST be labelled a
  lab figure from an unthrottled trace that does not add up to any LCP shown above it, and MUST
  NOT present the phases' milliseconds as the page's LCP;
- Lighthouse's SEO and accessibility scores as lab captions beside the performance score, never
  as badges or findings.

Any of these absent from the measurement MUST be omitted without an empty frame.

AMENDED during implementation (task 1.2): this requirement showed each phase "with its time". The
live answer's phases come from Lighthouse's unthrottled trace. On yoast.com they sum to 2.3 s,
next to a simulated lab LCP of 8.9 s, so milliseconds beside the card would contradict it. The
phases' shares are what is true of both.

#### Scenario: field data for the page
- **WHEN** the measurement holds TTFB 620 ms from `url` and LCP shares 0.68 good and 0.11 poor
- **THEN** the block reads "Time to first byte (real visitors to this page): 620 ms · Good", and
  the LCP card carries a bar whose tooltip reads "68% of visits good, 21% need improvement, 11%
  poor"

#### Scenario: a lab-only measurement
- **WHEN** LCP and CLS come from `lab` and Google has no field TTFB
- **THEN** no share bar is shown, the TTFB line says Google has no real-visitor data for this
  page or site, and the LCP breakdown is shown with its lab label

#### Scenario: an image LCP
- **WHEN** the breakdown holds time to first byte 6 ms, resource load delay 736 ms, load duration
  43 ms and render delay 1529 ms
- **THEN** the bar's segments are 0%, 32%, 2% and 66%, and no phase's milliseconds are shown as
  the LCP

#### Scenario: the category scores
- **WHEN** the measurement holds an SEO score of 92 and an accessibility score of 78
- **THEN** the captions read "Lighthouse SEO score (lab): 92/100" and "Lighthouse accessibility
  score (lab): 78/100" beside the performance caption

## MODIFIED Requirements

### Requirement: PAGEDETAIL-009 — the detail lists every check with its outcome and the reason it was skipped

The page detail MUST show a checks section with two columns: "Our checks" and "Lighthouse".

**Rows.** There is one row per counterpart group and one per code that is in no group:
- a row's cell for an owner shows that owner's codes in the group, each with its label and
  status;
- an owner with no code in the row leaves its cell empty.

**Order.** Every row MUST sit under a chapter heading, the chapters and their order being the
ones the Info tab teaches (`CHECK_TOPICS`, one chapter per code by `CHECK_TOPIC_OF`). A
counterpart group sits under the chapter of its crawl code; a Lighthouse-only row under its
own Lighthouse chapter. Within a chapter, rows with a failure come first, and the order the
backend sent is kept otherwise. Each heading MUST say how many of its rows failed. The Lighthouse
chapters MUST continue the list under their own headings, with no block heading of their own:
they are the checks no check of ours shares, not a separate report. Lighthouse's accessibility
audits MUST NOT be listed (ANALYSIS-028); its accessibility score in the speed block stands for
them.

AMENDED after implementation (D24): a "Lighthouse audits" heading opened Lighthouse's chapters,
and its accessibility audits had chapters of their own. The user asked for both to go.

AMENDED during implementation: this said our rows came first as one unheaded list, and only
Lighthouse's were split, into "Lighthouse · SEO" and "Lighthouse · Accessibility". The user asked
for every check to be grouped. The chapters are the Info tab's, so a check reads under the same
heading on both screens.

**Statuses and reasons.** The screen MUST NOT derive a status itself:
- a check that could not be judged MUST be shown with the reason its catalogue entry declares;
- a crawl check added after the last crawl MUST be shown as such;
- a Lighthouse code its last measurement did not record MUST say so.

**Disagreement.** A row in which one owner's codes include a failure and the other owner's codes
include a pass MUST carry a marker. Its tooltip says the two sources can disagree because
Lighthouse runs the page's scripts and measured it at a different time.

**Column headers.** Each column's header MUST carry the date its owner last judged the page in
the user's zone.

**An owner without a record.** Its column MUST show one line in place of its cells, and no
statuses:
- the crawl's line reads "Re-crawl this page to see each check.";
- Lighthouse's line names why there is no record: not yet measured, PageSpeed not configured, or
  the key rejected.

**Summary.** The section MUST summarise how many checks each owner judged and how many it could
not, and MUST point at the SEO issues section for the details of the failures rather than
repeating them.

**Narrow screens.** On a narrow screen a row's two cells MUST stack, each labelled with its
column's name.

Modified by `lighthouse-checks`: Lighthouse is a second owner of checks. A reader comparing our
verdict with the one their client quotes from Lighthouse needs both on the same line, and a cell
showing a status Lighthouse never reported would be a false statement.

#### Scenario: a page with two skipped checks and two failures

- **WHEN** the detail of a page Lighthouse has not measured is opened, its crawl having judged 16
  and skipped 2
- **THEN** the section reads "Our checks: 16 judged · 2 not applicable", shows a row per crawl
  check, shows "The page has no images." under the skipped image check, shows Lighthouse's
  not-measured line once in its column, and closes with "Details for the 2 failed checks are in
  SEO issues below."

#### Scenario: chapters

- **WHEN** the crawl failed `TITLE_LENGTH` and nothing else
- **THEN** "Titles" is the first chapter, its heading says 1 failed, and the title-length row leads it

#### Scenario: the canonical group

- **WHEN** the crawl passed all five canonical checks and Lighthouse failed `canonical`
- **THEN** one row shows the five crawl codes with passes on the left, the Lighthouse code with a
  failure on the right, and the disagreement marker

#### Scenario: a Lighthouse-only failure

- **WHEN** Lighthouse failed `link-text`
- **THEN** it appears first under its Lighthouse chapter with an empty "Our checks" cell, and no
  "Lighthouse audits" heading is shown

#### Scenario: an accessibility audit

- **WHEN** the detail is opened for any page
- **THEN** no Lighthouse accessibility audit has a row, and no chapter is an accessibility one

#### Scenario: a page with nothing failing

- **WHEN** every judged check of both owners passed
- **THEN** no closing line pointing at SEO issues is shown

#### Scenario: a page whose crawl predates the recording

- **WHEN** the detail carries no crawl list
- **THEN** the "Our checks" column shows "Re-crawl this page to see each check." and no crawl
  statuses

#### Scenario: the SEO issues section

- **WHEN** the checks section is shown above it
- **THEN** the issues remain grouped by severity, worst first, with their sentences, hints and
  shared-finding counts unchanged, and include Lighthouse's findings

### Requirement: PAGEDETAIL-012 — the score's explanation says speed is scored separately

The score explanation MUST state that Core Web Vitals are shown in the Speed block and listed as
issues but do not change the score, and why. It MUST state whether Lighthouse's verdicts are in
the number:
- when they are, it MUST show how many of the applicable and failed checks are ours and how many
  are Lighthouse's, and the measurement date;
- when they are not, it MUST say why (not measured yet, or PageSpeed not configured) and that the
  score will move when they arrive.

The arithmetic it shows MUST agree with the score shown.

Modified by `lighthouse-checks`: Lighthouse joined the score. Without this sentence, a page's
score changing hours after its crawl, with no change to the page, would be unexplained.

#### Scenario: a page with a poor LCP
- **WHEN** the detail of a page carrying `CWV_LCP_POOR` is opened
- **THEN** the explanation's arithmetic uses the same applicable and failed counts as before the
  finding, and a paragraph says speed is scored separately

#### Scenario: a page with Lighthouse verdicts
- **WHEN** the page's score is 31 passed of 36 applicable, 16/2 from the crawl and 20/3 from
  Lighthouse measured on Oct 11
- **THEN** the explanation shows 31 ÷ 36, says 16 checks are ours and 20 are Lighthouse's from Oct
  11, and the score shown is 86

#### Scenario: a page Lighthouse has not measured
- **WHEN** the page's score comes from the crawl alone because it has not been measured yet
- **THEN** the explanation says Lighthouse's checks are not in the number yet and that the score
  will move when they are measured
