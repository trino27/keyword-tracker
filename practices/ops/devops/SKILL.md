---
name: devops
description: >
  DevOps knowledge base — Docker Compose and Dockerfiles, Caddy as the single entry, pnpm
  monorepo builds, the root env file, and Drizzle migrations in Docker. Read before touching
  docker-compose.yml, a Dockerfile, caddy/Caddyfile, an env variable or a migration.
---

# DevOps Skill

Reference skill for infrastructure knowledge.
Consumed by any agent or person working with Docker/infra.

## Scope

- Docker Compose services & Dockerfiles (`postgres`, `migrate`, `be`, `web`)
- Caddy: serves the fe build and reverse-proxies `/api` to be
- pnpm monorepo workspace
- Environment file: root `.env.example` copied to `.env`
- Husky git hooks inside Docker builds
- Drizzle migrations in Docker

## Rules

Each is load-bearing and is read when its topic comes up — not all at once.

| rule | read when |
| --- | --- |
| [docker-build-context](rules/docker-build-context.md) | Writing or changing any Dockerfile or its `build:` block. The context is the repository root (`.`) for every service, because `@app/contracts` lives in `packages/`. |
| [docker-husky-disable](rules/docker-husky-disable.md) | Adding an install step to a Dockerfile — `HUSKY=0` and `ignore-scripts=true`, or the build fails on a git hook it has no git for. |
| [env-structure](rules/env-structure.md) | Adding or moving an env variable. One root `.env.example` → `.env`, read by docker compose and by local scripts. |
| [caddy-config](rules/caddy-config.md) | Touching routing or a new upstream. The Caddyfile template and the directory-mount strategy. |
| [migration-gotchas](rules/migration-gotchas.md) | Generating or applying a Drizzle migration, especially one touching a PostgreSQL enum. |
