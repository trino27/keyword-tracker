---
name: docker-build-context
description: Docker build context must be root (.) for all services — @app/contracts requires access to packages/
---

# Docker Build Context

## Rule
Every Dockerfile in the monorepo (`be/Dockerfile`, `fe/Dockerfile`) MUST use root (`.`) as build
context in `docker-compose.yml`.

```yaml
# CORRECT
be:
  build:
    context: .
    dockerfile: be/Dockerfile

# WRONG — breaks @app/contracts resolution
be:
  build:
    context: ./be
    dockerfile: Dockerfile
```

## Why
Both be and fe depend on `@app/contracts` from `packages/`. If context is `./be`, Docker cannot
access `packages/`, `pnpm-workspace.yaml`, or the root `pnpm-lock.yaml`.

## Dockerfile structure
Because context is root, all COPY paths are relative to root:
```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY be/package.json ./be/        # or fe/package.json ./fe/
```

## @app/contracts must be built in the builder stage
```dockerfile
RUN ... pnpm install --frozen-lockfile --filter <pkg>... && pnpm --filter @app/contracts run build
```

In the production stage (be only), copy the pre-built `dist` instead of rebuilding:
```dockerfile
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
```
