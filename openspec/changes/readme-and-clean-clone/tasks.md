# Tasks — readme-and-clean-clone

Generated from the plan `keyword-tracker` (docs/_plans-archive/), Phase 8. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. README (8a)

- [x] 1.1 Rewrite `README.md` to one page per the plan §18: run from a clean clone, local development and checks, decisions and why, the listing-page interpretation, unfinished and next steps, AI tools. Verify: `git grep -n -E "change-me|demo-password" -- README.md` lists only the documented demo-password line
- [x] 1.2 The README's command block is the one 2.1 runs verbatim. Verify: diff the block against the commands used in 2.1
  AMENDED during implementation: the README clones the repository's default branch; 2.1 ran the same commands with `--branch feat/keyword-tracker` before the merge, from the local repository (the branch is pushed once, at the end).

## 2. Clean clone (8b)

- [x] 2.1 With the main stack stopped (`docker compose down`, never `-v`), in a fresh directory, with `COMPOSE_PROJECT_NAME=skt-clean` exported so the pinned project name does not reuse the developer's database volume: `git clone <repo-url> skt-clean && cd skt-clean && git checkout feat/keyword-tracker && cp .env.example .env && export COMPOSE_PROJECT_NAME=skt-clean && docker compose up -d --build && docker compose run --rm seed`. Verify: every command exits 0 and `docker volume ls` lists `skt-clean_postgres-data`
  VERIFIED: build 33 s, seed 92 s on an empty `skt-clean_postgres-data` — both live sites crawled (15 posts each), 154 pairs × 365 days = 56 210 snapshots. The README's figure says "about 56 000": the live sites change, so the exact count does too.
- [x] 2.2 API answers with seeded data. Verify: `curl -s -c c.txt -H 'Content-Type: application/json' -d '{"email":"semrush.manager@example.com","password":"demo-password-change-me"}' -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login` prints 200, and `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20'` has `total` ≥ 15
  VERIFIED: 200; `total` 15, the first row with five keywords and a best position. `/sign-in`, `/pages`, `/clients` and `/pages/1` all served the SPA.
- [ ] 2.3 Browser walk of the four screens as both seed users (plan 7d acceptance). Verify: no console error in the browser devtools, every screen renders data
  NOT DONE HERE: no browser in this environment. The real gateways were driven against the seeded stack instead (tracker-screens 4.3); the walk is for a person before merging.
- [x] 2.4 Every finding fixed with a `fix(...)` commit and an `AMENDED during implementation:` line in the owning change's tasks. Verify: `git log --oneline` shows the fixes; `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
  VERIFIED: the clean run found nothing to fix. All checks green: lint, typecheck, 49 contracts + 315 backend + 126 frontend unit tests, 100 database tests.
