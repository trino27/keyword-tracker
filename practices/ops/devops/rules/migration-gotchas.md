---
name: migration-gotchas
description: PostgreSQL enum migration pitfalls and Drizzle migration rules in Docker
---

# Migration Gotchas

## PostgreSQL Enum Rule
`ADD VALUE` to an enum and `SET DEFAULT` using that new value MUST be in **separate transactions** (separate .sql files).

```sql
-- 0004_sync.sql — first transaction
ALTER TYPE "public"."crawl_run_status_enum" ADD VALUE 'partial';

-- 0005_set_default.sql — separate transaction
ALTER TABLE "crawl_runs" ALTER COLUMN "status" SET DEFAULT 'partial';
```

**Why:** PostgreSQL doesn't allow using a newly added enum value in the same transaction it was added. The `ADD VALUE` must commit first.

## Migrate Container WORKDIR
Know the production image's `WORKDIR` before writing the migrate command. If it is `/app/be`:
```yaml
command: ["node", "dist/src/migrate.js"]
```
Do NOT use `sh -c "cd be && node ..."` — you are already in `/app/be`.

## Drizzle Rules
1. NEVER write raw `.sql` migration files — always use `pnpm db:generate` from schema changes
2. NEVER manually edit `be/drizzle/meta/_journal.json`
3. NEVER use `drizzle-kit push --force` — it bypasses the generated/reviewed migration files. Apply changes only via generated migrations (`db:generate` → review the SQL → `db:migrate`).
4. `db:generate` may prompt interactively — needs a real terminal
