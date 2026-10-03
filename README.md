# SEO Keyword Tracker

Crawls a client website, works out what each page probably ranks for, and tracks those
positions over time.

> Work in progress: the infrastructure is in place (API, database, SPA, Docker). The
> features, the seed script, and the decisions and open ends sections arrive with the
> implementation.

## How to run

Requirements: Docker with Compose v2. For local development without Docker: Node 24 and
pnpm 10 (`corepack enable`).

```bash
git clone <repo-url> seo-keyword-tracker
cd seo-keyword-tracker
cp .env.example .env
docker compose up -d --build
```

Open http://localhost:8080. The start screen shows whether the API and the database answer;
`http://localhost:8080/api/health` returns the same as JSON.

### Local development

```bash
pnpm install
cp .env.example .env          # if not done yet
pnpm dev:db                   # Postgres in Docker
pnpm db:migrate
pnpm dev:be                   # API on :3000
pnpm dev:fe                   # SPA on :5173, proxies /api to the API
```

Checks (the same ones the pre-push hook and CI run):

```bash
pnpm lint && pnpm typecheck && pnpm test
```

## Stack

| Part | Choice |
| --- | --- |
| Database | PostgreSQL 18, Drizzle ORM with generated migrations |
| Backend | NestJS 11, TypeScript, pino logging, Jest |
| Frontend | React 19 + Vite SPA; MVVM with zustand ViewModels and gateway classes; TanStack Router; zod |
| Web server | Caddy: serves the built SPA and proxies `/api` to the backend (one origin, no CORS) |
| Shared | `@app/contracts` — wire shapes and constants both sides import |

## Repository map

`be/` API · `fe/` SPA · `packages/contracts/` shared contracts · `caddy/` web server config ·
`openspec/` requirements · `practices/`, `skills/`, `be/skills/`, `fe/skills/` engineering
conventions · `AGENTS.md` entry point for contributors and AI agents.
