## ADDED Requirements

### Requirement: TZ-004 — the frontend renders instants in the user's zone, never the browser's

Every date or time shown MUST be formatted with `Intl` in `timeZone` from the signed-in user's
session, and every preset range MUST be computed from today in that zone, so a reviewer anywhere
sees the dates a Toronto user sees.

#### Scenario: a late-evening Toronto snapshot viewed from Tokyo
- **WHEN** the instant 2026-11-01T03:30Z is shown to a Toronto user on a machine set to Asia/Tokyo
- **THEN** it is shown as October 31
