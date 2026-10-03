---
name: env-structure
description: Environment file structure — one root .env.example copied to .env, read by docker compose and by local scripts
---

# Environment File Structure

**One scheme: a single root `.env.example` is committed, copied to `.env` (git-ignored), and that
one file is read by both `docker compose` and the local scripts.** There is no per-workspace env
file to keep in step.

```
cp .env.example .env
```

## What `.env.example` holds

- every variable `docker-compose.yml` substitutes (`${VAR}`): database name, user and password,
  the published ports, the site address Caddy serves;
- every variable the backend reads at runtime, in the names it reads them (`DATABASE_URL`, the
  port, the log level);
- no real secret — placeholder values that work on a laptop, so a fresh clone runs after the
  `cp`.

A new variable is added to `.env.example` **in the same change** that reads it, with a one-line
comment saying what it is. A variable in code and absent from the example is the one a new
checkout cannot start without.

## Who reads it

| reader | how |
| --- | --- |
| `docker compose` | automatically reads `.env` beside `docker-compose.yml` for `${VAR}` substitution |
| the `be` service | `environment:` / `env_file: .env` in compose; inside a container the host is the service name (`postgres`), not `localhost` |
| `pnpm dev:be` and other local scripts | load the same `.env`, with the host as `localhost` |
| the fe build | only variables Vite exposes to the browser (the `VITE_` prefix) reach the bundle, and their values are public — never put a secret behind that prefix |

**The host differs, the file does not.** `DATABASE_URL` for a container points at `postgres`; the
same variable for a script on the host points at `localhost`. Keep one name and derive the host
(a `DB_HOST` variable with a compose override, or the URL assembled from parts) rather than
keeping two copies of the file.

## Shell environment wins over the file

Compose resolves a variable from the shell before the file. A stale `export DATABASE_URL=…` in a
terminal silently overrides `.env`; when a value does not seem to apply, run
`docker compose config` and read the resolved result.

## Rewriting an env file from a script

An env file is UTF-8 and its comments may carry non-ASCII characters. A script that reads one,
substitutes a value and writes it back MUST name the encoding on the READ, not only on the write:

- PowerShell 5.1: `Get-Content <path> -Raw -Encoding UTF8`. Bare `Get-Content -Raw` decodes with
  the system ANSI codepage, so every multibyte character comes back as mojibake and the write
  then persists it as UTF-8. The damage COMPOUNDS on every run, and because values are never
  touched nothing fails and nobody notices.
- Node: `fs.readFileSync(p, 'utf8')` / `fs.writeFileSync(p, s, 'utf8')`.
