## ADDED Requirements

### Requirement: PAGEDETAIL-008 — a shared finding says how many of the client's pages it affects

An issue affecting more than one of the client's current pages MUST say so on its own line, with
the number of pages affected and the client's current page count; an issue affecting only this
page MUST say nothing extra, so the clause stays a signal rather than decoration.

#### Scenario: a template problem

- **WHEN** an issue is present on five of the client's fifteen current pages
- **THEN** its line carries "on 5 of 15 pages" after the issue's sentence

#### Scenario: a problem of this page only

- **WHEN** an issue is present on this page alone
- **THEN** its line carries no page count
