## ADDED Requirements

### Requirement: PAGELIST-007 — the row says how many of its findings the client's other pages share

The issues cell MUST show, beside the severity badges, how many of the page's findings also
appear on at least one other current page of the same client, and MUST show nothing extra when
that number is zero.

#### Scenario: a page carrying two template problems

- **WHEN** two of a page's seven findings are also on other pages of the same client
- **THEN** the cell reads the severity badges followed by "2 site-wide"

#### Scenario: a page whose problems are its own

- **WHEN** none of a page's findings appear on another page of the client
- **THEN** the cell shows only the severity badges
