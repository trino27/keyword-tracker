---
name: error-display
description: Where each failure of this app is shown - page level, section level, field level - and why a ViewModel that reads and writes keeps a failed read and a refused write in separate fields. Use when adding a screen, a form or a write action, or when error rendering is inconsistent.
---

# Frontend Error Display

Every user-visible failure is shown at exactly one of **three levels**, by a shared component in `Modules/_Shared/`. Never interpolate a raw `{error}` into a `<span>`, and never invent a fourth level.

```
What failed?
├── The whole route (a render crash, an unexpected throw)
│     -> page level: the route's `errorComponent`, and an error boundary at the root
├── One section's read, the rest of the screen works
│     -> section level: a quiet message in that section, with a retry beside it
└── A write the user just attempted, or a field
      -> field / form level: next to the control that produced it
```

| Level | Shown by | Source of the text | Retry |
| --- | --- | --- | --- |
| Page | route `errorComponent` / root boundary | the thrown error through `describeError` | reload / "try again" |
| Section | a section error component | the ViewModel's `error` | the screen's own button calling the same `fetch*` |
| Field / form | a field message, or a form-level error block | the ViewModel's `actionError`, or the zod field errors | the user edits and resubmits |

The text always comes from `describeError` (`practices/fe/react/error-handling`); the component only places it.

## One field per consequence

A ViewModel that both reads and writes needs **two** error fields:

- `error`: the read failed, **there is nothing to show**.
- `actionError`: what the user just asked for did not happen, **the screen is intact**.

One field for both makes every refused button erase the page:

```ts
// WRONG: one field, two meanings.
addClient: async (input) => {
	try { /* ... */ } catch (e) { set({ error: describeError(e) }); } // the client list is now hidden
},
```

The page reads `if (error) return <SectionError ... />`, correct for a failed read and wrong for a refused write, because the list is still in state and still valid.

1. **Only `error` may gate the page body.** `actionError` renders next to the control that produced it, and the rest stays on screen.
2. **A refused write never touches what was read**: no `set({ pages: [] })`, no `status: "loading"` left behind.
3. **Clear `actionError` on the way in**, in the `fetch*` that opens the screen and in `reset()`, and clear it at the start of the next attempt. An uncleared one follows the user to the next screen and appears over content it has nothing to do with.

Add `actionError` and `clearActionError` before the first button lands; retrofitting means visiting every action.

## Rules

- **Expected refusals are not errors of the page.** A duplicate website (409) is a message at the form; a client that is not yours (404) is a not-found view.
- **401 is not displayed**: it signs the user out and redirects.
- **A failed `refresh*` is silent** (logged); the stale rows stay.
- **A section error has a retry only if the screen supplies it**; the error component itself stays information-only.
- **A page-level component never sits inside a screen body**, and a section-level one is never the route `errorComponent` (too quiet for a whole-route failure).
- **Errors never show a stack, a status code or a URL.** The original error goes to the console.

## When adding a screen

1. The route declares an `errorComponent`. Always.
2. Each section that loads gates on the ViewModel's `status` and shows `error` at section level.
3. Each form shows `actionError` and the zod field errors at form level (`practices/fe/react/forms-and-validation`).
4. If the ViewModel also writes, give it `actionError` + `clearActionError` first.

Related: `fe/skills/data-retrieval` (where `error` is produced).
