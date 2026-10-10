# Tasks — page-speed-measurement

Generated from the plan `issue-report-and-pagespeed` (`docs/_plans/`), Phase 2. Correct it through
the plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`. A test named "first" is run and seen failing for the stated reason,
then lands in the same commit as the code that turns it green.

`issue-catalogue-owners` must be closed before task 1.1.

## 1. Outbound requests declare their own bounds (2a) — REMOTE-002, REMOTE-003

- [x] 1.1 Write first in `be/src/infrastructure/remote-api/remote-api.core.spec.ts`: "honours a per-call timeout", "makes exactly one request with maxRetries 0 on a 503", "sends caller headers beside the User-Agent, and cannot replace it"; they fail (options ignored). Verify: `pnpm --filter be test:ci -- src/infrastructure/remote-api` fails on those three
  AMENDED during implementation: the third case is named "sends caller headers beside the
  User-Agent, which they cannot replace".
- [x] 1.2 `remote-api.core.ts`: `IRemoteGetOptions` gains `timeoutMs?` (capped at 90 000), `maxRetries?`, `headers?`; defaults from `REMOTE_API_LIMITS`, so every existing caller is unchanged. Verify: `pnpm --filter be test:ci -- src/infrastructure/remote-api src/modules/crawl && pnpm --filter be test:db -- crawl`
  AMENDED during implementation: the cap was missing at first — a declared `timeoutMs` was used
  as given — and landed after review in `3bb1f74` (`REMOTE_API_LIMITS.maxTimeoutMs`), pinned by
  `remote-api.core.spec.ts` -> "caps a declared timeout at 90 s". The same commit stops caller
  headers following a redirect to another origin: "drops caller headers on a redirect to another
  origin, keeps them on the same one".
- [x] 1.3 Commit: `feat(remote-api): a caller may declare its own timeout, retries and headers`. Verify: `pnpm lint && pnpm typecheck && pnpm test`
  Committed as `12b7192`.

## 2. The key, configured and optional (2b) — SPEED-011

- [x] 2.1 Write first: `be/src/infrastructure/config/env.schema/env.schema.spec.ts` → "accepts an empty PAGESPEED_API_KEY"; `be/src/infrastructure/config/page-speed-settings/page-speed-settings.spec.ts` → "an empty or blank key is null; a key is trimmed"; `page-speed-availability-of.spec.ts` → "no key is notConfigured, a key is active, a rejected key is keyRejected" (D27); all fail. Verify: `pnpm --filter be test:ci -- src/infrastructure/config` fails
  AMENDED during implementation: "accepts an empty PAGESPEED_API_KEY" PASSED before the change —
  the schema already lets through variables it does not model — so it never failed first; the key
  was added to the schema anyway, so the variable is declared rather than tolerated. The settings
  spec is `page-speed-settings/page-speed-settings-of/page-speed-settings-of.spec.ts` (factory
  `pageSpeedSettingsFrom`, cases "an empty or blank key (%j) is null" and "keeps a key, trimmed"),
  and the availability spec sits in `page-speed-settings/page-speed-availability-of/`, which adds
  "no key stays notConfigured even after a rejection was recorded" — each tested unit in its own
  folder (`a19b6c2`).
- [x] 2.2 Contracts `page-speed/page-speed-availability-state.enum.ts` (`PAGE_SPEED_AVAILABILITY_STATES`) and `page-speed/page-speed-availability.interface.ts` in `src/index.ts`. `env-keys.constant.ts` (`PAGESPEED_API_KEY`), `env.schema.ts` (optional string), `page-speed-settings/` (token `PAGE_SPEED_SETTINGS`, `IPageSpeedSettings`, factory, `PageSpeedRuntimeState` with `markKeyRejected()`, pure `pageSpeedAvailabilityOf(settings, runtime)`, global `PageSpeedSettingsModule`), imported by `app.module.ts` and `seed.module.ts`; `be/test/support/create-test-app.ts` gains `pageSpeedApiKey?` and ALWAYS overrides the token with `{ apiKey: options.pageSpeedApiKey ?? null }`, so a developer's real key in `.env` never reaches a test. Verify: `pnpm --filter be test:ci -- src/infrastructure/config && pnpm --filter be typecheck`
- [x] 2.3 `.env.example`: `PAGESPEED_API_KEY=` with a comment naming the README section; `docker-compose.yml` `be` environment: `PAGESPEED_API_KEY: ${PAGESPEED_API_KEY:-}`. Verify: `grep -n "^PAGESPEED_API_KEY=$" .env.example && docker compose config | grep PAGESPEED_API_KEY`
- [x] 2.4 Clean-clone boot still works with the empty key. Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
- [x] 2.5 Commit: `feat(config): an optional PageSpeed key, empty by default`. Verify: `git show --stat HEAD`
  AMENDED during implementation: 2b, 2c and 2d were committed together as `f1d82ea
  feat(pages): every crawled page is queued for PageSpeed` — all three add to the one contracts
  index, and none is green without the others' exports.

## 3. The `page_speed` table and its queue (2c) — SPEED-002, SPEED-003, SPEED-004, SPEED-006, SPEED-007

- [x] 3.1 Contracts: `page-speed/page-speed-status.enum.ts`, `page-speed/page-speed-error.constant.ts` (plan §8's six codes with their `reason`; `PAGE_SPEED_ERROR_CODES`, `TPageSpeedErrorCode`), in `src/index.ts`. `be/src/shared/page-speed-queue/page-speed-queue.constant.ts`: `PAGE_SPEED_QUEUED_CHANNEL`, `PAGE_SPEED_FRESH_FOR_MS`, `PAGE_SPEED_MAX_ATTEMPTS`. Verify: `pnpm --filter @app/contracts run build && pnpm typecheck`
- [x] 3.2 Write first `be/src/modules/pages/repositories/page-speed/page-speed.repository.int-spec.ts`: "refuses a half measurement" (`it.each` over each CHECK of plan §3), "refuses a lab INP", "refuses attempts 6", "deleting a page deletes its row", "two concurrent claims take two different rows (SKIP LOCKED)", "a stale attempt's completion and failure write nothing", "re-queues a measurement exactly 24 h old, not one 1 s younger", "re-queues a failed row", "leaves a queued or running row alone", "keeps the measurement when re-queued", "never claims a page its client's current run no longer has", "a failure, a release and an abandonment leave the measurement byte-for-byte", "a release gives back the attempt", "fails a row abandoned at attempt 5 with ABANDONED, and never claims it"; all fail (no table). Verify: `pnpm --filter be test:db -- page-speed` fails
  AMENDED during implementation: the three refusals are one `it.each`, "refuses %s (%s)", with a
  row per CHECK (a half measurement, a lab INP, an INP without its source, a running row without a
  lease, a failed row that does not say why, a done row with no measurement, attempts 6, a
  negative LCP, a performance score over 100). "re-queues a failed row" reads "re-queues a failed
  row with its attempts reset". Added beyond the list: "queues a page that has no row", "claims a
  due row with the page's final URL as attempt 1", "does not claim a row before its not-before
  time", "reclaims a running row whose lease expired, as the next attempt", "writes a completion
  and marks the row done", and the backfill case of 4.3.
- [x] 3.3 `be/src/persistence/schema/tables/page-speed/page-speed.schema.ts` exactly as plan §3, registered in `database-schema.ts`. Then `pnpm db:generate` and READ `be/drizzle/0014_*.sql`: two `CREATE TYPE`, one `CREATE TABLE "page_speed"` with the FK `ON DELETE cascade`, eight `CHECK`s, one partial index, nothing touching another table. Then `pnpm db:migrate`. Never edit the generated file. Verify: `pnpm db:generate` prints the new file and `pnpm db:migrate` exits 0
  VERIFIED: the generated file is `be/drizzle/0014_third_maverick.sql` — two `CREATE TYPE`, one
  table, eight CHECKs, the FK with `ON DELETE cascade`, one partial index (`page_speed_claim_idx`).
- [x] 3.4 `be/src/modules/pages/repositories/page-speed/page-speed.repository.ts`: `enqueueForWorker(tx, pageIds, staleBefore)` (plan §10.4), `backfillCurrentForWorker()`, `notifyQueued(tx)`, `claimNextForWorker(leaseMs)` (plan §10.8), `failAbandonedForWorker()`, `completeForWorker(tx, pageId, attempt, measurement)`, `recordFailureForWorker(pageId, attempt, write: IPageSpeedJobWrite)`, `releaseForWorker(pageId, attempt, notBefore)` — `IPageSpeedJobWrite` has no measurement keys. Verify: `pnpm --filter be test:db -- page-speed`
- [x] 3.5 Write first in `be/src/modules/pages/repositories/seo-issues/seo-issues.repository.int-spec.ts`: "a speed replace leaves the page's crawl findings"; it fails (no method). Then `replacePageSpeedFindingsForWorker(tx, pageId, rows: TNewPageSpeedIssue[])` deleting `code in (PAGE_SPEED_ISSUE_CODES)`. Verify: `pnpm --filter be test:db -- seo-issues`
  AMENDED during implementation: built in phase 1, in `0977ec2`, beside the crawl's replace
  (`issue-catalogue-owners` 2.2).
- [x] 3.6 `be/src/modules/pages/services/page-speed-queue/page-speed-queue.service.ts` (`enqueueForWorker(tx, pageIds, now)` computing `staleBefore`, then notifying; `backfillForWorker()`), `services/page-speed-results/page-speed-results.service.ts` (claim, abandon, complete — measurement and findings in one transaction —, fail, release; no method writes `pages`); both in `pages.module.ts` providers and exports. Verify: `pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be lint`
- [x] 3.7 The migration applies over a seeded database. Verify: `docker compose up -d --build` over the existing volume, then `docker compose exec postgres psql -U tracker -d seo_tracker -c "\d page_speed"`
  VERIFIED on the dev stack's existing volume: `\d page_speed` shows the PK, the partial claim
  index, the eight CHECKs and the cascading FK.
- [x] 3.8 Commits: `feat(db): a page_speed row per page, its queue and its last measurement` · `feat(pages): the PageSpeed queue — enqueue, claim, fence, give back` · `feat(pages): a speed replace touches only speed findings`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
  AMENDED during implementation: one commit, `f1d82ea` (see 2.5); the speed replace was already in
  `0977ec2` (see 3.5).

## 4. The crawl and the seed queue pages (2d) — SPEED-001, SEED-006

- [x] 4.1 Write first in `be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.spec.ts`: "enqueues the run's pages in the finalize transaction" (the same `tx` object, after the pages, before the outcome) and "a superseded attempt enqueues nothing"; they fail (no call). Verify: `pnpm --filter be test:ci -- crawl-run-executor` fails on those two
- [x] 4.2 `crawl-run-executor.service.ts` `finalize`: `PageSpeedQueueService.enqueueForWorker(tx, [...pageIds.values()], new Date())` after `applyRunResultsForWorker`. Verify: `pnpm --filter be test:ci -- src/modules/crawl && pnpm --filter be test:db -- crawl crawl-runs`
- [x] 4.3 Write first in `be/src/seed/seed-runner/seed-runner.int-spec.ts`: "the backfill queues each current page once, and a second run queues none"; it fails (zero rows). Then `seed-runner.service.ts` calls `backfillForWorker()` after the crawls and `ISeedReport` carries the count; `seed.ts` prints `pagespeed  N pages queued`. Verify: `pnpm --filter be test:db -- seed-runner && pnpm --filter be test:ci -- src/seed`
  The same property is also pinned one level down, by `page-speed.repository.int-spec.ts` ->
  "queues each current page once, and a second run queues none".
- [x] 4.4 On the stack. Verify: `docker compose up -d --build && docker compose run --rm seed`, then `docker compose exec postgres psql -U tracker -d seo_tracker -c "select status, count(*) from page_speed group by status"` shows every current page `queued`; a second `docker compose run --rm seed` prints `pagespeed  0 pages queued`
  VERIFIED on the dev stack: the first seed printed `pagespeed  834 pages queued`, the second
  `pagespeed  0 pages queued`; `page_speed` holds 834 rows, all `queued`, none measured (no key).
- [x] 4.5 Commits: `feat(crawl): a finished crawl queues its pages for PageSpeed` · `feat(seed): queue every current page that has never been queued`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
  AMENDED during implementation: part of `f1d82ea` (see 2.5).

## 5. The PageSpeed client: request, classification, extraction (2e) — SPEED-005, SPEED-007, SPEED-008, SPEED-012

- [x] 5.1 Record fixtures with a local key: `be/test/fixtures/record-pagespeed-fixtures.ts` (new) writes `be/test/fixtures/pagespeed/{url-field,origin-only,lab-only,key-invalid,failed-document}.json` and manifest entries keyed by the exact request URL, and refuses to write a file containing the key; `rate-limited.synthesized.json` and `server-error.synthesized.json` are written by hand from Google's documented error format. While recording, settle plan §8's and §10.2's VERIFY items (origin fallback flag, CLS scale, metric keys, error shapes, header auth) and amend the plan where the answers differ. If no key is available, say so here as `AMENDED during implementation:` and synthesize every fixture from the documentation. Verify: `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing
  AMENDED during implementation: no PageSpeed key was available, so the success and document
  fixtures are SYNTHESIZED from Google's documented format:
  `{url-field,origin-only,lab-only,failed-document,errored-document,server-error}.synthesized.json`.
  Two answers were RECORDED against the live API on 2026-10-10 without a key:
  `rate-limited.json` (a keyless request → 429 `RESOURCE_EXHAUSTED`, daily quota 0; the project
  number redacted to zeros) and `key-invalid.json` (a bad key sent in the `x-goog-api-key`
  header → 400 `API_KEY_INVALID` — which also VERIFIES that Google reads the key from the header,
  D23). The CLS scale is read from the CrUX distribution bounds in the answer (10/25 ⇒ ×100), so a
  wrong guess about the scale cannot pass silently. Fixtures are served by
  `FixtureHttpTransport.override` in the specs and e2e, not by manifest entries.
  `record-pagespeed-fixtures.ts` exists and refuses a file echoing the key, for recording real
  answers once a key exists. The grep prints nothing.
