---
name: plan-interview
description: >
  Dependency-ordered design interview that precedes a written implementation plan.
  Invoke when the user asks to design or plan a non-trivial feature ("let's discuss",
  "let's design", "we need a plan"), or before any change that touches ≥2 workspaces, adds a
  table/enum/wire field, or alters a lifecycle, authorization or event flow. Runs IN THE
  MAIN SESSION — it is a conversation, and a subagent cannot hold one. Produces a decision
  log, then hands off to the `planner` agent, which owns the document.
---

# Design interview

You ask the questions that decide the shape of the work, **one node at a time, parents before
children**, and you present every choice with its trade-offs, its score, and its consequences
for the questions that come after it.

You do not write application code during an interview. You do not write the plan — the
`planner` agent owns it (`.claude/agents/planner.md`).

**When NOT to run**: the shape is already decided, the request is diagnosis or verification, the
answer is an explanation, or the whole decision is smaller than an interview about it. The twenty
worked cases that draw that line: [references/triggers.md](references/triggers.md) — read it when a
borderline prompt arrives, and fix the `description` above (not the eval file) when a case comes
out wrong.

## Step 0 — verify before you ask

Never ask what the repository already answers. Every question spent on a fact the code states
is a question not spent on a decision only the user can make.

Before the first question, in ONE batched pass: read the routers for the affected workspaces,
run the greps that establish the current shape (existing columns, enums, wire fields, the tests
that pin the area), and read the relevant `*_MODULE.md` / `*_LIFECYCLE.md` for prohibitions and
invariants. Batch it — one `scout` invocation carrying several questions,
per `skills/orchestration/SKILL.md`.

Then state, in three or four lines, **what you established** — so the user can correct a wrong
premise before it propagates into ten questions.

## Step 0a — the routing question, asked once and before anything else

**Does this work change what must be TRUE of some capability?**

It is asked here and nowhere later, because it is asked before either artefact exists and it
decides which of them the work gets. `openspec/README.md` owns the requirement side; this is where
the question lives.

- **Below the threshold** — a typo, a CSS-only edit, a config tweak, a single-file fix. Neither a
  plan nor a change. Say so and stop the interview; an interview about a one-line fix costs more
  than the fix.
- **Ordinary work** — a change on its own, no plan. `/opsx:propose` writes the delta; the main
  session works `tasks.md`.
- **Substantial work** — the interview runs, the `planner` writes the plan (`docs/_plans/`)
  AND creates the change or changes it drives. The threshold is the repository's
  existing one for orchestration: two or more workspaces, three or more new files, or something
  that cannot be undone.

**Answering "no requirement changes" does not skip the change.** It makes the change declare
`skip_specs: true`, which writes no delta. There is no fourth option where a plan exists and a
change does not.

**Ask it even when the answer looks obvious, and lean toward yes.** Work filed as "restyle only,
with no requirement change" often changes what a screen SAYS rather than how it looks. The useful
test is not "is this visual" but **"could a reader be MISINFORMED if we got it wrong?"** — a
control two pixels out is presentation; a block reporting "no issues found" for a page that was
never crawled is a false statement.

## Step 1 — score coverage before you build the tree

Nine categories decide whether a design is specified. Mark each **Clear / Partial / Missing**
against what Step 0 established, and publish the table. Questions come only from Partial and
Missing rows — a Clear row is a fact to restate, not a question to ask.

| category | what makes it Clear |
| --- | --- |
| functional scope | which states/screens the change applies to, and which it deliberately does not |
| data model | where the new thing lives, what it is keyed by, what nullability means |
| invariant and enforcement | what must always hold, and what mechanism makes violating it impossible |
| boundary contract | every field that crosses, what breaks, what ships together |
| edge cases and failures | concurrency, partial failure, retries, idempotency, the empty and the maximal case |
| constraints and trade-offs | what is being traded for what, and what was rejected |
| delivery and side effects | events, background jobs, what happens when a job or an external fetch fails |
| operations | migration order, rollback, deletion, backfill |
| completion criteria | the command or assertion that decides each phase is done |

This is the polish that makes the interview finishable: the tree gives an ORDER, the table
gives COMPLETENESS. Without it an interview can run twenty questions and still never touch
"what happens when it fails", because no question generated the question.

Order Partial/Missing rows by **impact × uncertainty**: what most reshapes the result AND is
least settled goes first. High impact with no uncertainty is not a question — state it as a
fact and move on.

## Step 2 — build and publish the question tree

A node is a decision. An edge means: *this answer changes the option set, the scoring, or the
existence of that question.* Order nodes so no question is asked before the answer that
reshapes it.

The default spine, outermost first — a later ring cannot constrain an earlier one:

1. **Identity and data shape** — what the new thing IS, where it lives, what it is keyed by.
2. **Invariant and its enforcement** — what must always hold, and what makes it impossible to
   violate (CHECK, FK, type, guard, ESLint rule).
3. **Wire contract** — what crosses the boundary, what breaks, what ships together.
4. **Behaviour and policy** — pre-conditions, collisions, precedence, irreversibility.
5. **Side effects** — events, background jobs, failure handling.
6. **Operations** — migration order, rollback, deletion, backfill.
7. **Surface** — endpoints, screens, copy.

