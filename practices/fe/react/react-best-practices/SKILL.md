---
name: react-best-practices
description: React performance guidelines adapted from Vercel Engineering for a browser-only React 19 + Vite app. Use when writing, reviewing, or refactoring components for bundle size, rerender behaviour, rendering, and JavaScript performance.
license: MIT
metadata:
    author: vercel
    version: "1.0.0"
---

# React Best Practices

Performance rules for React code in a client-rendered single-page app: components, hooks and the
helpers they import. How data reaches a screen is `fe/skills/data-retrieval`; this skill is
about what runs in the browser.

## React Compiler caveat (read first)

When the React Compiler is enabled (`babel-plugin-react-compiler` in the Vite React plugin), the
compiler auto-memoizes most components and derived values, so it **supersedes the manual-memo
`rerender-*` rules** (`rerender-memo`, `rerender-memo-with-default-value`,
`rerender-simple-expression-in-memo`, and similar). Do not apply those by default; read them only
when you have proven the compiler fails on a specific, measured case (a bail-out, a non-serialisable
prop identity). The `async-*`, `bundle-*`, `js-*` and most `rendering-*` rules are unaffected.

**Sharp edge 1: hidden state in a call.** Auto-memoization is keyed on what a call _mentions_. A
function whose result depends on state it reads internally (a method reading a module-level store)
is computed once and cached for the component's lifetime, so the screen repaints a stale value.
Pass such state in as an argument.

**Sharp edge 2: a component declared inside another function.** The compiler outlines callbacks
(effect bodies, `.map()` renderers) to module scope. If the component closes over a local of the
enclosing function, the outlined copy references a binding that does not exist there: a
`ReferenceError`, or a callback that silently never fires. Declare components at module scope. Where
a test genuinely needs a local one, open it with the `"use no memo"` directive and say why.

**Render-count assertions must expect bail-outs.** With the compiler on, a child whose props are
unchanged does not re-render even though its parent did. Assert the observable effect and reserve
render counts for isolation claims (siblings did NOT render). Run Vitest through the compiler too,
so component tests see the program the app runs.

## Rule categories

| Priority | Category | Impact | Prefix |
| --- | --- | --- | --- |
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Browser Event Listeners | MEDIUM-HIGH | `client-` |
| 4 | Re-render Optimization | MEDIUM | `rerender-` |
| 5 | Rendering Performance | MEDIUM | `rendering-` |
| 6 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 7 | Advanced Patterns | LOW | `advanced-` |

Each rule is one file in `rules/` with an explanation, an incorrect and a correct example. Read the
file, not just the name: `ls rules/` lists them, and `rules/_sections.md` orders the categories.

## Not here

Rules that assumed an external fetching library (SWR deduplication) or server rendering are not
vendored. Fetching, in-flight sharing and superseded answers follow
`practices/fe/react/viewmodels-with-zustand/SKILL.md`; lazy-loading a heavy screen uses `React.lazy` with `Suspense`, or the router's lazy route support.
