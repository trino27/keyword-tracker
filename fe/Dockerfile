# Build context is the repository root: the frontend imports @app/contracts.
FROM node:24-alpine AS builder
# The same pnpm as the root `packageManager` field, so the lockfile resolves identically.
RUN npm install -g pnpm@10.18.3
WORKDIR /app
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY fe/package.json ./fe/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter fe...

COPY packages/contracts ./packages/contracts
COPY fe ./fe
RUN pnpm --filter @app/contracts run build && pnpm --filter fe run build


# The app is static files; Caddy serves them and proxies /api to the backend, so the
# browser sees one origin and there is no Node process for the frontend at runtime.
FROM caddy:2-alpine AS web
COPY caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/fe/dist /srv
