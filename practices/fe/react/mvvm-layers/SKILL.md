---
name: mvvm-layers
description: The layers of a React SPA built as MVVM - App, Modules, ViewModels, Gateways, Core - the direction imports may point, what each layer may import, and why views carry no logic. Use when adding a file, a screen or an import, or when unsure which layer owns something.
---

# MVVM Layers

A React SPA behind a login. No SSR. One folder per layer under `src/`, PascalCase, and one path alias per layer (`path-aliases`).

| Layer | Owns | Is |
| --- | --- | --- |
| `Modules/` | screens and components | the **View**: selects state, calls actions, renders |
| `ViewModels/` | screen and domain state, async actions | the **ViewModel**: a zustand store per entity (`viewmodels-with-zustand`) |
| `Gateways/` | requests, zod schemas, `ApiError` | the boundary to the backend, one class per resource (`gateway-classes`) |
| `Core/` | configs, constants, types, pure helpers | vocabulary with no feature knowledge |
| `App/` | the route tree and its guards | wiring: which screen at which URL, who may enter |

## Direction

```
App -> Modules -> ViewModels -> Gateways -> Core
```

A layer imports only from layers to its right. `Core/` and `Gateways/` never import `@Modules`, `@App` or `@ViewModels`: everything depends on them, so one upward import makes every consumer depend on a feature. If a low layer needs something from a high one, the high layer passes it in.

- **Cross-layer import: the alias** (`@Core/...`). **Same layer: relative.**
- **Gateway instances are imported by ViewModels only.** A **type** import from `@Gateways/*` is fine anywhere (a component may name `TClient`).
- **A ViewModel does not import another ViewModel's store.** Two stores that must agree are combined by the screen, or one action takes the other's result as an argument. Reaching sideways turns state into a web nobody can reset. The session ViewModel is the one sanctioned reach: sign-out calls the other stores' `reset()`.
- `fetch` appears once, in `Gateways/_Shared/Request/AppTransport.ts`.
- No `index.ts` barrels: import the file you mean.

Enforced by ESLint in `fe/eslint.config.js`: `no-restricted-imports` (gateway values outside `ViewModels/`, upward imports from `Core/` and `Gateways/`), `no-restricted-globals` (`fetch`), `check-file/no-index`. The sideways-ViewModel rule is enforced by review.

## Views carry no logic

A component selects state, calls an action, and renders. It does not fetch, derive, filter, sort, turn a status into a label, or decide which of several states to show from raw fields.

```tsx
const pages = usePagesViewModel((s) => s.pages);
const status = usePagesViewModel((s) => s.status);
const fetchPages = usePagesViewModel((s) => s.fetchPages);
```

- A derived value is a function in the ViewModel's `Services/` that takes state as an argument, and the ViewModel exposes the result. A condition like "show the empty state" is a field of the store, not an expression in JSX.
- Local `useState` is for **input that nothing else needs**: an open popover, the text in a box before it is submitted. If a second component or an action needs it, it moves to the ViewModel.
- Presentational components in `Modules/_Shared/` take props and know no domain noun and no store.

## Why

One place decides each thing. The view is cheap to replace, the ViewModel is testable without rendering, and the gateway is the only code that knows the wire format. Each layer that reaches around its neighbour creates a second owner of the same state, and the two disagree intermittently, which is what makes it expensive.
