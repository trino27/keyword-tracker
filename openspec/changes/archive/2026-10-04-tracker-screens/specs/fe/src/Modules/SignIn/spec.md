## ADDED Requirements

### Requirement: SIGNIN-001 — one generic refusal and no account discovery

The sign-in screen MUST show one sentence for an unknown email and for a wrong password, a distinct
sentence when attempts are throttled, keep what the user typed after any refusal, and offer no
sign-up or password reset.

#### Scenario: a wrong password
- **WHEN** the user submits a wrong password
- **THEN** "Email or password is incorrect" is shown and both fields keep their values

### Requirement: SIGNIN-002 — a signed-in visitor skips sign-in

Opening `/sign-in` with a valid session MUST navigate to `/pages`.

#### Scenario: a bookmarked sign-in page
- **WHEN** a signed-in user opens `/sign-in`
- **THEN** the pages list opens
