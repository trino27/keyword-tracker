## ADDED Requirements

### Requirement: SPEED-016 — one mobile call answers performance, SEO and accessibility

A mobile measurement MUST ask PageSpeed for the performance, SEO and accessibility categories in
one request, so the Lighthouse verdicts cost no quota beyond the measurement. A desktop
measurement, where one exists, MUST ask for performance only: Lighthouse's SEO and accessibility
verdicts are taken from mobile alone, the view Google indexes. The key MUST still travel only in
the request header.

#### Scenario: a mobile row is claimed
- **WHEN** a slot claims a page's mobile row
- **THEN** exactly one request is sent, and it asks for `category=performance`,
  `category=seo` and `category=accessibility` for the page's final URL

#### Scenario: a desktop row is claimed
- **WHEN** a slot claims a page's desktop row
- **THEN** its request asks for `category=performance` only, and no Lighthouse verdict or
  Lighthouse finding is written from its answer

### Requirement: SPEED-017 — every Lighthouse audit with a verdict is recorded as passed, not applicable or a finding

On each successful mobile measurement the worker MUST record, for every active Lighthouse code
(its SEO audits, ANALYSIS-028) whose audit is in the answer, exactly one outcome:
- an audit scored 1 is judged and passed;
- an audit scored 0 is judged and becomes one finding under its code, with the severity the
  catalogue gives it;
- an audit Lighthouse reports as not applicable is recorded as not applicable.

An audit that errored, or that the answer does not contain, MUST be recorded as neither. An
accessibility audit MUST NOT be recorded at all: of that category only the score is read
(SPEED-019). An SEO audit in the answer that no active code reads MUST be ignored and logged once
per audit id per process, and MUST NOT fail the measurement.

AMENDED after implementation (D24): every catalogued audit was recorded, and an unknown audit
of either category was logged.

The judged list, the not-applicable list and the Lighthouse findings MUST be written in the same
transaction as the measurement. They MUST replace the page's previous Lighthouse record whole,
and MUST touch no finding of another owner. The database MUST refuse lists that are set one
without the other, that share a code, or that hold a duplicate, null or empty code.

An answer without the SEO or accessibility category MUST still store the Core Web Vitals, and
MUST store both Lighthouse lists as null and no Lighthouse finding. It MUST NOT be recorded as a
failed measurement.

#### Scenario: a page without alt text on two images
- **WHEN** the answer scores `image-alt` 0, `document-title` 1 and reports `hreflang` as not
  applicable
- **THEN** the page holds the `image-alt` code as a finding, its judged list holds the
  `image-alt` and `document-title` codes, and its not-applicable list holds the `hreflang` code

#### Scenario: an audit that errored
- **WHEN** the answer reports `robots-txt` with an error
- **THEN** the `robots-txt` code is in neither list and is not a finding

#### Scenario: an accessibility audit fails
- **WHEN** the answer scores `color-contrast` 0 and the accessibility category 0.94
- **THEN** no list holds the `color-contrast` code, it is not a finding, and the accessibility
  score 94 is stored

#### Scenario: an audit Lighthouse added after the catalogue was written
- **WHEN** the answer holds an SEO audit id the catalogue does not define
- **THEN** the measurement is stored, the id is logged once, and nothing is recorded for it

#### Scenario: an answer without the categories
- **WHEN** an answer holds the performance category only
- **THEN** LCP, INP and CLS are stored as before, both Lighthouse lists are null, and the
  page's earlier Lighthouse findings are removed

#### Scenario: the page's crawl and Core Web Vitals findings
- **WHEN** the worker replaces a page's Lighthouse record
- **THEN** every crawl-owned and every Core Web Vitals finding of the page is still stored

#### Scenario: lists that overlap
- **WHEN** a write puts the same code in the judged and the not-applicable list
- **THEN** the database rejects it

### Requirement: SPEED-018 — Google's field TTFB, each metric's share of good and poor visits, and the LCP breakdown are stored beside the measurement

A measurement MUST additionally store:
- the time to first byte of real visitors: the URL figure, else the origin figure, else none,
  with its source, which MUST never be `lab`;
- for LCP, INP, CLS and TTFB, the share of visits in the good band and in the poor band, each
  between 0 and 1 and together at most 1, taken from the same source as the metric's value. A
  lab-sourced or absent metric MUST have no shares;
- the LCP breakdown from Lighthouse's lab run: the element that was the largest contentful
  paint, and the time spent in each phase Lighthouse reports for it, at most time to first byte,
  resource load delay, resource load duration and render delay.

None of these MAY be required for a measurement to be stored: an answer without them stores the
Core Web Vitals with these parts absent. A failed, released or abandoned attempt MUST leave all
of them as they were.

#### Scenario: a post with page-level field data
- **WHEN** the answer holds the URL's `EXPERIMENTAL_TIME_TO_FIRST_BYTE` p75 of 620 ms and
  LCP proportions 0.68 good, 0.21 needs improvement, 0.11 poor
- **THEN** TTFB is stored as 620 ms from `url`, and LCP's shares as 0.68 good and 0.11 poor

#### Scenario: a site with no field data
- **WHEN** Google has neither URL nor origin data
- **THEN** TTFB is absent, LCP and CLS are stored from `lab` with no shares, and the LCP
  breakdown is stored

#### Scenario: a text element as the largest paint
- **WHEN** Lighthouse reports a paragraph as the LCP element, with only time to first byte and
  render delay
- **THEN** the breakdown holds the element and those two phases, and no load phase

#### Scenario: shares that do not add up
- **WHEN** a write sets a good share of 0.7 and a poor share of 0.4
- **THEN** the database rejects it

### Requirement: SPEED-019 — Lighthouse's SEO and accessibility category scores are stored as lab figures

A mobile measurement MUST store Lighthouse's SEO and accessibility category scores as whole
numbers from 0 to 100, each absent when the answer lacks the category. They MUST NOT produce a
finding.

#### Scenario: both categories in the answer
- **WHEN** the answer's SEO category scores 0.92 and accessibility 0.78
- **THEN** the measurement stores an SEO score of 92 and an accessibility score of 78, and no
  finding comes from either number
