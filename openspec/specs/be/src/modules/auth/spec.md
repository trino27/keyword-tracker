# be/src/modules/auth Specification

## Purpose
Who the caller is. Passwords at rest, session tokens, the cookie that carries one,
and what a failed sign-in is allowed to tell the person who failed it.

## Requirements

### Requirement [AUTH-001]: a password is stored only as a self-describing scrypt hash

A user's password MUST be stored only as `scrypt$N$r$p$salt$hash` (N=2^17, r=8, p=1, 16-byte
salt) and compared with a constant-time comparison; the plain password MUST never be stored,
logged or returned.

#### Scenario: hashing a new password
- **WHEN** a user's password is set
- **THEN** `users.password_hash` starts with `scrypt$131072$8$1$` and contains no part of the password

#### Scenario: verifying with stored parameters
- **WHEN** a hash created with other scrypt parameters is verified
- **THEN** the parameters are read from the stored string, not from the current defaults

### Requirement [AUTH-002]: only the hash of a session token is stored

A session token MUST be 32 random bytes delivered only in the `sid` cookie, and the database MUST
store only its sha256.

#### Scenario: signing in
- **WHEN** a user signs in
- **THEN** the `sessions` row's `token_hash` equals sha256 of the cookie value and never the cookie value itself

### Requirement [AUTH-003]: the session cookie is HttpOnly, SameSite=Lax and slides for seven days

The `sid` cookie MUST be HttpOnly, SameSite=Lax, Path=/, Secure except on localhost, and valid for
7 days after the last use; use MUST extend the expiry at most once per minute.

#### Scenario: a refresh keeps the user signed in
- **WHEN** a signed-in user reloads the app within 7 days of the last request
- **THEN** `GET /api/auth/me` answers 200 with the same user

#### Scenario: a session unused for 7 days
- **WHEN** a request carries a session whose `expires_at` has passed
- **THEN** it answers 401 SESSION_REQUIRED

### Requirement [AUTH-004]: sign-in does not reveal whether an email exists

Sign-in MUST answer an unknown email and a wrong password with the same status (401), the same
body (`INVALID_CREDENTIALS`), and a comparable cost (a dummy hash is verified for an unknown
email).

#### Scenario: unknown email and wrong password
- **WHEN** one request uses an unknown email and another a known email with a wrong password
- **THEN** both answer 401 with identical bodies

### Requirement [AUTH-005]: sign-in is rate-limited

Sign-in attempts MUST be limited per client address and email; past the limit the answer MUST be
429 `TOO_MANY_REQUESTS`.

#### Scenario: repeated attempts
- **WHEN** an eleventh attempt for one email arrives from one address within a minute
- **THEN** it answers 429

### Requirement [AUTH-006]: sign-out ends the session on the server

Sign-out MUST delete the session row and clear the cookie; the old token MUST no longer
authenticate.

#### Scenario: replaying a signed-out cookie
- **WHEN** a request carries a cookie whose session was signed out
- **THEN** it answers 401

### Requirement [AUTH-007]: the signed-in user and their time zone are readable

`GET /api/auth/me` MUST return the signed-in user's id, email and IANA time zone from
`users.time_zone`, never a zone supplied by the client.

#### Scenario: a seeded Toronto user
- **WHEN** a seed user calls `GET /api/auth/me`
- **THEN** the body's `user.timeZone` is `America/Toronto`

### Requirement [AUTH-008]: a mutating request with a non-JSON body is refused

A POST, PUT, PATCH or DELETE carrying a body MUST be refused with 415 `JSON_REQUIRED` unless its
content type is `application/json`.

#### Scenario: a cross-site form post
- **WHEN** a login arrives as `text/plain`
- **THEN** it answers 415 and no session is created

### Requirement [AUTH-009]: expired sessions are purged on sign-in

Each successful sign-in MUST delete every session whose expiry has passed.

#### Scenario: an old session row
- **WHEN** any user signs in while an expired session row exists
- **THEN** that row no longer exists
