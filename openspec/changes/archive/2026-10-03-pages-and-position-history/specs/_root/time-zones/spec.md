## ADDED Requirements

### Requirement: TZ-001 — every instant is stored and sent in UTC

Every instant MUST be a `timestamptz` column, the API process and the database MUST run in UTC, and
every instant on the wire MUST be an ISO-8601 UTC string.

#### Scenario: a timestamp column without a zone
- **WHEN** a schema declares `timestamp(...)` without `withTimezone: true`
- **THEN** `pnpm --filter be lint` fails

### Requirement: TZ-002 — a calendar range in the user's zone becomes UTC bounds

A range of calendar days `[from, to]` MUST be converted to the instants `[00:00 of from, 00:00 of
the day after to)` in the user's zone, so a day containing a DST change is 23 or 25 hours long; this
conversion MUST exist once, in `@app/contracts`.

#### Scenario: the autumn DST change in Toronto
- **WHEN** a Toronto user asks for 2026-11-01 to 2026-11-01
- **THEN** the bounds are 2026-11-01T04:00Z inclusive to 2026-11-02T05:00Z exclusive, and the 12:00Z snapshots of Oct 31 and Nov 2 are excluded

#### Scenario: the spring DST change in Toronto
- **WHEN** a Toronto user asks for 2026-03-08 to 2026-03-08
- **THEN** the bounds are 2026-03-08T05:00Z to 2026-03-09T04:00Z

### Requirement: TZ-003 — the zone is the user's, not the caller's

The zone used for ranges MUST be `users.time_zone` of the signed-in user, carried by the session
scope; no request parameter or header MAY choose it.

#### Scenario: a client sending another zone
- **WHEN** a request adds `timeZone=Asia/Tokyo` to the positions query
- **THEN** it is refused as an unknown parameter (400) and the user's zone is never replaced
