---
name: testing
description: Test conventions specific to this frontend - Vitest with jsdom and Testing Library, the Toronto timezone, spying on gateway prototypes, resetting ViewModel stores, and where specs live. Use when writing, placing or splitting a test under fe/.
---

# Frontend Testing (this app)

The general method (what gets a test, the cheapest level, behaviour-named tests, no `.only`) is `practices/fe/react/testing/SKILL.md`. This file is what is particular to `fe/`.

## Setup

- **Runner**: Vitest with `environment: "jsdom"` and `globals: true`; setup in `fe/vitest.setup.ts` (jest-dom matchers, cleanup). Specs match `src/**/*.test.{ts,tsx}`.
- **Timezone**: `TZ=America/Toronto` is set in `fe/vite.config.ts` (`test.env`). Snapshots are stored in UTC and shown in Toronto time, so a test that formats a date asserts both the instant and its Toronto rendering, built from explicit offsets. Never set the zone inside a spec.
- **Commands**: `pnpm --filter fe test:ci` for one run, `pnpm --filter fe test` for watch. `--filter` takes the package **name** (`fe`); a filter that matches nothing still exits 0, so check that tests actually ran.

## ViewModel tests

```ts
import { PageGateway } from "@Gateways/PageGateway/PageGateway";
import { usePagesViewModel } from "./PagesViewModel";

beforeEach(() => {
	usePagesViewModel.setState(usePagesViewModel.getInitialState(), true);
});
afterEach(() => vi.restoreAllMocks());

it("ends in ready with the rows", async () => {
	vi.spyOn(PageGateway.prototype, "list").mockResolvedValue([page]);
	await usePagesViewModel.getState().fetchPages(1);
	expect(usePagesViewModel.getState()).toMatchObject({ status: "ready", pages: [page] });
});
```

- Spy on the **class prototype**, never on the `gateways` registry instance: the spy then holds for any instance and survives a rename of the registry key.
- Reset with `getInitialState()` and `true` (replace, so actions are restored too) in `beforeEach`. Any state held outside the store would survive this reset, which is why a ViewModel keeps none (`viewmodels-with-zustand`).
- Every ViewModel that loads has a test for the **superseded** case (two calls, answers in reverse order, the later request wins) and for the failure path (`status: "error"`, `error` set from `describeError`).
- Every ViewModel that writes has a test that a refused write sets `actionError` and leaves the read state untouched.

## Gateway tests

Replace `globalThis.fetch` with `vi.fn()` returning a `Response`; assert the parsed value, the `ApiError` for a non-2xx, and that a body of the wrong shape is **refused**, not passed through as `undefined`. This is the check that catches a backend change early.

## Component tests

Render with the store set up by `setState`; assert what the user sees with `getByRole` / `getByLabelText` and `userEvent`. A view has no logic, so a component test checks wiring (it selects, it calls the action) and states (loading, error, empty, rows), not derivations.

## Placement and size

Beside the unit, in the unit's folder (`Core/Helpers/DescribeError/describeError.test.ts`). A ViewModel's spec sits in its `<Entity>ViewModel/` folder; its services' specs in their own folders. A file near 300 lines is split by concern: `PagesViewModel.superseded.test.ts`. Enforced by review; the repository's pre-push runs the whole suite.