- [x] 5.2 Write first, each in its own folder under `be/src/modules/page-speed/services/`: `extract-measurement.spec.ts` ("takes URL field data when Google has it", "falls back to the origin per metric", "falls back to the lab for LCP and CLS, never for INP", "returns null without LCP or CLS"); `classify-psi-response.spec.ts` (plan §10.5's precedence, and `it.each` over `PAGE_SPEED_ERROR_CODES` minus `ABANDONED`: "produces %s from its fixture"); `cwv-issues-of.spec.ts` (§10.1's boundaries: "a metric outside the good band yields exactly its one code; a good one yields none", "never yields two codes for one metric", "takes severity from the catalogue"); `retry-delay.spec.ts` ("1, 4, 16, 64 minutes"); all fail (no modules). Verify: `pnpm --filter be test:ci -- src/modules/page-speed` fails
  AMENDED during implementation: names as built — "returns null without LCP or CLS from any
  source"; the it.each is "produces %s from some answer" (one table of inputs, each code must be
  among the outcomes); "a metric outside the good band yields exactly its one code (%s %d → %s)"
  plus a separate "yields nothing for three good metrics"; "waits 1, 4, 16, 64 minutes after the
  1st to 4th failure". Added: "reads an origin fallback as the whole site, not as the page" and
  "reads CLS as is when its distribution bounds are unscaled" (the CLS scale of 5.1).
