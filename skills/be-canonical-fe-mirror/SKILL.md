---
name: be-canonical-fe-mirror
description: Pattern for business rules that must stay identical on both be and fe. Use when the backend returns a computed value from an API AND the frontend recomputes the same value locally (live recalc while editing, a different range, optimistic UI). First split the rule over primitives into `@app/contracts`; only what cannot be shared becomes a canonical backend service plus a named frontend mirror module with locked-step JSDoc and identical parity fixtures.
---

# BE-Canonical + FE-Mirror Pattern

## When to use

Apply this pattern when a business rule satisfies **both** conditions:
1. The backend computes and returns the value from an API endpoint.
2. The frontend also needs to recompute the same value locally — for optimistic UI, live-updating screens, or per-item display without a round-trip.

If only one side needs the value, a plain domain service (be) or a plain service (fe) is sufficient. This pattern is specifically for rules that **must stay identical** across both sides.

*Illustrative example used below:* the **rank change** of a page — the difference between its
latest and the previous rank snapshot's position. The backend returns it in the page list; the
frontend recomputes it when the user narrows the date range on the detail screen.

### Prefer `@app/contracts` for pure shared value-objects

If the shared artefact is a **value-object, enum, constant, or contract** that is simply
imported on both sides (not a domain rule that is independently *computed* on each side),
put it in `packages/contracts/` instead of maintaining a mirror pair:

| Artefact type | Where it goes |
| --- | --- |
| Domain enum (`SeoIssueSeverityEnum`, …) | `@app/contracts` — `packages/contracts/src/domain/<domain>/` (one `<name>.enum.ts` per enum) |
| A wire shape both sides parse (`IHealthResponse`) | `@app/contracts` — one `<name>.interface.ts` per shape |
| A constant both sides use (`API_PREFIX`) | `@app/contracts` — `<name>.constant.ts` |
| A domain rule recomputed locally on fe | **This pattern** — be-canonical-fe-mirror, after the split below |

#### How `packages/contracts` is laid out: DOMAIN, then KIND

```
src/domain/<domain>/<name>.enum.ts          one enum per file
src/domain/<domain>/<name>.constant.ts      a const and the type DERIVED from it
src/domain/<domain>/<name>.interface.ts     one wire shape per file
src/domain/<domain>/<name>.type.ts          one standalone type alias per file
src/domain/<domain>/<name>.util.ts          ONE FUNCTION PER FILE
src/index.ts                                the barrel
```

**A function never shares a file with a constant, and two functions never share a file.** The
one thing that stays together is a const and the type derived from it (`RankSourceEnum` + its
type) — that pairing is the `as const` idiom, and splitting it would break the very style this
package follows.

**There is exactly ONE barrel, `src/index.ts`, and it lists every file explicitly.** The package
declares one entry point (`.`): that is its whole public surface, and **no consumer may deep-import
a path below it**. Moving a file inside `src` can therefore never break a consumer.

**A TESTED unit gets its own folder holding exactly two files — the unit and its spec**
(`utils/rank-delta/{rank-delta.util.ts, rank-delta.util.test.ts}`). Untested files stay flat. This
is `practices/be/nestjs/testing-patterns/SKILL.md`'s folder-per-tested-unit rule, applied here.

**Both workspaces consume the BUILT package** (`dist`, `dist-cjs`), so after a change in
`packages/contracts` run its `build` before typechecking or testing `be` or `fe` — a stale `dist`
makes a correct change look broken, and a broken one look fine. The root `typecheck` and `test`
scripts do this first.

Verify a restructure by diffing the EXPORT SURFACE, not by trusting a green `tsc`: a type
dropped from a barrel does not fail every consumer. Compare the declared names in
`dist/**/*.d.ts` against the same list from `HEAD`.

### Split the rule before you mirror it

"The backend computes it, the frontend recomputes it" is **not** enough to justify a mirror pair.
Before writing one, split the rule in two:

| Part | Where it goes |
| --- | --- |
| The computation expressed over **primitives** (numbers, strings, counts) | `@app/contracts` — one implementation, both sides import it |
| The part that reads **side-specific types** (a Drizzle row, a zod-parsed DTO) | Stays on its own side, feeding primitives into the shared function |

Rank change, split: `computeRankDelta(previous: number | null, current: number | null): number | null`
is arithmetic over primitives and goes to `@app/contracts`. Reading the two latest snapshot rows
stays in the backend repository; reading the two points of the chart series stays in the
frontend component or hook. Each side feeds primitives into the one function.

Most "identical business rules" survive this split entirely, and then there is no mirror to keep
in lockstep — which is strictly better than any amount of JSDoc discipline. Treat the pattern
below as the fallback for a rule that genuinely cannot be expressed over primitives.

---

## The Five Rules

### 1. The backend is the canonical source of truth

Implement the rule in a dedicated domain service class:

```
be/src/modules/<module>/services/domain/<module>-<rule>-domain.service.ts
```

- Class must be `@Injectable()`, registered in the module's `providers` array.
- Methods must be pure (no I/O, no DB calls, no event emission).
- All backend code that needs the rule injects and calls this service — never inline the formula at a call site.

### 2. The frontend mirrors with a parallel pure module

Implement the same rule in:

```
fe/src/Core/Helpers/<Rule>/<rule>.ts
```

A business rule is **behaviour**, so on the frontend it lives in a pure module, not inside a
component. It sits in `Core/Helpers/` when a view and a ViewModel both need it, or in the ViewModel's
`Services/` when only one does (`fe/skills/folder-structure/SKILL.md`).

