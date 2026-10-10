# Every crawled page is measured by PageSpeed Insights, automatically

## Why

The brief asks for Google PageSpeed Insights to run for crawled pages without a button, with the
results stored so that opening a screen never calls the API, and with a decided behaviour for an
API that is rate limited, slow and fallible. The key must come from `.env`, with an empty
placeholder committed, and a clean clone must still run.

Two shapes were rejected in the interview (plan D4): measuring inside the crawl pipeline (a 90 s
call per page breaks the crawl's 60 s lease and three attempts, and a Google outage would fail
crawls `CRAWL_ABANDONED`), and a periodic sweeper (no guaranteed moment a page is queued, so gaps
are silent). What remains is the shape the crawl already uses: a queue row written in the same
transaction that makes the page current, drained by its own worker under a lease and a fence.

## What Changes

- `@app/contracts`: `PAGE_SPEED_STATUSES`, `PAGE_SPEED_ERRORS` (code → plain reason).
- Database: table `page_speed` (one row per page: queue entry and last good measurement), two
  enums, eight CHECKs, one partial index — migration `0014`, generated.
- `be/src/modules/pages` (owner of the table): `PageSpeedRepository`, `PageSpeedQueueService`
  (crawl and seed enqueue), `PageSpeedResultsService` (the worker's claim/complete/fail/release),
  `SeoIssuesRepository.replacePageSpeedFindingsForWorker`.
- `be/src/modules/crawl`: the finalize transaction enqueues the run's pages and notifies.
- `be/src/seed`: enqueues every current page that has no row; does not wait for measurements.
- `be/src/modules/page-speed` (new, owns no table): the PSI client (key in a header, 90 s, no
  in-call retry), the response classifier and measurement extractor, the finding derivation, an
  in-process rate limiter with a shared 429 pause and a halt, the executor, the worker.
- `be/src/infrastructure/remote-api`: a caller may declare its own timeout, retry count and extra
  headers; the defaults are unchanged.
- Configuration: `PAGESPEED_API_KEY` (optional, empty in `.env.example`, passed by compose), a
  `PAGE_SPEED_SETTINGS` provider, an in-process `PageSpeedRuntimeState` the worker marks when
  Google rejects the key, and `pageSpeedAvailabilityOf` answering the three-valued state
  `notConfigured | active | keyRejected` (plan D27; contracts `PAGE_SPEED_AVAILABILITY_STATES`,
  `IPageSpeedAvailability`). The screens read it in the next two changes.
- README: how to get a key, mobile and why, what failure looks like, and the symptom of a rejected
  key ("PageSpeed key rejected", measurements paused) with its cure.

Speed findings land in `seo_issues` under phase 1's codes, so the page's issue count and its SEO
issues section show them at once. The badges and the Speed block are the next change.

## Capabilities

- `be/src/modules/page-speed` — SPEED-001 … SPEED-013 (new capability).
- `be/src/modules/pages` — PAGES-013 (new).
- `be/src/seed` — SEED-006 (new).
- `be/src/infrastructure/remote-api` — REMOTE-002, REMOTE-003 (modified).

The queue's invariants live in the page-speed capability although the pages module owns the
table, as CRAWL-001..003 live in the crawl capability although the clients module owns
`crawl_runs`: a requirement belongs to the behaviour it constrains.

The MODIFIED blocks restate each requirement whole; at archive they replace the requirement of the
same id in `specs/` by hand. VERIFY: `pnpm exec openspec validate page-speed-measurement` accepts
them against `[ID]`-form base requirements.

## Impact

`packages/contracts/src/domain/page-speed/**`, `be/src/persistence/schema/tables/page-speed/**`,
`be/drizzle/0014_*`, `be/src/modules/{pages,crawl,page-speed}/**`, `be/src/seed/**`,
`be/src/infrastructure/{remote-api,config}/**`, `be/src/shared/page-speed-queue/**`,
`be/test/{support,e2e,fixtures}/**`, `.env.example`, `docker-compose.yml`, `README.md`.

Depends on `issue-catalogue-owners` (the speed codes and the crawl's owner-scoped replace).
`core-web-vitals-display` and `client-issue-report` depend on it.

Plan: `docs/_plans/issue-report-and-pagespeed.md`, phase 2.