- [x] 5.3 The four pure functions, plus `constants/page-speed-worker.constant.ts` (slots 2, poll, lease 3 min, minimum interval, default pause 60 s, backoff base 1 min and factor 4, PSI timeout 90 s, response cap). Verify: `pnpm --filter be test:ci -- src/modules/page-speed`
- [x] 5.4 Write first `services/psi-client/psi-client.spec.ts`: "sends the key in a header and never in the URL", "one request, no retry, a 90 s bound", "builds the same URL for the same page every time"; fail. Then `psi-client.ts` extending `RemoteApiCore` as `SiteHttpClient` does; `page-speed.module.ts` (not yet imported by `AppModule`). Verify: `pnpm --filter be test:ci -- src/modules/page-speed`
  AMENDED during implementation: "one request, no retry, 90 s timeout"; the deterministic URL is
  pinned by "asks for mobile, performance only, with the page URL encoded", which asserts the
  exact URL, and by the static `PsiClient.requestUrl` the e2e specs key their answers on. Added:
  "hands a network failure back instead of throwing it".
- [x] 5.5 The shared manifest did not disturb the crawl. Verify: `pnpm --filter be test:ci -- src/modules/crawl && pnpm --filter be test:db -- crawl`
  VERIFIED, NOT BUILT: no manifest entry was added (see 5.1); the crawl suites pass unchanged.
