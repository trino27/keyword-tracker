# fe/src/Gateways Specification

## Purpose

One class per backend resource, and the zod schemas that decide what the app will accept
from the wire. A shape the backend no longer sends is a parse error here, never a blank cell.

## Requirements

### Requirement [GATEWAY-001]: every response is parsed against the shared contract

Every gateway method MUST parse its response with a zod schema declared as `z.ZodType` of the
`@app/contracts` shape it mirrors; a body of the wrong shape MUST be refused (the contract-drift
error), never passed on as `undefined`; an SEO issue code unknown to the catalogue MUST be refused.

#### Scenario: the backend renames a field
- **WHEN** a response lacks a field the schema requires
- **THEN** the gateway throws and the screen shows the contract-drift sentence

#### Scenario: a contract changes and the schema does not
- **WHEN** a field is added to an `@app/contracts` interface and its schema is not updated
- **THEN** `pnpm --filter fe typecheck` fails
