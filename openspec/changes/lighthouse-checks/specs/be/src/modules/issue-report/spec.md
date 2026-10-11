## ADDED Requirements

### Requirement: REPORT-005 — a Lighthouse finding is reported at its page, beside any crawl finding it repeats

A client's report MUST return each current page's Lighthouse findings located at that page, with
the severity, plain copy and page count of any other finding. A Lighthouse finding that repeats
a crawl finding of the same counterpart group MUST be returned as well as the crawl finding, and
neither MAY be merged into the other. Only Core Web Vitals findings MAY be located at all pages.

#### Scenario: a page without a title
- **WHEN** a current page holds `TITLE_MISSING` and Lighthouse's title code
- **THEN** the report returns both findings, each located at that page

#### Scenario: the same Lighthouse problem on every page
- **WHEN** fifteen current pages fail Lighthouse's `link-text`
- **THEN** the report returns fifteen page-located findings with a page count of 15, and none
  located at all pages