- [x] 5.6 Commits: `test(fixtures): recorded PageSpeed answers, without the key` · `feat(page-speed): read a PageSpeed answer into a measurement, with its source` · `feat(page-speed): classify what Google answered` · `feat(page-speed): a PageSpeed client with the key in a header`. Verify: `pnpm lint && pnpm typecheck && pnpm test`
  AMENDED during implementation: 2e and 2f landed as one commit, `531d9ac feat(page-speed):
  measure queued pages with PageSpeed Insights`, plus the fix `abef83e fix(fixtures): type the
  PageSpeed recorder's response and body`.

## 6. The worker (2f) — SPEED-003, SPEED-008, SPEED-009, SPEED-010, SPEED-011, SPEED-013, PAGES-013

- [x] 6.1 Write first `services/rate-limiter/page-speed-rate-limiter.spec.ts` (fake clock): "spaces requests by the minimum interval", "a pause holds every slot", "a halt stops every slot"; fail. Then the limiter. Verify: `pnpm --filter be test:ci -- page-speed-rate-limiter`
  AMENDED during implementation: "a halt stops every slot, waiting or not"; added "does not wait
  when the interval has already passed", "keeps the longer of two pauses" and "a caller that stops
  waiting gets no turn".
- [x] 6.2 Write first `services/page-speed-executor/page-speed-executor.service.spec.ts`: one case per row of plan §9's failure table, "a failure never calls completeForWorker", "a 429 releases the row without spending an attempt", "a rejected key halts the limiter and releases the row", "no log line and no stored error contains the key" (serialises every logger call); fail. Then the executor. Verify: `pnpm --filter be test:ci -- page-speed-executor`
  AMENDED during implementation: names as built — "a failure never calls completeForWorker (%s)",
  "a 429 pauses every slot and releases the row without spending an attempt", "a rejected key
  halts the queue, marks the state and gives the row back" (the runtime state is marked here, by
  the executor, not by the worker). Added "a shutdown mid-call gives the row back with its
  attempt".
