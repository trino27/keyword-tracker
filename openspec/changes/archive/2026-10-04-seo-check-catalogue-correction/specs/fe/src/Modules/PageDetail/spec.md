## ADDED Requirements

### Requirement: PAGEDETAIL-006 — the crawl's response time is shown as a measurement, never as a verdict

The page detail MUST show the time to first byte of the last fetch among the page's crawl facts,
and MUST NOT present it as an issue, a warning or a score input; the screen MUST say, where the
value is shown, that it is one fetch from this crawler and not a measurement of real visitors.

#### Scenario: a slow fetch

- **WHEN** the last crawl of a page took 1728 ms to the first byte
- **THEN** the facts line reads "1728 ms to first byte" and the issues section contains no timing issue

#### Scenario: what the value claims

- **WHEN** the user hovers the response time
- **THEN** the explanation says it is one fetch from our crawler, not a field measurement of their visitors
