# Backend practices

Conventions for the NestJS + Drizzle + Postgres backend that are not about one feature. What is
true of this product's own modules (crawl, pages, rank snapshots) lives in `be/skills/`.

## `nestjs/`

| skill | owns |
| --- | --- |
| [core-infrastructure](nestjs/core-infrastructure/SKILL.md) | what goes in `core/`, `shared/`, `infrastructure/`, `persistence/` and in a feature module |
| [root-module-structure](nestjs/root-module-structure/SKILL.md) | the folder vocabulary of a module |
| [module-decomposition](nestjs/module-decomposition/SKILL.md) | controller -> service -> repository, and when to split each |
| [cross-module-dependencies](nestjs/cross-module-dependencies/SKILL.md) | how one module uses another, and cycles |
| [nestjs-best-practices](nestjs/nestjs-best-practices/SKILL.md) | DTOs, validation, errors, guards, DI, config |
| [path-aliases](nestjs/path-aliases/SKILL.md) | alias vs relative imports |
| [testing-patterns](nestjs/testing-patterns/SKILL.md) | Jest unit specs, mocks, the e2e test against a real DB |

## `drizzle/`

| skill | owns |
| --- | --- |
| [database-patterns](drizzle/database-patterns/SKILL.md) | naming, ids, enums, indexes, FKs, pagination, locking, migrations |
| [timestamp-column-naming](drizzle/timestamp-column-naming/SKILL.md) | `timestamptz`, UTC, `created_at` / `updated_at`, `<verb>ed_at` |
| [db-access-boundary](drizzle/db-access-boundary/SKILL.md) | where Drizzle and row types may be imported |

## Craft that belongs to no single library

| skill | owns |
| --- | --- |
| [logging](logging/SKILL.md) | pino: where to log, levels, bindings |
| [security-patterns](security-patterns/SKILL.md) | per-owner scoping, passwords, cookies, secrets |
| [remote-api-core](remote-api-core/SKILL.md) | outbound HTTP (the crawler): timeout, size cap, retry, SSRF |
| [construction-factories](construction-factories/SKILL.md) | one factory when a shape is built in two places |
| [polymorphism-over-switch](polymorphism-over-switch/SKILL.md) | `Record<TEnum, T>` instead of a switch |

## Adding one

If a second Nest service would follow the rule unchanged, it belongs here. If it names a table or
a product concept, it belongs in `be/skills/`.
