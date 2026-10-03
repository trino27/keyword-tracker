---
name: testing-patterns
description: Backend test conventions - Jest unit specs beside the unit, mocking repositories, data factories, asserting a Drizzle query, and an e2e test against a real Postgres. Use when writing or reviewing a *.spec.ts or *.e2e-spec.ts.
---

# Backend Tests (Jest)

Two kinds of test, split by who starts the thing under test:

| The test | Lives | Runs with |
| --- | --- | --- |
| constructs a unit (`new CrawlRunService(...)`) | beside the unit, `*.spec.ts` | `pnpm test` |
| starts the app against a real database | `be/testing/`, `*.e2e-spec.ts` | the e2e script |

The e2e marker is `-spec`, not `.spec`, so the unit run never collects it.

## Unit specs

- **One tested file = one folder = one spec**: `services/crawl-run/crawl-run.service.ts` next to
  `crawl-run.service.spec.ts`. A spec that grows past ~600 lines splits by concern
  (`crawl-run.service.finish.spec.ts`) and shares one `*.spec-helpers.ts`.
- Test business rules in services: mock the repositories, assert the result, the error thrown and
  the calls made. Do not test getters, DTOs or framework wiring.
- No `.only`, `fit`, `fdescribe` (ESLint). No per-file `jest.setTimeout`; a slow test passes its own
  timeout as the third argument.
- One `describe` per public method; names use verbs: "throws ... when", "returns ... when",
  "calls ... with".

## Mocks and factories

Build everything in one `makeMocks()` called fresh in each test, never shared mutable state:

```ts
function makeMocks() {
  const pages: jest.Mocked<Pick<PagesRepository, 'findById' | 'upsertMany'>> = {
    findById: jest.fn(),
    upsertMany: jest.fn().mockResolvedValue([]),
  };
  const service = new PageSyncService(pages as unknown as PagesRepository, createPinoLoggerMock());
  return { service, pages };
}

function makePage(overrides: Partial<IPageRecord> = {}): IPageRecord {
  return { id: 1, clientId: 10, url: 'https://example.com/blog/a', crawledAt: new Date('2025-01-01T00:00:00Z'), ...overrides };
}
```

- Type mocks with `jest.Mocked<Pick<Class, 'a' | 'b'>>` so a misspelt method fails at compile time.
- Mock every collaborator method the unit calls, not just the ones the current test reaches. A
  method whose collaborator is missing from the mock can never be called, so it stays untested
  while the spec is green. Check the file's function coverage.
- Use a shared logger double (`createPinoLoggerMock`) kept in a `_testing/` folder beside the
  logger; never hand-roll one. A double lives beside the thing it replaces.
- A transaction runner mock calls its callback straight away: `run: jest.fn((cb) => cb(undefined))`.

## Repositories

A repository's `WHERE` is its behaviour, and "`where` was called" proves nothing. Assert the
rendered SQL: build a Drizzle instance without a driver (`drizzle.mock()`), capture `toSQL()` and
assert on `sql` and `params`. Do this whenever a query uses an alias, a subquery, `ON CONFLICT`, or
groups by an expression, since a mocked builder chain cannot see a malformed statement. Better still,
cover the real queries in the e2e test below.

## E2E against a real database

Use it for what units cannot see: HTTP wiring, the real SQL, and the owner scoping.

- Boot the real `AppModule` against a migrated test Postgres (never your dev data) and drive it with
  `fetch` or supertest. Auth by cookie jar, as the app does.
- **Skip politely, fail in CI.** Probe the database first; with none, report the suite skipped. In
  CI set a flag (`E2E_REQUIRE_INFRA=1`) that turns the skip into a failure.
- **Clean state once** in a `globalSetup`, never in a suite's `beforeAll`: suites run in parallel
  against one database. Each suite creates its own users and clients.
- Assert only what your inputs prove. A whole-table count is not an assertion about your request;
  scope it to ids the test created.
- **Assert the status of every seeding call** and that the id is a number, in a helper. An unchecked
  seed makes the next assertion fail for the wrong reason.
- Write flows, not rules: sign in, add a client, see its crawled pages, read a rank history over a
  date range; and the negative: user B gets 404 for user A's client, page and history.
- Do not write an e2e for a business rule a unit spec can pin.

## Hygiene

- Do not lower a coverage floor to make a build pass; add the test.
- One heavy suite at a time; two concurrent full runs can exhaust memory.
