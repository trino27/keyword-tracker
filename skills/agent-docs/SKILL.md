---
name: agent-docs
description: How to write any .md so an agent can answer from it cheaply. Read before writing or restructuring documentation anywhere in the repo. Core rule: one fact, one owner — a partial second copy makes a reader stop early and invent the rest. PLACEMENT.md beside it says where a document goes.
---

# Writing documentation agents can read cheaply

**Read before writing or restructuring any `.md` in this repo** — module docs, skills, routers,
runbooks. This file is the *how to write* rule; `PLACEMENT.md` beside it is the *where does it
go* contract, and the two must agree.

---

## 0. What matters, and what does not

**Formatting is not the lever.** Bullet lists, tables, checklists, glossaries, front-matter,
breadcrumbs, "use when" descriptions — a reader recalls a fact about equally well from any of
them. Do not spend review time arguing about these.

Two things do move correctness, and both are content defects wearing a formatting costume:

1. **A contradiction is invisible and lethal — §1.**
2. **Dissolving a rule into narrative loses its precision — §4.**

And one thing formatting cannot fix at all: **if the fact is absent, the agent leaves your
documentation and reads the source.** The highest-value documentation work is not compressing
what exists; it is writing the procedures nobody wrote and the seams nobody owns (a front-end ↔
back-end round trip, for one).

### Tags used below

Each rule says what backs it. When you add a rule here, say the same or do not add it.

| Tag | Means |
|---|---|
| **EVIDENCE** | Observed to change an answer. |
| **CONVENTION** | Kept for a stated non-recall reason — drift, review, human onboarding. Never claim these make an agent smarter. |

## 1. One fact, one owner [EVIDENCE]

A fact stated in two files does not cost twice — it costs far more than twice, because an agent
that finds the *partial* copy stops there.

The failure: a rule lives in a skill **and** in a module document, the two lists disagree, the
agent reads the skill, stops, and produces a confident wrong answer. After deleting the list from
the skill and leaving a pointer to the single owner, the same question was answered cheaper and
correctly.

- **The owner states the fact in full.** Nobody else states any part of it.
- **A non-owner may state that the rule exists, and where** — never what it says.
  `See § Row-level locking — it owns the list` is safe. Restating three of the nine items is not.
- **When you find two copies, do not merge them by eye.** They have already drifted. Verify
  against code, then delete one. Expect both to be partly wrong.
- A rule genuinely needed in two places belongs in the shared package or the always-loaded
  router, not copied.

**A contradiction produces a confident answer, not an error.** A reader silently resolves two
disagreeing statements, and which side it picks is not predictable. It reports the disagreement
only when asked to. So:

- Reviewing agents must be *instructed* to report self-contradiction.
- Close reading is the only detector, so a compression pass is also an audit: ask for
  fact-by-fact verification against code, never "just make it shorter".
- **Never fix one with a global find-and-replace.** Two namespaces in one document can look alike
  and be different — an event wire string and a notification type that embeds it. Fix the
  occurrences you have verified, one at a time.
- A contradiction is never resolved by choosing the more convincing sentence. Verify against
  code, then delete the loser.

Corollary — **the cheapest possible doc is a complete rule in a file already in context.** If a
rule is short and load-bearing, put it in the router in full.

## 2. Split by question — but only once a document is large [EVIDENCE, size-dependent]

For a short document an index makes no difference. For a large one, a **question → section**
index is the cheapest way in.

- Headings must contain the words someone would search for: the symbol, the error name, the env
  var, the command. `## 9. Critical Invariants` is unfindable; `### 9.4 Row-level locking` is
  found by grepping `FOR UPDATE`.
- On a large doc, replace a hand-maintained table of contents with a question → section index. A
  ToC restates headings the agent can already see, and goes stale.
- Keep facts that are always needed together in one place. Splitting a co-needed pair across two
  anchors buys a round-trip.

## 3. A paragraph in a table cell — a scale rule [EVIDENCE]

A short table with a paragraph in every cell reads fine. What hurts is **volume**: dozens of
invariants in long cells is where a reader stops scanning and invents an answer.

Practical line: a table stops working somewhere between ten paragraph-cells and forty. If a table
is long **and** its cells need a *because*, promote the rows to subsections:

```markdown
**#27 — a `crawl_run` is retried only when it has no finished page.**

- **KEEP path** — a page already finished: its snapshots are untouched…
- **RESTART path** — no finished page: the run is reset to queued…

Enforced by `CrawlRetryService.retry`.
```

