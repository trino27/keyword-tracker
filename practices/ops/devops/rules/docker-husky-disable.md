---
name: docker-husky-disable
description: Disable husky and lifecycle scripts in Dockerfiles to prevent build failures
---

# Disable Husky in Docker

## Rule
Every Dockerfile that runs `pnpm install` MUST disable husky and lifecycle scripts:

```dockerfile
ENV HUSKY=0
RUN echo "ignore-scripts=true" >> .npmrc && pnpm install --frozen-lockfile --filter <pkg>...
```

## Why
Root `package.json` has `"prepare": "husky"`. Without `HUSKY=0`, `pnpm install` triggers the
`prepare` script, which tries to run `husky` and fails because it is not a build dependency or the
git repo is not initialized in Docker.

`ignore-scripts=true` prevents ALL lifecycle scripts (prepare, postinstall, etc.) from running
during install.

## Both lines are needed
- `HUSKY=0` alone may not catch all cases
- `ignore-scripts=true` alone blocks legitimate postinstall scripts that some deps need
- Together they reliably prevent husky from running