- [x] 6.3 Write first `workers/page-speed-worker/page-speed-worker.spec.ts` (fake listener and executor, as `crawl-worker.spec.ts`): "does not start without a key", "does not start with the worker flag off", "waits on the limiter before claiming", "a rejected key halts both slots, leaves the row queued and marks the runtime state keyRejected", "stop() waits for both slots"; fail. Then the worker with its own `PgNotificationListener` in `page-speed.module.ts` providers; `app.module.ts` imports `PageSpeedModule` (and `seed.module.ts` and `crawl.module.ts` do not). Verify: `pnpm --filter be test:ci -- src/modules/page-speed && pnpm --filter be lint`
  AMENDED during implementation: as built — "runs at most 2 measurements at once"; "a rejected key
  halts both slots and leaves the rows to the queue" (the runtime-state half is the executor's, see
  6.2), which also shows a slot claims nothing once the limiter halts — there is no separate
  "waits on the limiter before claiming" case; and "stops claiming on shutdown, and aborts what is
  in flight" instead of waiting for both slots: a shutdown aborts the in-flight request and the
  executor gives the row back, rather than holding the process up to 90 s.
- [x] 6.4 Write first `be/test/e2e/page-speed.e2e-spec.ts` (fixture transport, `pageSpeedApiKey: 'test-key'`, `PageSpeedWorker.runOnce()`): "a crawl queues its pages", "a measured page has its speed findings in the detail", "a speed finding counts among the issues and leaves the score and the order unchanged", "without a key the rows stay queued", "after Google rejects the key every row is still queued and the runtime state is keyRejected" (fixture `key-invalid.json`; `core-web-vitals-display` adds the payload half), "opening the list and the detail requests nothing from PageSpeed"; they fail until 6.3 lands. Verify: `pnpm --filter be test:db -- page-speed`
  AMENDED during implementation: "without a key" is its own `describe`, case "the rows stay queued
  and nothing asks Google"; the rejected-key case reads "… and the state is keyRejected" and
  already asserts the list's `pageSpeedAvailability`. After review (`8bd0589`) the read-path case
  is "opening the list, the detail and the report requests nothing from PageSpeed and writes
  nothing", and the executor gained "an unexpected error is a failed attempt, never a row left
  running"; the classifier "a spent daily quota pauses for an hour".