A table cell holds a value, a status, a symbol or a short phrase. The moment it needs a
*because*, it is a subsection.

**Do not pad table cells to align the pipes.** Markdown renders a padded and an unpadded table
identically, and a formatter that re-aligns tables on every commit adds noise to every diff. Keep
Markdown out of any prettier glob.

## 4. State the present; do not narrate the change [EVIDENCE for precision; CONVENTION for size]

**Dissolving rules into narrative measurably loses precision.** But deleting history is a size and
drift argument, not a recall one: remove change-narration to keep documents small and honest, not
because an agent trips over it.

The test is not "is this history?" — it is **"does this sentence change what the reader does
today?"**

- *"renamed from `CLIENT_SITES`"* — changes nothing. Delete.
- *"a check that reported success while running nothing"* — changes everything: it is why you
  must check your check can fail. Keep, but as the reason for the rule.

The second kind is not really history, it is the **reason a rule exists**, and deleting it gets
the rule itself deleted next by someone who finds it arbitrary. But the narrative FORM is wrong:

- ✗ "we used to count the crawl run twice"
- ✓ "any page count taken before the dedupe fix is one per run too high — do not trend across
  that boundary"

Same information; only the second tells you what to do. Write the constraint, in the present
tense.

**Delete** the aside when the change has no consequence today. **Convert** it when the history IS
a live constraint, and say what it forbids.

**A plan is harvested, then gets out of the live corpus.** The durable parts of a finished plan
belong where they are enforced; the plan itself is deleted or archived, and nothing links to a
plan. A plan names classes and paths that do not exist yet — that is what a plan IS — so it is
never a source of truth about the code.

## 5. Do not mirror code [CONVENTION]

The argument is drift, not comprehension: a copied type has to be updated twice and will not be,
which turns into the contradiction of §1.

- **No interface dumps.** Name the type and its file. Document a field only where it carries a
  rule the type cannot express — nullability semantics, a never-persisted marker, a unit.
- **Never restate a COUNT of repo state** — `5 controllers`, `3 modules`. Every one drifts. Name
  the source of truth instead: the controllers directory, the enum.
- **A document that quotes real repo content as an EXAMPLE must say, at the top, that the example
  is frozen** and who owns the subject. Otherwise it competes with the owner.
- **Do keep** exact command lines, exact env var names, exact error codes and exact SQL
  predicates. Those are what the reader cannot re-derive.

### A number in prose — four kinds

The line is not between numbers and prose, it is **between numbers the repo owns and numbers the
document owns.**

| Kind | Rots | Requirement |
| --- | --- | --- |
| **Normative threshold** — the number IS the rule | never | keep it exact; deleting it deletes the rule |
| **Measurement** — what was true when it was taken | no, if dated | must carry its date in the same sentence |
| **Magnitude in an argument** — why a tradeoff holds | no, if hedged | must be hedged: `~`, `over`, `≥`, "tens of" |
| **Inventory of repo state** — how many exist right now | **always** | forbidden; name the owner of the fact |

- **Normative:** `split a directory at 15 files`, `≤40 KB`, `3+ new files`. It prescribes, it
  does not describe.
- **Measurement:** `Measured 2027-02-10: a full test run ~9s`. True of its date forever; undated,
  it reads as current state.
- **Magnitude:** `~11 entries per client, rewritten rarely`. The argument needs the order of
  magnitude, never the exact value.
- **Inventory:** `18 services`, `74 table rows`. A moving inventory count is either wrong or paid
  for, and it answers a question no task asks.

**A stale count is not inert — it is an argument with a false premise.** The conclusion may
survive while the argument is inflated, and nothing says so.

**An ordinal into a list somebody else owns is the same defect.** A menu number, a step number in
another document, a `§N` in a document that does not own the section: it starts pointing
somewhere else in silence when the list is renumbered. Carry the item's NAME with the number
(`step 3 (Run migrations)`). A `§N` inside the document that owns the section is fine — invariant
numbers are permanent identifiers (append, never renumber), which is what makes a stable `§N`
citable at all.

### Module-map trees

A hand-written ASCII tree of a module's files is a second copy of the file layout, owned by
nobody. Do not write one: name the module and let the reader list the directory. A tree that
encodes **ordering or behaviour** (a call-flow or pipeline diagram) is not a file listing and
stays, and so does a **prescriptive** tree that says where a new file goes — that is intent.

## 6. Every rule names its enforcement [CONVENTION]

