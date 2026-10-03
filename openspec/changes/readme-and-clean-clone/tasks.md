# Tasks — readme-and-clean-clone

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 8. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. README (8a)

- [ ] 1.1 Rewrite `README.md` to one page per the plan §18: run from a clean clone, local development and checks, decisions and why, the listing-page interpretation, unfinished and next steps, AI tools. Verify: `git grep -n -E "change-me|demo-password" -- README.md` lists only the documented demo-password line
- [ ] 1.2 The README's command block is the one 2.1 runs verbatim. Verify: diff the block against the commands used in 2.1

## 2. Clean clone (8b)

- [ ] 2.1 With the main stack stopped (`docker compose down`, never `-v`), in a fresh directory, with `COMPOSE_PROJECT_NAME=skt-clean` exported so the pinned project name does not reuse the developer's database volume: `git clone <repo-url> skt-clean && cd skt-clean && git checkout feat/keyword-tracker && cp .env.example .env && export COMPOSE_PROJECT_NAME=skt-clean && docker compose up -d --build && docker compose run --rm seed`. Verify: every command exits 0 and `docker volume ls` lists `skt-clean_postgres-data`
- [ ] 2.2 API answers with seeded data. Verify: `curl -s -c c.txt -H 'Content-Type: application/json' -d '{"email":"semrush.manager@example.com","password":"demo-password-change-me"}' -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/login` prints 200, and `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20'` has `total` ≥ 15
- [ ] 2.3 Browser walk of the four screens as both seed users (plan 7d acceptance). Verify: no console error in the browser devtools, every screen renders data
- [ ] 2.4 Every finding fixed with a `fix(...)` commit and an `AMENDED during implementation:` line in the owning change's tasks. Verify: `git log --oneline` shows the fixes; `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
