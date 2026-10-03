# Build context is the repository root: the backend imports the workspace package
# @app/contracts, which is not published anywhere.
FROM node:24-alpine AS builder
# The same pnpm as the root `packageManager` field, so the lockfile resolves identically.
RUN npm install -g pnpm@10.18.3
WORKDIR /app
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY be/package.json ./be/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter be...

COPY packages/contracts ./packages/contracts
COPY be ./be
RUN pnpm --filter @app/contracts run build && pnpm --filter be run build


FROM node:24-alpine AS runtime
RUN npm install -g pnpm@10.18.3
WORKDIR /app
ENV NODE_ENV=production HUSKY=0 TZ=UTC

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json ./packages/contracts/
COPY be/package.json ./be/
RUN pnpm install --frozen-lockfile --ignore-scripts --prod --filter be...

COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/contracts/dist-cjs ./packages/contracts/dist-cjs
COPY --from=builder /app/be/dist ./be/dist
# The migrate service runs from this same image.
COPY --from=builder /app/be/drizzle ./be/drizzle

WORKDIR /app/be
USER node
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
