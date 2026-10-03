# `openspec/` — the requirements, made addressable

Rules of conduct are enforced by ESLint and by tests. What a system MUST BE TRUE of — a user can
never reach another user's client, a rank snapshot is stored in UTC, a crawl takes at most the
first 15 posts — is usually written nowhere an agent or a reviewer can find it, carries no
permanent identifier, and names no test that pins it.

OpenSpec supplies the format; this repository supplies the identifier and the pinning. The CLI is
`@fission-ai/openspec`, run as **`pnpm exec openspec`** (the root `package.json` also exposes it as
`pnpm openspec`).

---

## 1. The reason — and the reason this is NOT the reason

**The reason is the corpus format.** A requirement gets a permanent id, so an invariant in a
module document can carry that id, and a reader can ask whether the two still agree.

**The reason is not defect prevention.** Documentation explains; it does not prevent. A rule that
must not break needs a lint rule or a test (`skills/agent-docs/PLACEMENT.md` §2). So no document
produced here may claim OpenSpec reduces defects. Where a benefit is claimed it is
**addressability** (an id a test name and a commit message can cite) or **reviewability** (a
requirement delta is a durable, diffable artefact somebody can approve without reading code).

## 1a. What belongs here, and what does not

**A requirement needs a capability whose STATE could be wrong.** If the fact is about an ACTION
somebody must not take, it is a rule and belongs in an ESLint config or a test; if it is a way of
doing something well, it is a skill (`skills/agent-docs/PLACEMENT.md` §2).

**A change with no requirement is still a change**, declaring `skip_specs: true` in its
`.openspec.yaml` so no delta file is written. A migration, a refactor, a tooling move. There is no
carve-out, and the reason is which way the mistake costs: a change nobody needed is ceremony, paid
once and visible on the day; a requirement that never got written is an invariant nobody will ever
find.

## 2. Two directories, opposite contracts

| Directory | What it holds |
| --- | --- |
| `specs/` | approved truth: one file per capability, at the MIRRORED path |
| `changes/` | work in flight: a proposal, its design, its tasks, its spec delta |
| `changes/archive/` | folded-in changes |

A proposal in `changes/` legitimately names classes and paths that do not exist yet; approved
truth in `specs/` does not — a dead name there is inadmissible. Nothing checks this mechanically,
so review does: every class name and file path written in a spec must resolve.

### The path of a capability IS the path of what it specifies

```
be/src/modules/client/                              the module
openspec/specs/be/src/modules/client/spec.md        its requirements
fe/src/<area>/                                      a frontend area
openspec/specs/fe/src/<area>/spec.md                its requirements
```

Strip `openspec/specs/` and you have the code path. That is the whole convention, and it gives:

- **A reader orients without a lookup.** Somebody who knows the module tree knows where its
  requirements are, and the reverse.
- **Drift is decidable.** A spec whose directory no longer exists lost its subject; a module that
  moved without its spec left the spec behind. Move them together with `git mv`.

**The requirement id does NOT contain the path**, and that is deliberate: `CLIENT-014` is citable
from a module document, a test name and a commit message, and it survives a module move. The
mirror makes the corpus navigable; the id makes it addressable.

**`specs/_root/<capability>/spec.md` mirrors nothing**, for a requirement that is:

