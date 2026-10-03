---
name: testing
description: What to test in a React SPA with Vitest and Testing Library when state lives in zustand ViewModels and requests in gateway classes - what gets a test, spying on the gateway prototype, resetting stores, placement, size and timezone. Use when writing or placing a frontend test.
---

# Testing a React SPA

**Test behaviour at the cheapest level that can show it.** Pure functions first, ViewModels second, components third, whole-screen tests only for flows that wire several pieces together.

## What gets a test

| Unit | How |
| --- | --- |
| Pure functions and ViewModel `Services/` (date-range maths, formatters, search-param schemas, row mapping) | input in, output out |
| zod schemas | `safeParse` a valid, an invalid and a boundary value; assert messages and defaults |
| `ApiError` / `describeError` / a gateway | feed a `Response`, assert the error or the parsed value; a malformed body must be refused |
| A ViewModel | call the action, assert the state it ends in, including the failure and the superseded cases |
| Components with behaviour (forms, filters, a table with states) | render, act with `userEvent`, assert what the user sees |

## Rules

- **Tests sit beside the unit**, in the unit's folder, named `<unit>.test.ts(x)` (`describeError/describeError.ts` + `describeError.test.ts`). A tested unit is alone in its folder or the folder is its namesake, and everything belonging to it (styles, helpers, split specs) moves with it. Shared render helpers live in one clearly named test-support file, never next to production code.
- **A test file stays under about 300 lines.** When it grows, split by the concern it verifies, named after the unit: `PagesViewModel.superseded.test.ts`, `PageTable.interactions.test.tsx`, never `part1`. When the mock preamble is the bulk of the file, extract the fixtures.
- **A ViewModel test spies on the gateway prototype**, so no instance or injection is needed:
  ```ts
  vi.spyOn(PageGateway.prototype, "list").mockResolvedValue([page]);
  await usePagesViewModel.getState().fetchPages(1);
  expect(usePagesViewModel.getState().status).toBe("ready");
  ```
- **Reset every store between tests**: `useXViewModel.setState(useXViewModel.getInitialState(), true)` in `beforeEach`, plus `vi.restoreAllMocks()`. The second argument replaces the state, actions included. A store that is not reset makes tests order-dependent.
- **Drive the superseded case with deferred promises**: start two calls, resolve the second first, then the first, and assert the state holds the second's data.
- **Component tests set the store, not the network**: put a state in the ViewModel (`setState`) and assert what renders; test the request path in the ViewModel and gateway tests. Do not mock the component's children or hooks.
- **Fake `fetch` only at the gateway test**: replace `globalThis.fetch` with `vi.fn()` returning `new Response(JSON.stringify(body), { status })` and restore it after.
- **Query like a user**: `getByRole`, `getByLabelText`, `findBy*` for async results; `userEvent`, not `fireEvent`. No assertions on class names or implementation details.
- **Assert the failure paths**: a 409 shows its message, a 401 redirects, a schema mismatch shows the contract-drift sentence.
- **The timezone is pinned to `America/Toronto`** in the Vitest config, deliberately not UTC. At UTC the local clock equals the absolute one, and a test that confuses them passes by coincidence. Build dates with explicit offsets and assert both the instant and its local rendering.
- **No focused or disabled tests** (`.only`, `.skip`) in committed code.
- **Name by behaviour**: "joins validation messages into one sentence", not "test toApiError".

## Why

A spy at the gateway boundary exercises the real ViewModel, its identity guard and its state transitions; a fake `fetch` at the gateway test exercises the real parsing. Mocking the layers between them asserts the mocks.
