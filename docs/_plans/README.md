# Plans

Every execution plan in this repository lives here, and nowhere else. The `planner` agent writes
them (`.claude/agents/planner.md` owns the document's section contract); the `plan-interview`
skill produces the decisions they rest on.

**A plan is the wider abstraction; an OpenSpec change is the unit of work inside it.** The plan
carries what a change cannot express — phases and their dependencies, the TDD discipline, the
command that accepts each phase, the commit points, the checks between phases, the order of the
changes. Each change carries the work order for its own requirement delta in its `tasks.md`.

## The contract

- **A plan describes an intended future in the present tense.** It is never a source of truth
  about current behaviour, and it may name paths and classes that do not exist yet.
- **A plan is delivered in the conversation, not as a path.** Whoever writes one posts the plan
  itself — the decisions, the work order, the open questions. A plan nobody read is approved by
  silence.
- **A plan names at least one change; a change needs no plan.** Small work takes neither,
  ordinary work takes a change on its own, substantial work takes a plan and the changes it
  creates. Work that changes no requirement still gets a change with `skip_specs: true`.
- **`tasks.md` is generated from the plan** and corrected through it.
- **A plan marks phases, a change marks tasks, and a phase does not close while a change it names
  still has open tasks.**
- **The decision log is append-only.** A reversed decision gets a new line naming the reversal;
  the old line stays.
- **Nothing outside this folder links into it.** A plan links outward freely; a skill or module
  document citing a plan starts lying the day the plan is archived.
- **A finished plan is archived, not deleted** — moved to `docs/_plans-archive/` with a header
  naming the branch, what was harvested into which owning document, and what was left open. A
  spent plan left here asserts a false present tense.

Filename: `<short-kebab-name>.md`. Status line: `**Status:** draft` (no branch yet) or
`**Status:** active` with the branch the work happens on.
