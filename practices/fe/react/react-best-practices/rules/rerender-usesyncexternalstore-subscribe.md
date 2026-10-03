---
title: Stabilise the useSyncExternalStore subscribe callback
impact: MEDIUM
impactDescription: one store re-subscription per render, per connected component
tags: react, usesyncexternalstore, subscription, rerender, performance
---

## Stabilise the `useSyncExternalStore` subscribe callback

React keeps `subscribe` in an effect whose dependency is the function itself. A
new identity each render means React tears the subscription down and rebuilds it
every single render — silently, with identical rendered output.

**Incorrect (re-subscribes on every render):**

```tsx
return useSyncExternalStore(
  (onStoreChange) => store.subscribe(() => { /* ... */ onStoreChange() }),
  getSnapshot,
)
```

**Correct (subscribes once per mount):**

```tsx
const subscribe = useCallback(
  (onStoreChange: () => void) =>
    store.subscribe(() => { /* ... */ onStoreChange() }),
  [],
)

return useSyncExternalStore(subscribe, getSnapshot)
```

`[]` is correct only when the body reads nothing render-scoped. Route every
changing value through a ref (`selectorRef.current`, `trackedKeysRef.current`) —
so the deps array has nothing left to
capture.

## Proving it

Not observable from rendered output, so assert on the subscription lifecycle:
count calls to the REAL store's `subscribe`: an unstable deps array resubscribes on every render (200 renders, 201 subscriptions) where a stable one subscribes once.

Watch the probe: spying on a hook's re-exported `.subscribe` property does not
see a factory that closes over `store.subscribe` directly — that test passes
against broken code.
