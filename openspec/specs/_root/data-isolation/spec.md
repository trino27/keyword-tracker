# _root/data-isolation Specification

## Purpose
A user reaches their own data and nothing else. It belongs to no one directory:
every route, every guard and every query carries a share of it, and the requirements
here are what each of them owes.

## Requirements

### Requirement [ISO-001]: every route requires a session unless it is declared public

Every HTTP route MUST answer 401 without a valid session, except the routes marked `@Public()`;
the public set MUST be exactly `POST /api/auth/login` and `GET /api/health`.

#### Scenario: a new controller without any decoration
- **WHEN** a route is added and the default-deny e2e suite runs
- **THEN** the route answers 401 without a session, and the suite fails if it does not

#### Scenario: a route made public by accident
- **WHEN** a third route carries `@Public()`
- **THEN** the default-deny suite fails until the allowlist is changed on purpose

### Requirement [ISO-002]: a foreign object answers exactly like a missing one

A request for a client, crawl run or page owned by another user MUST answer the same status (404)
and the same body as a request for an id that does not exist, and ownership MUST be decided in the
SQL of the query that reads the object.

#### Scenario: user B changes an id in the URL
- **WHEN** user B requests `/api/pages/:id` with the id of user A's page
- **THEN** the answer is 404 with the body user B gets for a non-existent id

### Requirement [ISO-003]: a user scope exists only when the session guard created it

Every repository method over a user's data MUST take an `IUserScope` as its first parameter, and
an `IUserScope` MUST be created only by the session guard.

#### Scenario: forging a scope
- **WHEN** code outside the guard's scope factory writes `as IUserScope`
- **THEN** `pnpm --filter be lint` fails

### Requirement [ISO-004]: unscoped methods are never reachable from a controller

A method that reads or writes without a scope MUST carry the suffix `ForWorker`, and no controller
may call one.

#### Scenario: a controller calling a worker method
- **WHEN** a controller calls a method ending in `ForWorker`
- **THEN** `pnpm --filter be lint` fails

### Requirement [ISO-005]: every id-taking route is covered by the isolation matrix

Every route with a path parameter, and every route taking a `clientId`, MUST have a row in the
isolation-matrix e2e suite proving that user B gets 404 for user A's object.

#### Scenario: a new id route without a row
- **WHEN** a route with `:id` is added and no matrix row names it
- **THEN** the isolation-matrix suite fails on its static check