Publish the tree before asking anything: numbered nodes, one line each, conditional nodes
marked with the answer that unlocks them (`3.2 — only if 1 = a separate table`). The user
sees the route and can reorder it; you learn the shape you are committing to.

The rings and the coverage table are two axes of the same thing: a ring says WHEN a question
may be asked, a category says WHETHER it must be asked at all.

Then keep the tree alive. After every answer, say in one line which nodes it **closed**,
**rewrote**, or **opened**, and flip any coverage row the answer moved to Clear. An answer that
changes nothing downstream is a signal the question was cosmetic — say that too.

## Step 3 — ask one node per turn

Batch only nodes that are genuinely independent AND small (a naming pair, two flags). Anything
whose answer moves another node goes alone.

Each question turn has exactly this shape:

**Context** — one paragraph: what has to be decided, and what in the code forces the decision.
Name the file or column, not "the architecture".

**Options** — two to four, never more. For each: what it is concretely (a signature, a column,
a shape — not an adjective), then `+`, `−`, and **pitfalls**: the failure that shows up
later, in another module, at a boundary, under concurrency, on erasure, on rollback. A variant
without a named pitfall has not been thought about yet.

**Comparison** — one table. Four fixed axes, scored 1–100, plus one to three axes specific to
this task (name them; they are why this question is not generic):

| criterion | A | B | C |
| --- | --- | --- | --- |
| explicitness | 90 | 55 | 70 |
| declarativeness | 85 | 40 | 60 |
| project code style | 95 | 60 | 75 |
| performance | 70 | 90 | 85 |
| *<task-specific axis>* | … | … | … |
| **total** | **85** | **60** | **72** |

Scoring discipline: scores are **relative within this question only** — never carried between
questions. Every score gets a half-line reason under the table; a number without a reason is
noise. Do not manufacture precision — if two options are within a few points, say they tie on
these axes and decide on the task-specific one. A 100 means "this is what the axis was invented
to describe"; below 50 means "this option actively fights the axis".

**Effect on the target** — two or three sentences: what the user gets or loses in the final
result, in product terms, not architectural ones.

**What this changes downstream** — the affected later nodes by number, with the change ("4.2 disappears",
"5.1 gains a third option").

**Recommendation** — one option, with the single reason that decides it. Recommend even when the
margin is thin; "both are fine" is not an answer the user asked for.

Then call `AskUserQuestion`: the prose analysis stays in the message, the tool carries only the
short labels (recommended option first, marked `(Recommended)`). Use `preview` when the options
differ as *code shapes* — a signature or a DDL fragment side by side decides faster than prose.

## Step 4 — keep a decision log in the chat

After each answer, append one line to a running log:

```
D7. A page's owner is reached through `client_id`, not `user_id`. Why: a page belongs to a
    client and a client to a user; a direct `user_id` duplicates the link and can drift.
    Closed D8, rewrote D11.
```

Do this **every turn, in the chat, not in a file**. Long interviews get compacted; a decision
that exists only in an early turn is a decision that will be silently re-litigated later. This
log is also the payload the `planner` agent receives, so its quality is the plan's quality.

## Rules that hold for the whole interview

- **Ask in the user's language.** The interview is a conversation; the plan document is English
  like every other artefact in this repository.
- **Never ask how much work fits in an iteration.** Batch size, "all at once or in phases",
  effort, hours, story points — none of it is yours to ask or to plan. The user decides that
  after the plan exists.
- **A rejected premise wins.** If the user says a constraint you assumed is wrong, accept it in
  one sentence, re-derive the affected nodes, and move on. Do not re-argue a settled decision.
- **Deferral is a valid answer.** Record it as an open question with a default, and name the
  trigger that reopens it ("decide when a second kind of subject appears"). A deferred question
  the plan cannot proceed without is not deferrable — say so and ask again.
- **A question you can answer by measuring is not a question.** Run the grep, count the call
  sites, read the CHECK — then ask about the decision, not the fact.
- **Answers that reveal a new requirement reopen the tree.** Publish the corrected tree; do not
  quietly patch it.
- **Stop when the tree is exhausted**, not when it feels long enough. Then summarize: the target
  in one paragraph, the decision log in full, the open questions, and what the plan will cover.
  Ask for the go-ahead, then invoke `planner`.

## Hand-off

Invoke the `planner` agent with: the target statement, the complete decision log (every line,
verbatim — it is the reasoning the document must preserve), the verified inventory from Step 0
(files, columns, existing tests), the open questions with their defaults, and the branch. The agent
writes the plan in `docs/_plans/<name>.md`, CREATES the OpenSpec change or changes it drives,
generates each `tasks.md`, and returns the plan in full; you relay the plan itself to the user —
the decisions, the work order and the open questions — not only its path.

Pass Step 0a's answer with the rest. The agent does not re-derive it — it was decided with the
user in front of the evidence, and re-deciding it alone is how a requirement goes unwritten.

If the user wants to iterate on the written plan, invoke `planner` again with the change — it
owns the document, so it is the one that edits it.
