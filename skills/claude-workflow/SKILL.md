---
name: claude-workflow
description: Conventions for how Claude Code operates when working in chat with the user on this repo — the default branch (`main`), why nothing is committed directly on it, how to name branches (`feat/`, `fix/`, `chore/`, `docs/`), Conventional Commits subjects, and how to push a new branch. Read before starting any task that will produce commits.
---

# Claude Workflow — Branch, Commit & Push Conventions

Reference skill for Claude Code sessions on this repo. Not a codebase pattern for
engineers — it governs how Claude itself picks a branch to read from, how it names branches it
creates, and how it commits and pushes.

## Default branch for lookups and new work

- If the user's request doesn't name a specific branch, treat **`main`** as the source of truth:
  read code from `origin/main`, and base any new branch off `origin/main`.
- If the user explicitly names a branch ("look at `feat/x`", or the same in any language), that
  always overrides the default.

## Never commit directly on `main`

The `pre-commit` hook (`.husky/pre-commit`) refuses a commit made on `main`. So every task starts
by creating a working branch off `main`; there is no "small change, straight to main".

## Branch naming

`<type>/<kebab-case-description>`, where `<type>` is one of:

| type | for |
| --- | --- |
| `feat/` | a new capability or behaviour |
| `fix/` | a defect |
| `chore/` | tooling, dependencies, config, refactors with no behaviour change |
| `docs/` | documentation only |

Examples: `feat/client-crawl-trigger`, `fix/rank-range-timezone`, `chore/eslint-boundaries`,
`docs/openspec-readme`. `main` is a base to branch from, never a name to create.

## Commits

- **Conventional Commits subjects: `type(scope): what changed`** — `feat(crawl): fetch the first
  15 posts from the blog sitemap`, `fix(rank): convert the range to UTC before the query`. The
  type matches the branch types plus `refactor`, `test` and `perf`; the scope is the module or
  workspace touched.
- **Commit as you go, in small logical commits.** One commit is one reason to revert; a branch
  that is a single end-of-day commit cannot be bisected or reviewed in pieces.
- The subject says what changed; a body, when needed, says why.

## Where a push lands

Name both sides of the refspec when pushing a new branch, so the push cannot land on a branch you
did not name:

```bash
git push -u origin <branch>:<branch>   # a new remote branch
```

With `push.default=upstream`, a branch created from `origin/main` has `main` as its upstream, and
a plain `git push` would target `main`. The explicit refspec removes the question. Read the final
line of the push output, which names the ref that actually moved.

**Never force-push `main`.** Recovering a bad push to `main` is a `git revert` (an ordinary
commit), not a rewrite. Force-pushing your own feature branch after a rebase is fine.