- [x] 6.5 `be/test/e2e/crawl.e2e-spec.ts`: the `checksFailed` comparison counts crawl-owned findings only (ANALYSIS-010 / plan I6). Verify: `pnpm --filter be test:db -- crawl`
- [x] 6.6 Without a key on the stack. Verify: `docker compose up -d --build`, then `docker compose logs be | grep -i pagespeed` shows "not configured" once and no request
  VERIFIED: one line, `PageSpeed not configured (no PAGESPEED_API_KEY); pages stay queued`, and
  no PageSpeed request in the log.
- [x] 6.7 With a key on the stack (skip with `AMENDED during implementation:` if none is available, naming what was verified instead). Verify: set `PAGESPEED_API_KEY` in `.env`, `docker compose up -d --build`, then `docker compose exec postgres psql -U tracker -d seo_tracker -c "select status, count(*), count(measured_at) from page_speed group by status"` shows `done` rows with measurements and `-c "select code, count(*) from seo_issues where code like 'CWV\_%' group by code"` lists only the six speed codes; compare one stored LCP with the PageSpeed web UI for the same URL
  AMENDED during implementation: skipped — no key was available. Verified instead: the whole
  measure-and-write path end to end in `page-speed.e2e-spec.ts` against the synthesized answers,
  and Google's real refusals (`rate-limited.json`, `key-invalid.json`) recorded live. The live run
  against a real key is left to a later phase of the plan.
- [x] 6.8 Shutdown order. Verify: `docker compose restart be && docker compose logs --tail 50 be` shows both workers stopped before exit and no pool-ended error
  AMENDED during implementation: without a key only the crawl worker runs, so a restart logs
  `Crawl worker stopped`, then a clean start, and no pool error (run during phase 5). The
  PageSpeed worker's own shutdown is pinned by `page-speed-worker.spec.ts` -> "stops claiming on
  shutdown, and aborts what is in flight"; its log line under a real key is unobserved.
