# Frontend practices

Conventions that belong to a **frontend technology rather than to one app**. Today the only
frontend is `fe`: a React 19 + Vite single-page app behind a login, built as MVVM: zustand
ViewModels, gateway classes, TanStack Router, zod, CSS Modules and Vitest.

## The rule for putting something here

**Is the rule about the TECHNOLOGY, or about one app?** A convention for how a zustand ViewModel
drops a superseded answer would hold unchanged in a second React SPA; a rule about the pages table
or the rank-history chart would not. Those belong in `fe/skills/`.

Waiting for a second consumer is the wrong test: it means discovering, at the moment the second
frontend appears, that the conventions are all filed under the first one's name. See
[`practices/AGENTS.md`](../AGENTS.md) for the repository-wide criterion.

| path | for |
| --- | --- |
| `practices/fe/<topic>/` | true of any frontend in this repository |
| `practices/fe/react/<topic>/` | true of any React SPA |

## What is here

| skill | what it owns |
| --- | --- |
| [react/mvvm-layers](react/mvvm-layers/SKILL.md) | the layers (App, Modules, ViewModels, Gateways, Core), the direction imports may point, views without logic |
| [react/viewmodels-with-zustand](react/viewmodels-with-zustand/SKILL.md) | store shape, action names, selectors, services, no module state, superseded requests, reset |
| [react/gateway-classes](react/gateway-classes/SKILL.md) | the transport, the base class, zod-parsed responses, the registry, `ApiError`, discriminated responses |
| [react/routing-and-auth-guards](react/routing-and-auth-guards/SKILL.md) | the code-based route tree, the guard in a pathless layout route, search params as state, 401 handling |
| [react/forms-and-validation](react/forms-and-validation/SKILL.md) | where form state lives, zod on submit, mapping backend 400 / 409 to fields |
| [react/error-handling](react/error-handling/SKILL.md) | `ApiError`, one `describeError`, expected vs unexpected, error boundaries per route |
| [react/testing](react/testing/SKILL.md) | what Vitest and Testing Library cover, spying on gateway prototypes, resetting stores, placement, timezone |
| [react/path-aliases](react/path-aliases/SKILL.md) | one alias per layer; alias across layers, relative inside one |
| [react/react-best-practices](react/react-best-practices/SKILL.md) | the Vercel performance rules for browser code and the React Compiler caveats |
| [react/composition-patterns](react/composition-patterns/SKILL.md) | composition over configuration: compound components, explicit variants, React 19 APIs |

## What stays in `fe/skills/`

A skill that carries a rule of one app is worse when moved here than when left behind: an
implementer in a second frontend reads it as binding. `fe/skills/` therefore holds the app's own
rules and only POINTERS to what is here, never a shortened restatement. A partial second copy
makes a reader stop at it and invent the rest.
