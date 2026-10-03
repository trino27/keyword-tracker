---
name: orchestration
description: When to call a subagent, which of the five agents (planner, scout, system-architect, test-runner, qa) does what, which verification steps the existing checks (lint, tsc, tests in hooks and CI) already cover, and the two cost rules (batch to find out, isolate to be sure; model by fact type). Read before delegating work, and before deciding to skip it.
---

# Agent orchestration — which agent, how many, and what a check has already paid for

The main session writes the code, the tests, the docs and the infrastructure changes. Five
subagents exist for the steps where a separate context earns its cost:

| Agent | Does |
| --- | --- |
| **planner** | Writes the plan: creates the OpenSpec change (`proposal.md`, `design.md`, specs, `tasks.md`) once the decisions exist. Never decides, never writes application code |
| **scout** | Finds files, patterns, interfaces and local conventions before coding. Read-only |
| **system-architect** | Reviews architecture, cross-module and `be`↔`fe` contracts, security. Read-only |
| **test-runner** | Runs lint, typecheck, tests and build for the affected workspaces. Writes nothing |
| **qa** | Read-only final review of the finished work against the request, conventions and the checks |

Their `description:` is loaded into every session; this file says WHEN, not what each is.

---

## 1. The threshold

Delegate in a planned sequence (§2) when the task **touches ≥2 workspaces, or creates 3+ new
files, or changes something that cannot be undone** (a migration, a destructive data operation, a
change to what one user may see of another's data).

Below that, the main session works directly and calls a single agent when §3 says so. Skip agents
entirely for a single-file change, a CSS-only edit, a config tweak, a markdown typo, or pure
exploration.

**The threshold is about coordination cost, not difficulty.** A hard change inside one module is
cheaper to do than to schedule; an easy change spread across `be`, `fe` and `packages/contracts`
is not.

---

## 2. The sequence

Steps are NAMED, never numbered.

**Design, when the shape is not decided yet** — a new table/enum/wire field, a lifecycle or
authorization change, ≥2 workspaces. Run `/plan-interview` in the main session (only it can
converse), then hand the decision log to **planner**, which creates the OpenSpec change it drives.
Skip when the decisions already exist.

**Context** — **scout** for files, interfaces and local patterns before changing status logic,
ownership checks, crawl logic or cross-module behaviour. Questions go in ONE call (§5).

**Confidence strategy** — before writing code, state the proof: the focused test to add or update,
the existing checks to run, and any grep or manual invariant that pins the behaviour.

**Write the code and its tests** in the main session. A new backend business service, listener,
validator or handler gets a colocated spec (`practices/be/nestjs/testing-patterns/SKILL.md`).

**Review** — **system-architect** after backend code, `be`+`fe` contract changes, or cross-cutting
refactors. Separate call, fresh context (§5).

**Run checks** — **test-runner** after any code change, or run `pnpm lint`, `pnpm typecheck`,
`pnpm test` directly.

**Verify** — **qa** after everything else passes, when §4 says the change is not already covered.

**Record** — the main session updates the docs the change touched (a `*_MODULE.md`, the OpenSpec
spec, a skill) in the same change: business logic, lifecycle invariants, events, errors, auth
rules, cross-module contracts.

Logic shared by `be` and `fe` lives in `@app/contracts`, never duplicated.

---

## 3. Calling one agent directly

| Agent | Call directly when |
| --- | --- |
| **planner** | The decisions exist and a plan needs writing or correcting. Not for deciding (`/plan-interview`) |
| **scout** | Exploring unfamiliar code, or finding where a pattern is used |
| **system-architect** | A contract, ownership rule or module boundary changed |
| **test-runner** | After any `be` or `fe` edit, to verify compilation and tests |
| **qa** | The work is done and you want an independent read against the request |

---

## 4. What the existing checks already cover — and what nothing does

What exists: **ESLint** (type-aware, per workspace, with the boundary rules in
`be/eslint.config.mjs` and the `fe/` ESLint config), **`tsc`**, **Jest** (`be`), **Vitest** (`fe`),
the husky `pre-commit` (branch guard + lint-staged prettier), the `pre-push` hook (lint +
typecheck + tests) and the GitHub Actions CI (lint, typecheck, test, build). Everything they check
is verified on every push by something that cannot forget. An agent that re-checks it spends a
large fixed cost to reach the same verdict less reliably. So the question before scheduling `qa`
is not "is this careful enough" but **"is this already covered".**

| Step | Is it already covered? |
| --- | --- |
| **test-runner** | Fully. It buys speed, not coverage |
| **qa** — naming, import direction, layer boundaries | Largely: the ESLint boundary rules. Not "is this what was asked for" |
| **system-architect** — `be`↔`fe` contract | Types only (`tsc` over `@app/contracts`). Semantics are uncovered |
| Tests for new code | No: nothing fails on a missing spec |
| Docs matching the code | Not at all. Only a test pinned to a spec requirement fails when behaviour drifts (`openspec/README.md`) |

**test-runner — fully covered.** Lint, `tsc`, the unit suites and the build run in `pre-push` and in
CI. The step exists to get the answer FASTER than CI.

**qa — covered except intent.** The ESLint rules refuse a Nest `Logger` import, a layer-direction
violation, and DB access outside `repositories/**` and `services/domain/**`. Whether the change is what the user
asked for is read by nothing.

**system-architect — types are covered, meaning is not.** `tsc` catches a type mismatch in
`@app/contracts`. A semantic mismatch behind matching types, and any value not routed through
`@app/contracts`, are invisible.

### What follows

- **A verification step whose whole job is covered is redundant.** Run the check and skip the agent.
- **A verification step with a real uncovered part is not optional**, and green hooks are not
  evidence about it. Ownership checks (a user must never reach another user's data) and
  cross-module contracts are checked by nobody but an agent or a person.
- **`scout` is not verification.** Nothing else tells you what a module forbids before you write.
- **`system-architect` stays on contract and cross-module changes**, because the semantics behind
  matching types are exactly what it reads.

---

## 5. Batching and isolation — how MANY agents, not which

Every subagent pays a fixed cost before it does anything: the project instructions, the agent
roster and the skill roster are loaded into its context.

**Batch investigation into one call.** `scout` takes several questions in one invocation. The floor
is paid once and each further question costs a fraction of an isolated one.

**Never batch verification.** `system-architect`, `test-runner` and `qa` stay separate calls in
fresh contexts. Their value is independence: a reviewer sharing a context with the writer has
stopped being a review.

Rule of thumb: **batch to find out, isolate to be sure.**

---

## 6. Model by fact type, not by task size

- Locating, enumerating, mapping → a small model, docs-first (`.claude/agents/scout.md`).
- Judging whether a construct is load-bearing, or designing a contract → a stronger model,
  code-first; docs for prohibitions and decisions, not for mechanics.
- For a strong model a self-contradicting document is **worse than no document**: it confidently
  overrides a reading of the code that would have been correct.

---

## 7. What this file does not settle

The threshold in §1 is a judgement, not a measurement. Treat it as a default to argue with: when a
task below it would clearly benefit from an independent review, call the reviewer.
