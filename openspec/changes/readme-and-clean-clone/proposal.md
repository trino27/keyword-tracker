# README and clean-clone verification

## Why

The brief asks for a one-page README with the exact commands from a clean clone to a working app
with the seed loaded, the decisions and why, what is unfinished, and the AI tools used — and for
the result to be verified on a clean clone. A README written from memory drifts from the commands
that actually work; running it verbatim in a fresh directory is the only check.

## What Changes

- `README.md` rewritten to one page: run commands (`cp .env.example .env`,
  `docker compose up -d --build`, `docker compose run --rm seed`, http://localhost:8080, the two
  seed emails and the demo password variable), decisions, the listing-page interpretation with the
  run log as evidence, next steps (RLS, sitemap-less fallback, network SEO checks, Playwright), AI
  tools (Claude Code).
- A clean-clone run of exactly those commands; anything it finds is fixed and recorded as an
  `AMENDED during implementation:` line in the change that owned it.

No requirement changes (`skip_specs: true`).

## Impact

- `README.md` only, plus any fix the clean clone exposes.
