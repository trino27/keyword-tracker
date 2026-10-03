# Practices

**How to build well on this stack.** Every skill here would hold unchanged in a second service
of the same technology — that is the test that put it here, and it is the reason this tree is
separate from `skills/`.

| tree | holds | changes when |
| --- | --- | --- |
| `practices/` | how to write it — the framework, the library, the craft | the technology, or our judgement about it, does |
| [`skills/`](../skills/AGENTS.md) | what is true of THIS product, across more than one service | the product does |
| `<ws>/skills/` | what is true of ONE service | that service does |

The first is about a tool anybody could pick up. The other two are about this repository.

**Why an agent needs the difference:** a practice says *this is how Nest works*, a skill says
*this is what we decided*. The first is to be followed; the second may be reopened with the user.
Without the split, both arrive as "a rule" and there is no way to tell which is which — the
whole reason this tree exists.

---

## The buckets

| bucket | holds |
| --- | --- |
| [`be/`](be/AGENTS.md) | backend: `nestjs/`, `drizzle/`, plus craft that belongs to no single library |
| [`fe/`](fe/AGENTS.md) | frontend: `react/` |
| [`ops/`](ops/AGENTS.md) | Docker, compose, Caddy, envs |

The layout is **platform → technology → thing**, mirroring `packages/` on purpose.

**One practice belongs to no platform**, and it sits at this tree's root rather than in a
bucket: [`naming/`](naming/SKILL.md) — how a type, class, folder and constant file is named,
identically in every workspace.

A topic here is recognised by carrying a `SKILL.md` directly; a bucket never does.

## The expected structure

```
practices/
├── AGENTS.md                        this file — the tree's ONLY router
├── <topic>/SKILL.md                 a practice true of EVERY platform — `naming/`
└── <platform>/                      be | fe | ops — a BUCKET
    ├── AGENTS.md                    required: the bucket's own router and index
    ├── <topic>/SKILL.md             craft belonging to no single library
    └── <tech>/                      nestjs | drizzle | react
        └── <topic>/
            ├── SKILL.md             required — frontmatter `name` (= folder) + `description`
            ├── rules/<name>.md      load-bearing sub-rules of THIS skill
            └── references/<name>.md background, deliberately not read first
```

Three things about this tree specifically:

- **A platform gets a router, a technology does not.** `practices/be/AGENTS.md` exists;
  `practices/be/nestjs/` has no `AGENTS.md`, because the bucket router already indexes down to
  the leaf and a second index would be the copy that drifts.
- **A technology folder appears when there is a technology, not when there are several skills.**
  `nestjs/`, `drizzle/`, `react/` each name a dependency a reader can look
  up. A rule that belongs to the platform but to no library sits at the bucket's top level —
  `be/polymorphism-over-switch/`, `ops/devops/`.
- **`name:` in the frontmatter is the folder**, optionally carrying a platform it already sits
  in (`path-aliases` or `be-path-aliases`). It is an address, not a label.

**The generic shape is owned by [`skills/agent-docs/PLACEMENT.md`](../skills/agent-docs/PLACEMENT.md)
§7.** Nothing mechanical checks it, so a reviewer does: no `README.md` in this tree, the router
is the index.

## What decides whether a rule belongs here

**Is the rule about the TECHNOLOGY, or about THIS product?**

A NestJS module-layout convention would hold unchanged in a second Nest service in this
repository, so it is `practices/be/nestjs/`. A rule about clients, pages or rank snapshots
would not, so it belongs to a service, or to `skills/` when it spans several.

That is deliberately NOT "two services already use it". There is one backend today; waiting for
the second would mean discovering, at the moment a second service is created, that twenty
conventions are filed under the first one's name — and the person creating it reads
`be/skills/` as somebody else's rules.

**The cost of getting it wrong runs one way.** A product rule promoted into a practice is read
as binding by a service it does not apply to. A shared rule left in a service is merely
inconvenient. When it is genuinely unclear, leave it in the service: moving later is a rename,
and un-teaching a wrong rule is not.

### The one-pass test

Strike out every name belonging to this product — the app, a table, a domain concept, a
workspace. **If a working instruction remains, it is a practice.** If what remains is a sentence
with a hole in it, it is a skill.

An example naming a real file of ours is welcome and teaches better than an invented placeholder. What may
not appear is a product name in the CONDITION of a rule.

## How to work with this tree

**Reading.** Enter through the bucket router, never by `ls`. A workspace router points at the
buckets it draws on, so `be/AGENTS.md` → `be/skills/AGENTS.md` → `practices/be/` is the path a
backend task takes; the practice is the general rule and the workspace skill is what this
service does with it. When the two appear to disagree, the workspace wins — it is the more
specific, and the root `AGENTS.md` § Conflict Rules says so.

**Adding a skill.** Apply the one-pass test first. Then create
`practices/<platform>/[<tech>/]<topic>/SKILL.md`, give it frontmatter whose `name` is the folder,
and add its row to the bucket's `AGENTS.md` — nothing checks that the index is complete, so an
unlisted skill is one an agent will not find.
