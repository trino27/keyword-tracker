## ADDED Requirements

### Requirement: ANALYSIS-010 — a rule answers pass, not applicable, or a finding, and the page stores both counts

Every rule MUST return one of three outcomes — the check passed, the check could not be judged on
this page, or the check failed with its finding — and the analysis MUST store, on the page and in
the same act that stores its issues, how many checks could be judged and how many of those
failed. Applicability MUST be decided while the parsed page is in hand, because the stored page
row holds no canonical, no Open Graph and no JSON-LD and cannot answer the question later.

#### Scenario: a page with no meta description

- **WHEN** a page declares no meta description
- **THEN** META_DESCRIPTION_MISSING fails, META_DESCRIPTION_LENGTH is not applicable, and the page's applicable count excludes it

#### Scenario: the counts agree with the issue rows

- **WHEN** a crawl stores a page with three issues
- **THEN** its stored failed count is 3, and its applicable count is between 13 and 18

#### Scenario: an impossible pair of counts

- **WHEN** a write attempts a failed count greater than the applicable count
- **THEN** the database rejects it and the run's finalize aborts rather than storing an impossible score
