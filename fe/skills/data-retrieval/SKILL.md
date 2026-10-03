---
name: data-retrieval
description: How a screen of this app gets data - a ViewModel action on mount or route entry, the idle/loading/ready/error states, sharing an in-flight request, dropping superseded answers, and refreshing after a mutation. Use when adding a screen that loads data, a filter or pagination, or a write that changes what a list shows.
---

# Frontend Data Retrieval

There is no query library and no cache layer beside the stores. A screen's data is **a ViewModel field filled by a ViewModel action**; this skill is how that action behaves. How a store is written is `practices/fe/react/viewmodels-with-zustand`.

## Rule 0: every request is issued by a ViewModel

Gateways are called from `ViewModels/` and nowhere else: not from a component, a guard, a hook or a route. A guard that needs data calls a ViewModel action. One owner per endpoint means one error contract, one loading contract, and one place that shows how often it is hit. Enforced by ESLint (`no-restricted-imports` on gateway values outside `ViewModels/`); type imports are fine.

## Phases

| Moment | Action | What it does |
| --- | --- | --- |
| Screen mounts, or its route params / search change | `fetch*` | sets `status: "loading"`, calls the gateway, writes `ready` or `error` |
| User asks again (retry button, change of date range) | the same `fetch*` with the new argument | as above |
| After a mutation | `refresh*` | calls the gateway, **no spinner**, replaces the rows in place |
| Data was already handed over (the mutation's response) | `apply*` | merges into state, no request |

A screen calls its `fetch*` from an effect keyed on the arguments it depends on (the route's validated search, the client id), or from the route's `beforeLoad` when the screen must not render without it. Either way the **action** is the unit; the trigger is one line.

## Status contract

Every ViewModel that loads data exposes:

```ts
status: "idle" | "loading" | "ready" | "error";
error: string | null; // set with status "error", cleared by the next fetch
```

- `fetch*` sets `loading` and clears `error`. `refresh*` does not touch `status`.
- "Empty" is `ready` with no rows; the ViewModel exposes it as a field (`isEmpty`) rather than the view comparing lengths.
- The view branches in one fixed order: `loading` -> `error` -> empty -> rows. A refresh error is logged and the stale rows stay (stale-while-error); it is not turned into a page error.
- Keep the previous rows while a changed filter reloads only if showing them is truthful; otherwise clear them in the same `set` that flips to `loading`.

## One request per question

Calling the same `fetch*` twice before the first answers must not send two requests, and must not resolve the second caller early.

- **Share the in-flight request**: keep the promise in the store (or in a closure inside `create`) and return it to the second caller when the **arguments are the same**. An early `if (status === "loading") return` resolves the second caller instantly while the request still runs, so a guard that awaited it renders the screen before there is data.
- **A different argument is a different question.** It starts its own request and takes ownership of the state; it does not join the old one.
- A forced refresh (`refresh*` after a write) issues its **own** request even if one is in flight: the one in flight may have been sent before the write and would answer with pre-write data. It publishes itself as the current request so later callers join it.

## Superseded answers

A response is written only if its request is still the latest one: hold the request's identity, check it after the `await`, and drop the answer otherwise (`viewmodels-with-zustand`). This is what makes changing the date range on a rank-history chart twice in a row safe: the slow first answer cannot overwrite the second.

## Refresh after a mutation

A write is single-shot (never retried by hand: a retry can write twice). After it succeeds, the store that owns the list is brought up to date by one of:

1. **`apply*` from the response**, when the write returns the new row (adding a client returns it; insert it).
2. **`refresh*`** of the list, when the change has effects the response does not carry (a crawl run adds pages over time; re-read the list).

The action that performs the write calls the refresh itself; a component never chains "write, then fetch". If the write lives in a different ViewModel than the list, the screen that shows both calls the second action after the first resolves; ViewModels do not import each other.

## Anti-patterns

| Anti-pattern | Instead |
| --- | --- |
| A gateway call in a component, hook or guard | a ViewModel action |
| `isLoading: boolean` plus a stale-answer `if` | `status` and request identity |
| A module-level `let request: Promise` shared by stores | a promise held in the store or in a closure inside `create` |
| `fetch*` that early-returns while loading | return the shared in-flight promise |
| Spinner on every refresh | `refresh*` is silent |
| A page-level error for a failed refresh | log it, keep the rows |
| Deriving "empty" or a label in JSX | a field or service in the ViewModel |
| A hand-rolled retry around a write | none; the user retries |