- [x] 6.9 Commits: `feat(page-speed): an in-process rate limiter with a shared pause` · `feat(page-speed): measure one queued page and write it with its findings` · `feat(page-speed): a worker that drains the queue, stopped by a missing or rejected key` · `test(e2e): a crawl is measured, and reading never calls Google`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
  AMENDED during implementation: one commit with 2e, `531d9ac` (see 5.6).

## 7. The README says how to turn it on (2g)

- [ ] 7.1 `README.md`: the optional key step in "Run it from a clean clone"; a "PageSpeed Insights" bullet group under "Decisions, and why" (automatic and cached, at most daily, mobile and why, failure behaviour, no key, a rejected key — its symptom "PageSpeed key rejected" and its cure, fix the key in `.env` and restart —, the per-process pause, positions still simulated and PageSpeed the only Google call, how to get and restrict a key); "Not done" loses "the network ones (Lighthouse, Core Web Vitals)". `docs/decisions.md`: calls per crawl and typical latency as measured in 6.7. Verify: every command the README names exists — `pnpm run` lists it or it is a `docker compose` command
  NOT DONE: the `docs/decisions.md` half. The README half is done (`f4e76bb`), and phase 5 added
  the PageSpeed decisions to `docs/decisions.md`, but calls per crawl and typical latency need a
  real key (6.7) and are written there as not yet measured.
- [x] 7.2 From a clean clone. Verify: clone into a scratch directory, `git checkout feat/issue-report-and-pagespeed`, `cp .env.example .env`, `docker compose -p skt-clean up -d --build && docker compose -p skt-clean run --rm seed`, then `docker compose -p skt-clean logs be | grep -i "not configured"`; `docker compose -p skt-clean down` (no `-v`)
  VERIFIED on 2026-10-10 from a fresh clone at `2891b42`, under the project name `skt-fresh` on a
  brand-new volume: `skt-clean` still held an old volume from an earlier session, so its `migrate`
  failed on data that was not clean, and volumes are never removed. `cp .env.example .env`, with
  only `POSTGRES_PORT`/`WEB_PORT` moved to 55434/8090 beside the running dev stack. Health
  `{"status":"ok","database":"up"}`; the API logged "PageSpeed not configured (no
  PAGESPEED_API_KEY); pages stay queued"; the seed printed both crawls succeeded and `pagespeed  0
  pages queued` (the crawls had already queued their own pages); `page_speed` held 30 rows, all
  `queued`.
- [x] 7.3 Commit: `docs(readme): PageSpeed — the optional key, mobile, and what failure looks like`. Verify: `git show --stat HEAD`
  Committed as `f4e76bb`.

## 8. Phase acceptance

- [x] 8.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
- [ ] 8.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`; in a browser a measured page's SEO issues section shows its speed findings with their sentences, and its score is the one it had before
  NOT DONE: no browser, and no measured page on the stack without a key. Health passes; the
  sentences are pinned by `describeIssue.test.ts`, the score staying put by
  `page-speed.e2e-spec.ts` -> "a speed finding counts among the issues and leaves the score and
  the order unchanged".
- [x] 8.3 Archive and deposit are plan phase 5: harvest into `be/src/modules/page-speed/PAGE_SPEED_MODULE.md` (new), `PAGES_MODULE.md`, `CRAWL_MODULE.md` per plan §18 before archiving; after it, fold REMOTE-002/003 by hand, rewrite the new headings into the `[ID]` form, deposit. Verify: `pnpm exec openspec validate --specs` and `git grep -n "invariant: SPEED-" -- '*.md'`
  DONE in phase 5. REMOTE-002/003 were already deposited in
  `practices/be/remote-api-core/SKILL.md`; their pinning lines were updated there rather than
  deposited a second time in `CRAWL_MODULE.md`.
