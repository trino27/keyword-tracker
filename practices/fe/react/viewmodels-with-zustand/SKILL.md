---
name: viewmodels-with-zustand
description: How a ViewModel is written as a zustand store - state and actions in one store, selectors, extracted services, no module-level state, superseded requests, and resetting stores in tests. Use when adding or reviewing a ViewModel, naming an action, or touching how a screen loads data.
---

# ViewModels with zustand

A ViewModel is one zustand store: its state and the actions that change it, together. It is the only layer that calls a gateway.

```ts
// ViewModels/PagesViewModel/PagesViewModel.ts
import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import type { TPage } from "@Gateways/PageGateway/Validation/PageSchemas";

type TStatus = "idle" | "loading" | "ready" | "error";

interface IPagesViewModel {
	pages: TPage[];
	status: TStatus;
	error: string | null;
	fetchPages: (clientId: number) => Promise<void>;
}

export const usePagesViewModel = create<IPagesViewModel>()((set) => {
	let latest: symbol | null = null; // created inside `create`: dies with the store

	return {
		pages: [],
		status: "idle",
		error: null,
		fetchPages: async (clientId) => {
			const request = Symbol();
			latest = request;
			set({ status: "loading", error: null });
			try {
				const pages = await gateways.pages.list(clientId);
				if (latest !== request) return; // superseded: a newer request owns the state
				set({ pages, status: "ready" });
			} catch (e) {
				if (latest !== request) return;
				set({ status: "error", error: describeError(e) });
			}
		},
	};
});
```

## Shape

- **One store per entity**, named `use<Entity>ViewModel`, in `ViewModels/<Entity>ViewModel/<Entity>ViewModel.ts`. A collection screen may keep several in `<Entity>ViewModels/`.
- **State and actions live in the same `create`.** No separate "actions" module, no store split across files.
- **A state that is one of several phases is one field**, not a pile of booleans: `status: "idle" | "loading" | "ready" | "error"`, not `isLoading` + `isError` + `hasData`, which can all be true together.
- **Reads and writes fail separately.** A failed read means "nothing to show" (`error`); a refused write means "what you asked did not happen" (`actionError`). One field for both blanks the screen when a button is refused (`fe/skills/error-display`).
- **Selectors are inline and narrow**: `useXViewModel((s) => s.field)`. Selecting the whole store re-renders on every change. A selector that builds a new object or array on each call needs `useShallow` or a stored result.
- **Interfaces and types**: `I<Entity>ViewModel` for the store, `T...` for data shapes. Types of response data come from the gateway schemas (`z.infer`), never re-declared.

## Action names say what the call does

| Prefix | Calls a gateway | Shows loading | Writes state |
| --- | --- | --- | --- |
| `fetch*` | yes | yes (`status: "loading"`) | yes |
| `refresh*` | yes | no (keeps what is on screen) | yes |
| `apply*` | no, merges data it was handed | no | yes |
| `prefetch*` | yes | no | no, returns the payload |

Do not name an action `load*`: it does not say whether the network is touched. A mutation is named for the verb (`addClient`, `removeClient`) and is single-shot, never retried by hand: a retry can write twice.

## Services

Logic that is more than a few lines, or reused, leaves the store file: `ViewModels/<Entity>ViewModel/Services/<Name>/<name>.ts`.

- A VM file declares its interfaces, the initial state and the actions. Anything that computes a value or a state patch is a service function; the test is whether a reader must scroll past the config to learn what the VM does.
- A service is **pure**: arguments in, value out, no store access, no gateway. It is imported only inside its own `<Entity>ViewModel/`; needed by a second ViewModel, it moves up to `Core/Helpers/`.
- A derived getter takes its source as an **argument** (`getView: (rows) => derive(rows)`), never reads `get()` implicitly, so React Compiler and selectors see what it depends on.

## No module-level mutable state

A `let` at module scope outlives every store reset: it is state the ViewModel cannot clear, and the next screen or test inherits it. In-flight promises, request identities, counters and dedup memory live **in the store** or in a closure created **inside `create`** (as `latest` above).

## Superseded requests

An answer is written only if its request is still the latest one. **Hold the request's identity** (a `Symbol`, a counter, the promise itself), not a boolean: with `isLoading` alone, request A answering after request B overwrites B's newer data, and the screen sits on stale rows with no error. Check identity after every `await` and before every `set`, in the success and the failure branch alike. Sharing an in-flight request, and refresh after a mutation: `fe/skills/data-retrieval`.

## Reset

A store outlives its screen. State that must not survive (a signed-out user's rows, a form draft) is cleared by an explicit `reset()` action that restores the initial state and invalidates the in-flight identity (`latest = null`). The session ViewModel calls the others' resets on sign-out.

## Testing

Spy on the gateway **prototype** and reset the store between tests (`testing`):

```ts
vi.spyOn(PageGateway.prototype, "list").mockResolvedValue([page]);
usePagesViewModel.setState(usePagesViewModel.getInitialState(), true);
```
