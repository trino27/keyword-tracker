## ADDED Requirements

### Requirement: PAGES-013 — a speed finding counts among a page's issues and never in its score

A speed finding MUST be counted in the page's issue counts by severity and in the client-wide
spread of its code, exactly as a crawl finding is, and MUST be returned among the detail's issues.
The page's score, its applicable and failed counts, and its place in the list's order MUST NOT
change when a speed finding is written or removed.

#### Scenario: a page gains a poor LCP
- **WHEN** a page scoring 88 out of 16 applicable checks gains `CWV_LCP_POOR`
- **THEN** its warning count grows by one, its detail lists the finding, and it still scores 88
  out of 16 in the same position of the list

#### Scenario: the same origin figure on every page
- **WHEN** fifteen pages of a client carry `CWV_INP_NEEDS_IMPROVEMENT` from origin data
- **THEN** each reports the code as affecting fifteen pages, and each counts it as site-wide
