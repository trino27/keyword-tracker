# Trigger evaluation — `plan-interview`

Twenty prompts that decide whether this skill fires. The half that must NOT fire is the load-
bearing half: a design interview on a one-line fix is the most annoying way an always-available
skill can be wrong, and it is the failure a description tuned only for recall produces.

The should-not-trigger cases are deliberately **near misses** — they name planning, design,
phases, edge cases or tests, and still do not warrant an interview. Obvious non-matches ("what
is the weather") measure nothing.

How to use it: run the prompts against a session that has the skill available, record whether it
fired, and fix the `description` — not this file — when a row comes out wrong. If a row is
genuinely ambiguous, the ambiguity belongs in the description as an explicit boundary.

## Must trigger

| # | prompt | why |
| --- | --- | --- |
| 1 | "let's discuss how to store the daily position history" | explicit design conversation |
| 2 | "we need a plan to move snapshot storage to monthly partitions" | asks for a plan |
| 3 | "let's design how a crawl starts when a client is added" | new lifecycle + new invariant |
| 4 | "I want a table for a page's SEO issues — shall we discuss the model?" | new table, keyed by something undecided |
| 5 | "the crawl statuses need reworking but I don't know into what — help me decide" | lifecycle change, shape undecided |
| 6 | "we're adding a wire field between FE and BE — what should we consider?" | contract crossing two workspaces |
| 7 | "how do we delete a client without breaking the history?" | policy + cascade + invariant, several valid answers |
| 8 | "the crawler needs to move into its own module — where do we start?" | ≥2 modules, ownership undecided |
| 9 | "write an implementation plan for the pages list UI from these mockups, in phases" | plan requested, phases requested |
| 10 | "let's weigh the options: an ESLint rule or a CHECK in the schema?" | a decision with trade-offs and no single right answer |

## Must NOT trigger

| # | prompt | why not — and what should happen instead |
| --- | --- | --- |
| 11 | "fix the typo in `CRAWL_MODULE.md`" | single-file edit; just do it |
| 12 | "quick fix: `latestPosition` is missing from the pages list" | user said quick fix; skip orchestration entirely |
| 13 | "why is `crawl-run.service.spec.ts` failing?" | diagnosis, not design |
| 14 | "run lint and tests and tell me what is red" | verification; `test-runner` |
| 15 | "explain how a page's keywords are chosen" | explanation of existing behaviour; read the docs and answer |
| 16 | "add a test for the edge case of two clients with the same URL" | one focused test; main session |
| 17 | "rename `siteUrl` to `websiteUrl` across the frontend" | mechanical rename; shape already decided |
| 18 | "continue with the plan in `docs/_plans/rank-history.md`" | a plan already exists — execute it, do not re-interview |
| 19 | "review my changes before I push" | review; `/code-review` or `qa` |
| 20 | "which of two names would you pick for `PositionBadge` — two lines of code?" | a genuine choice, but the answer is one sentence; a nine-category coverage scan on it is theatre |

## The line these draw

Trigger when **the shape of the work is undecided and the decision has consequences that
outlive the conversation** — a column, a key, an invariant, a contract, a lifecycle.

Do not trigger when the shape is already decided (11, 17, 18), when the request is diagnosis or
verification (13, 14, 19), when the answer is an explanation (15), or when the whole decision is
smaller than the interview about it (16, 20).
