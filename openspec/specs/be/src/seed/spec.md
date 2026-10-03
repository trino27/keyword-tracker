# be/src/seed Specification

## Purpose
The demo data a clean clone starts from: two accounts, their crawled clients, and a
deterministic rank history to draw.

## Requirements

### Requirement [SEED-001]: one idempotent command creates the demo accounts

The seed MUST upsert `semrush.manager@example.com` with client "Semrush" (https://www.semrush.com)
and `yoast.manager@example.com` with client "Yoast" (https://yoast.com), both in
`America/Toronto`, with the password taken from `SEED_USER_PASSWORD`; no password or secret MAY
appear in code.

#### Scenario: running the seed twice
- **WHEN** the seed runs a second time
- **THEN** there are still exactly two seed users and one client each

### Requirement [SEED-002]: the seed crawls through the same path as the UI and fails loudly

For each seed client without a succeeded or partial run, the seed MUST enqueue a run with
`trigger = 'seed'` executed by the same worker as a UI run, wait for it, and exit non-zero when it
fails, naming the run's error code.

#### Scenario: a site that cannot be crawled
- **WHEN** a seed client's run ends `failed`
- **THEN** the seed exits with a non-zero status and prints the error code

#### Scenario: a client already crawled
- **WHEN** a seed client already has a succeeded run
- **THEN** no new run is created for it

### Requirement [SEED-003]: every current pair gets a deterministic daily history of at least 50,000 rows in total

The seed MUST generate positions for every current page-keyword pair in the database, including
UI-added clients: a full history for a new pair, and the days since the last snapshot for an
existing pair continuing from its last position. The history length MUST be
`max(365, ceil(50000 / pairs))` days, the same pair and day MUST always produce the same position,
re-running MUST add no duplicate rows, and the database MUST hold at least 50,000 snapshots
afterwards.

#### Scenario: a client added after the first seed
- **WHEN** a client is added in the UI, crawled, and the seed runs again
- **THEN** its pages get a full history and the seed clients' pairs only gain the missing days

#### Scenario: a second run on the same day
- **WHEN** the seed runs twice on one day
- **THEN** the second run adds 0 rows

### Requirement [SEED-004]: seeded snapshots are captured at noon UTC and never in the future

Every seeded snapshot MUST be captured at 12:00:00 UTC, and the newest MUST be the latest 12:00 UTC
not after the moment the seed runs.

#### Scenario: seeding before noon UTC
- **WHEN** the seed runs at 11:59 UTC
- **THEN** the newest snapshot is yesterday's 12:00 UTC

### Requirement [SEED-005]: positions follow a mean-reverting walk around a relevance baseline

A pair's baseline MUST come from its relevance (the strongest keywords around 3–15, weak ones
around 30–90), and each day's position MUST be the previous one plus a pull towards the baseline,
small noise and a rare jump, clamped to 1–100.

#### Scenario: the strongest keyword of a page
- **WHEN** a pair with relevance 1 is seeded
- **THEN** its baseline is between 3 and 15