Removing every "Enforced by" pointer does not change what an agent answers, so do not claim this
makes it smarter. Keep it anyway: a rule with no pointer cannot be checked against code, so when
it drifts nobody can tell, and a drifted rule is a contradiction waiting to happen. The pointer is
for whoever has to VERIFY the rule. End each rule with the file, guard, ESLint rule, CHECK
constraint or test that makes it true.

When you cannot find the enforcement, that is a finding — say so explicitly (`enforced by review;
convention only`) rather than implying a guard exists.

### Documentation explains; a check prevents

> **Where an invariant is closed by a lint rule or a test, the document adds nothing to whether
> it holds. Where there is none, the document is the only thing standing there.**

1. **A rule that must not break needs a lint rule or a test — not a paragraph.** Writing it more
   emphatically does not make it hold. If you are strengthening the wording of an invariant, that
   is the signal to go write the check instead.
2. **Spend documentation on the unchecked space** — intent, prohibitions, "why not the obvious
   thing", cross-module contracts no single test can see. That is where it is load-bearing.

### An INVARIANT names a test, and if there is none, write one [EVIDENCE]

A pointer to a source file says where to look. It does not fail when the document and the code
stop agreeing. For an **invariant** — a rule that must hold, not a description of how something is
wired — the enforcement must be a **test**, and the document must name it. This is the only
mechanism that makes documentation rot *loudly*.

The failure it answers: a precondition stated three times in one document, each time slightly
differently, while the code rejects on a broader condition. An agent routed through the document
reproduced the wrong version with high confidence; agents reading only the code got it right. No
check could catch it, because a contradiction produces a confident answer, never an error. One
test — *cancel an entry whose interval has elapsed → expect the exception* — turns that silent
divergence into a red build the day someone changes it.

- Name the test: `` `Enforced by crawl-run-cancel.service.spec.ts "rejects an elapsed window"` ``.
- If no test pins it, **that is the finding** — write the test, or mark the invariant
  `not pinned by a test` so the next reader knows the doc is the only copy.
- A test name is prose an agent can grep. Name it after the rule, not after the method.

This does not apply to descriptive statements ("`createdBy` is preserved on cancel" is a fact
about mechanics — the code owns it, per §5). It applies to rules with a MUST in them.

## 7. How to verify a documentation change

Do not trust a size reduction. Smaller docs can be more expensive if the agent now has to read two
of them. Cheaper is not the goal; a confident wrong answer is what you are buying your way out of.

What can be checked mechanically here is little: Prettier runs on staged code, not Markdown, and
nothing resolves links. So check by hand before committing:

- every relative link and every repo path in the text resolves (`ls` it);
- no backticked class or function name that the code does not define;
- no second copy of a fact (`git grep` a distinctive phrase).

Those are necessary and nowhere near sufficient: neither a contradiction nor a fact nobody wrote
is machine-detectable, and both are worse. To test whether a document actually answers, ask a
question the document should answer to a fresh agent restricted to `*.md`, with a gold answer
**verified against code, never against the doc you are editing**, and compare the tokens it spent
and whether it was right. Do not edit documents while that run is in progress.

**Two results worth remembering:**
- A doc that *partially* answers a question is worse than one that does not mention it. The agent
  stops at the first plausible source and fills the gap by invention.
- Restructuring a doc the agent never opens changes nothing. Fix the door it actually walks
  through first.

## 8. Checklist before committing a doc change

**These change correctness:**

- [ ] **Does anything I wrote contradict another doc, or the code?** If two places disagree,
      verify against code and delete the loser — expect both to be partly wrong (§1).
- [ ] Every fact I wrote has exactly one owner; I searched for other copies, and I did not
      leave a *partial* restatement anywhere (§1).
- [ ] Every rule is still stated AS a rule — I did not dissolve one into narrative (§4).
- [ ] If the docs could not answer a real question, I wrote the missing procedure rather than
      reformatting what was already there (§0).

**These keep it maintainable — do not block a PR on them:**

- [ ] Headings contain the terms someone would grep; a large doc has a question→section index.
- [ ] No table so long that its paragraph-cells stop being scannable (§3).
- [ ] No sentence explains what something used to be called, unless it constrains today.
- [ ] Every number I wrote is a threshold, a dated measurement or a hedged magnitude — not an
      inventory of repo state (§5).
- [ ] No interface or long code block that a file reference would replace.
- [ ] Every rule names what enforces it, so the next person can verify it.
- [ ] If I changed a rule that other docs cite by number, the number still means the same
      thing. Invariant numbers are permanent identifiers — append, never renumber.
