## ADDED Requirements

### Requirement: CLIENTSUI-006 — each client opens its issue report

Each row of the clients table MUST offer "View issues" beside "View pages", opening
`/issues?clientId=<the client's id>`.

#### Scenario: from the clients table
- **WHEN** the user clicks View issues on Yoast's row
- **THEN** the report opens with Yoast selected
