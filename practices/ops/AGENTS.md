# Ops skills

Conventions that belong to the way this repository is **built, routed, configured and
run in containers**, not to any one service. A second application added to this monorepo would
inherit every one of them the moment it got a Dockerfile.

What decides membership is the repository's rule, not this bucket's — see
[`practices/AGENTS.md`](../AGENTS.md). The short form: it belongs here when the rule is about the
INFRASTRUCTURE, and in a workspace's `skills/` when it is about that service's own code.

---

## What is here

| skill | owns |
| --- | --- |
| [devops](devops/SKILL.md) | Docker Compose and Dockerfiles, Caddy, the pnpm workspace, env files, Drizzle migrations in Docker. Its `rules/` hold the load-bearing detail and the skill indexes them. |

**`practices/ops/devops/` is the SHAPE of the infrastructure** — what a Dockerfile's build context
must be, which env file holds what, how Caddy routes a path, what breaks in an enum migration.
A rule that names one service's own scripts or menu does not belong here.
