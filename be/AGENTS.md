# be/ — NestJS API

NestJS 11, Drizzle ORM over PostgreSQL, pino logging, Jest. Shared wire values come from
`@app/contracts`.

## Read first

- [`be/skills/AGENTS.md`](skills/AGENTS.md) — decisions specific to this backend.
- [`practices/be/AGENTS.md`](../practices/be/AGENTS.md) — portable NestJS and Drizzle rules.

## Layout

```
src/
  main.ts, migrate.ts          entry points (tz.ts is imported first: the process runs in UTC)
  app/                         AppModule
  core/                        bootstrap, exceptions, filters, NestJS primitives
  infrastructure/              config (env schema), logging
  persistence/                 Postgres connection, schema tables, column factories
  modules/<module>/            controllers/, dto/, services/, repositories/, interfaces/
drizzle/                       generated migrations — never edited by hand
```

Aliases: `@core/* @shared/* @infrastructure/* @modules/* @persistence/*`.

## Commands

```bash
pnpm --filter be start:dev     # reads ../.env
pnpm --filter be lint          # type-aware; architectural rules are ESLint rules
pnpm --filter be typecheck
pnpm --filter be test:ci
pnpm --filter be db:generate   # after a schema change; read the SQL it produces
pnpm --filter be db:migrate
```

## Enforced by ESLint

Nest `Logger` is banned (pino); `core/ shared/ infrastructure/` may not import `@modules/*`;
Drizzle and table schemas only in `repositories/` and `services/domain/`; bare `new Error`
banned in services and repositories; schema conventions (`timestamptz`, `_json`, `_enum`,
array table options).
