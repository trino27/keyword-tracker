## ADDED Requirements

### Requirement: PAGEDETAIL-007 — the detail shows the score with the denominator it came from

The page detail MUST show the health score as a KPI card with its band colour and the count of
applicable checks it was computed from, and MUST NOT describe it as a prediction of traffic, a
comparison with other sites, or a judgement of content quality.

#### Scenario: a page with two failures out of sixteen applicable checks

- **WHEN** the detail of that page is opened
- **THEN** the score card reads 88 with the note "14 of 16 checks passed"
