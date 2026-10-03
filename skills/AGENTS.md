# Root skills

**What is true of THIS product across more than one service.** A skill lands here when no
single workspace can own it — the seam between two of them, a shared contracts package, a
convention the whole repository follows.

| tree | holds |
| --- | --- |
| `skills/` | product knowledge spanning several services, or the repository as a whole |
| `<ws>/skills/` | product knowledge true of ONE service — `fe/`, `be/` |
| [`practices/`](../practices/AGENTS.md) | how to build well on the stack — portable, and deliberately not here |

The first two are the same kind of knowledge at different scope, which is why they share a
name. `practices/` is the other kind and has its own tree.

---

## What is here

| skill | owns |
| --- | --- |
| [`agent-docs/`](agent-docs/SKILL.md) | how to write a `.md` an agent can answer from; `PLACEMENT.md` owns where every document goes |
| [`orchestration/`](orchestration/SKILL.md) | when to spawn agents, and which steps the existing checks already cover |
| [`fe-be-roundtrip/`](fe-be-roundtrip/SKILL.md) | the seam: screen → ViewModel action → gateway → controller/DTO → service/repository → response → re-render |
| [`be-canonical-fe-mirror/`](be-canonical-fe-mirror/SKILL.md) | a business rule computed identically on both sides — the canonical service, its mirror, and what `@app/contracts` takes instead |
| [`claude-workflow/`](claude-workflow/SKILL.md) | default branch, branch naming, commit style and push form for chat-originated work |

## Two of these are about the corpus rather than the product

`agent-docs/` and `orchestration/` describe how this repository's knowledge is written, filed and
verified — `PLACEMENT.md` owns the shape of these very trees. They belong here because what they
describe is **ours**: our checks, our trees.

## What decides between here and a workspace

**Would exactly one workspace be wrong to hand this to?** `fe-be-roundtrip/` is the seam
between two of them and has no single home. `be-canonical-fe-mirror/` governs a package both sides
import.

A skill that only looks cross-cutting because two services happen to do the same thing today
belongs to neither: it is a practice, and it goes to [`practices/`](../practices/AGENTS.md).

## Every tree has the same shape

A skills tree — this one, `practices/` and each workspace's — is arranged identically, so an
agent that has navigated one can navigate all of them.

**The contract is [`agent-docs/PLACEMENT.md`](agent-docs/PLACEMENT.md) §7** — the shape is not
restated in any router, including this one, because several trees each restating it is how they
come to disagree.