1. **cross-cutting** — it belongs to no one directory (data isolation between users, the UTC
   storage rule, the crawl's bounds); or
2. **a subject whose directory cannot be spelled** — a path segment starting with a dot is
   skipped by globs that read the tree, so a spec filed under one is invisible rather than
   refused. CI behaviour (`.github/`) goes under `_root/ci-pipeline/` for that reason.

**`changes/` stays FLAT.** A change directory is `changes/<name>/`, never a mirrored path. A
proposal is not located in code — it routinely spans workspaces. Only the spec DELTA inside it
mirrors, because a delta names capabilities and a capability is a path:

```
openspec/changes/rank-range-in-toronto-time/
  proposal.md  design.md  tasks.md
  specs/be/src/modules/rank/spec.md      <- the delta mirrors
```

## 3. The requirement id

```md
### Requirement [RANK-014]: a snapshot belongs to the day it was taken in the user's zone

#### Scenario: a snapshot taken late in the evening in Toronto
- **WHEN** a snapshot is stored at 23:30 Toronto time, which is 03:30 UTC the next day
- **THEN** a daily chart for the user shows it on the Toronto day, not the UTC day
```

`<CAP>-<NNN>`: an uppercase capability abbreviation, three digits. **Authored, never derived.
Append-only, never renumbered, never reused.** The wording after the colon is free to change; the
bracketed id is not.

**Why it is authored.** An id derived from the requirement's *wording* is stable across runs, not
across edits: reword the requirement and the invariant already deposited in a module document
loses its backing requirement in silence. That is exactly the drift the id exists to prevent.

**A heading with no `[ID]` is a defect.** Nothing parses `specs/` mechanically here, so a
reviewer is the only thing that notices; do not merge a requirement without one.

### 3a. A DELTA writes the heading differently, and that is a decision

A change's spec delta uses the form the TOOL parses, not the one above:

```md
## ADDED Requirements

### Requirement: RANK-900 — a snapshot belongs to the day it was taken in the user's zone

A snapshot MUST be shown on the calendar day it was taken in the user's zone.

#### Scenario: a snapshot taken late in the evening in Toronto
- **WHEN** a snapshot is stored at 23:30 Toronto time
- **THEN** a daily chart for the user shows it on the Toronto day
```

Three differences, and each one is forced: **the id comes AFTER the colon**, there is a **body
line** between the heading and the first scenario, and that line **should carry `MUST` or
`SHALL`**.

**Why the two forms are not reconciled.** The tool's own parser — the one `openspec validate`,
`show --deltas-only` and archive-folding all use — returns no requirement blocks for a heading in
the `[ID]:` form, so a delta written that way is refused outright ("Delta sections were found,
but no requirement entries parsed"). Conforming `specs/` to the tool's shape would mean rewording
every heading and adding a body line that restates it. So the delta speaks the tool's language on
the one path where the tool does the work, and `specs/` keeps the `[ID]` form.

**So archiving a change rewrites the heading**, from the delta form into §3's — a manual step
(§8).

`pnpm exec openspec validate --type spec` checks less than it looks like: it catches a
requirement with no scenario, and does not see our heading form at all. Everything else — the id,
its uniqueness, the deposits, the mirror — is held by review.

## 4. The deposit — how an invariant carries its requirement

The marker is an HTML comment: invisible when rendered, greppable when not.

```md
<!-- invariant: RANK-014 -->
**Invariant #41 — a snapshot belongs to the day it was taken in the user's zone.** The day is
computed in the zone, not in UTC. Pinned by `<spec file>` -> `<assertion name>`.
```

Rules, each with the failure it prevents:

- **The marker is a comment, not a heading.** A heading puts a machine identifier into the
  document's table of contents, and the existing `Invariant #N` numbering already owns the human
  addressing. Two visible numbering schemes in one document is how a reader cites the wrong one.
- **Never rename an id to match a reworded statement.** That is the drift §3 describes, done by
  hand.
- **An invariant that nothing pins says so, in words.** `not pinned by a test — <reason>` is a
  legitimate value. Silence is not.
- **A lint rule is the second pinning kind**, beside a test. Some requirements are about the
  SHAPE of the codebase — that no module outside `repositories/**` touches the database — and a
  test cannot see the absence of a thing. Name the rule id in `be/eslint.config.mjs` or
  the `fe/` ESLint config. A requirement that understates its coverage invites somebody to build the
  guard twice.
- **The block NAMES THE SPEC FILE, not only the ids** — `openspec/specs/<capability path>/spec.md`,
  written out. Without it the reader holds an id and has to derive the path from a convention
  stated in a document that is not in their context.

## 5. What review must cover

Nothing mechanical reads this corpus, so state the gaps instead of assuming them:

- **A heading without an id, a duplicated id, a deposited id whose requirement vanished.** Search
  before merging: `git grep -n "Requirement \[" openspec/specs` and
  `git grep -n "invariant: " -- '*.md'`.
- **A renamed concept.** A word used throughout a spec after the concept left the code passes
  every check; only a reader notices.
- **Whether a requirement was derived from intent or from implementation.** A requirement derived
  from code says the system shall do what it already does, which is unfalsifiable by
  construction. Requirements come from intent — module and lifecycle documents, decisions, the
  assertions of existing tests.
- **Whether harvest and deposit happened.** See §8.

## 6. How the corpus is reached

A spec has no frontmatter and no description, so it is **not a routing target**: agents are routed
to skills and module documents, and the corpus is reached **by the deposit**, from a document
routing already found. That is why §4 requires the deposit to name the spec's path — it turns the
last step from a derivation into a link.

## 7. Who does what

- The **`planner`** writes the plan, creates the change or changes the work needs, GENERATES each
  `tasks.md`, and drives execution.
- **Anyone may amend the delta while the change is in flight.** There is no owner, and there is
  one obligation: an amendment carries an `AMENDED during implementation:` line saying what was
  written, what was found, and what was built instead. A delta with several authors and no trail
  drifts silently.
- **Approval is a human process, and the agent neither waits for it nor observes it.** Work
  starting is the approval having happened.
- The **developer** authors `design.md`, writes the code, deposits, and archives.
- **`openspec/config.yaml`** states what this repository is and carries the per-artifact rules.
  Its `context:` block points here rather than restating this file.

There is no `project.md` and no `AGENTS.md` in this directory; the routing entry a reader needs is
the `openspec/` row in the repository's root `AGENTS.md`.

## 8. The deposit follows the archive, and the harvest is a different act

**The DEPOSIT is the change's, and it comes AFTER `/opsx:archive`.** Carry each requirement into
the document that owns the invariant — the `<!-- invariant: … -->` marker and the line saying what
pins it — and name the spec's path there. It cannot be done earlier: until the archive, the
requirement is still under `changes/`, and a deposit pointing at it points at a proposal.

The order is: **archive → rewrite the delta headings into §3's `[ID]` form → deposit.** All three
are manual here.

**The HARVEST is everything that is NOT a requirement** — the measurements, the alternatives
rejected and why, the defect that produced a shape. Do it BEFORE archiving, while the whole arc
is visible: move each durable fact to the document that owns it (a skill, a module document, a
code comment). A change archived with its harvest undone is the same lost knowledge as a
deletion, filed more neatly. A change with no plan has nothing to harvest; its durable facts ARE
its requirements.

Neither is verified by anything; review is the only check, so look for both before approving an
archive.

## 9. What would turn this off

Judge after a quarter of ordinary work, not sooner — a format that has not been through a full
cycle has not been tested:

1. **Was a requirement AMENDED during implementation — by the code, rather than by its author's
   second thoughts?** Count the `AMENDED during implementation:` lines in `tasks.md`. The model
   claims the requirement is written before anybody has read the code and the implementation is
   obliged to correct it; zero across several changes means the delta is being written after the
   fact to describe finished code, and then the lifecycle is ceremony.
2. **Did a pinning test catch a regression whose requirement named it?** If a test dies under a
   live claim and nobody finds out, the id explained something once and is now maintenance.

A "no" on 1 folds `changes/` and `/opsx:*`: a delta only ever written to match finished code is a
transcript, and a transcript does not need a lifecycle. It does **not** touch the ids or the
deposit — the corpus and the lifecycle earn their keep separately.