- Pure exported functions: no store access, no gateway, no I/O.
- Same function names and same algorithm as the backend.

### 3. Mirror commitment in JSDoc on both sides

Each file's top-of-file JSDoc must:
- State the business rule in one sentence.
- Name the counterpart with its full workspace-relative path.
- Include the phrase "MIRRORS" (fe file) or state the fe mirror path (be file).
- Include an explicit lockstep clause: "Any change to the rule MUST be made on both sides in lockstep."

Backend shape:
```ts
/**
 * Owns the business rule: "<the rule, in one sentence>".
 *
 * All <module> computations that depend on this rule MUST go through this
 * service. The frontend mirrors it at
 * fe/src/Core/Helpers/<Rule>/<rule>.ts
 *
 * Any change to the rule MUST be made on both sides in lockstep.
 */
```

Frontend shape:
```ts
/**
 * Owns the business rule: "<the rule, in one sentence>".
 *
 * MIRRORS the canonical backend service:
 *   be/src/modules/.../<xxx>-domain.service.ts
 *
 * Any change to the rule MUST be made on both sides in lockstep. The
 * matching unit tests use identical fixtures so the two stay in sync.
 */
```

If you find yourself writing these two comments, re-read "Split the rule before you mirror it"
above — the JSDoc is the fallback, not the goal.

### 4. Parity-tested fixtures

Both unit test files must use **identical inputs and expected outputs** for the contract methods.

```ts
// Same assertions in BOTH the be spec (Jest) AND the fe test (Vitest)
expect(service.computeRankDelta(8, 5)).toBe(3);      // moved up three places
expect(service.computeRankDelta(null, 5)).toBeNull(); // no previous snapshot
expect(service.computeRankDelta(5, 5)).toBe(0);
expect(service.computeRankDelta(5, null)).toBeNull(); // dropped out of the tracked range
```

If a fixture fails on one side after a rule change, the other side is also wrong — update both together.

Nothing links the two files mechanically: **parity is held by review and by these identical
fixtures.** That is the reason to prefer the split.

### 5. One narrow rule per service

Do not grow these services into general-purpose utility libraries. Each service owns exactly one business rule. If a second independent rule emerges, create a second service pair.

---

## Case study — a primitive that had to be shared: the date range

The user is in Toronto and snapshots are stored in UTC, so "the last 30 days" has to be turned
into a UTC instant range, and the same conversion decides which snapshot belongs to which
calendar day on both the chart and the list. Two implementations — one on each side — would put a
snapshot taken at 23:30 Toronto time on different days depending on who rendered it.

`@app/contracts` therefore owns the conversion over primitives (an ISO date string and a zone
name in, a pair of UTC instants out), and each side feeds it what it holds: the backend a query
parameter, the frontend a picker value. Three properties are why this is a CONTRACT value and not
a backend detail:

- **one codec, both directions** — the frontend never parses or shifts the date by hand;
- **a template-literal or branded type** (a `TIsoDay`, not a bare `string`) keeps a UTC instant
  from being passed where a local day is expected, at compile time on BOTH sides;
- **full words in wire values** (`'last_30_days'`, not `'l30'`): the value appears in logs and
  query strings, where self-description is worth more than a few bytes.

Placement follows the table at the top — it is a value BOTH sides construct and compare, so it is
a contract primitive; the RULES about it (snapshots are stored in UTC, a range is inclusive of
its end day) stay backend-side.

## Anti-patterns

| Anti-pattern | Risk |
| --- | --- |
| Inline formula at the call site on either side | Rule diverges silently when one call site is updated and others are missed |
| Rule only on fe | Any other consumer (a report, a script) computes a different value |
| Rule only on be | Live-updating UI requires a round-trip; optimistic display is impossible |
| Different test fixtures on each side | Fixtures drift → one side passes with wrong numbers and nobody notices |
| Growing the mirror into a utility grab-bag | Hard to keep in sync; loses single-responsibility |

---

## Checklist when implementing a new mirror pair

- [ ] **First**: confirmed the rule cannot be expressed over primitives in `@app/contracts` — if it can, stop here and put it there instead
- [ ] Backend domain service under `services/domain/` — pure methods, `@Injectable()`
- [ ] Backend spec with parity fixtures
- [ ] Frontend pure module (`Core/Helpers/` or the ViewModel's `Services/`)
- [ ] Both files have JSDoc naming the counterpart + lockstep clause
- [ ] Both spec/test files assert the same inputs → outputs
- [ ] Backend service registered in the module's `providers` array
- [ ] The module's `*_MODULE.md` (if it has one) updated with the new rule description


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable.

<!-- invariant: TZ-002 -->
**A calendar range in the user’s zone becomes a half-open UTC interval, and the conversion exists once, in `@app/contracts`, for both sides.** Pinned by `packages/contracts/src/domain/time/day-range-to-utc/day-range-to-utc.util.test.ts` -> "the spring-forward day in Toronto is 23 hours", "the fall-back day in Toronto is 25 hours", "Tokyo starts its day the evening before in UTC"; `be/test/e2e/pages-history.e2e-spec.ts` -> "the fall-back day in Toronto (25 h) holds exactly its own noon point". "Exists once" is NOT pinned by a lint rule — no rule bans a second implementation. Specified in `openspec/specs/_root/time-zones/spec.md`.
