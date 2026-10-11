# Page-speed module

Measures queued pages with Google PageSpeed Insights, on mobile (performance, and Lighthouse's
SEO and accessibility categories, in one request) and on desktop (performance only), and writes
what Google said. Owns no table: the pages module owns `page_speed` and `seo_issues`; this module only
executes, the way the crawl module executes runs the clients module queues; the queue's shapes
(`IClaimedPageSpeed`, `IPageSpeedJobWrite`, `IPageSpeedMeasurementWrite`) are the pages
module's, in `be/src/modules/pages/interfaces/page-speed.interface.ts`, and nothing here
imports its repository. Imported by `AppModule` only — the seed process must never hold a
worker it would exit under mid-call.

- **The queue is `page_speed`, one row per page and device** (`strategy`, keyed
  `(page_id, strategy)`). A finished crawl queues both devices of its pages inside its finalize
  transaction (`PageSpeedQueueService.enqueueForWorker`) when a device's row is missing, failed
  last time, or was measured at least 24 h ago (`PAGE_SPEED_FRESH_FOR_MS`) — each device on its
  own; the seed queues current pages missing a device's row. There is no scheduler and no
  per-page button.
- **Two devices, one queue** (desktop-core-web-vitals). A row's job, fence and measurement are
  its device's: the claim returns the strategy, every fence matches page, strategy and attempt,
  and a measurement replaces only its own device's CWV codes (`PAGE_SPEED_CODES_BY_STRATEGY`).
  Lighthouse speaks for mobile alone (lighthouse-checks D16): the desktop request asks for
  `category=performance` only, a desktop completion carries no Lighthouse record and never runs
  the Lighthouse replace, and `page_speed_lighthouse_mobile_only` refuses a desktop row with any
  Lighthouse column — otherwise every desktop answer would erase the page's `LH_*` findings and
  move its score. The list, its badges, the score and Lighthouse's checks read the mobile row;
  the detail carries both (`pageSpeedByStrategy`) and the report dates each finding by its own
  device. The key became composite in three generated migrations — `0016` the column (default
  `'mobile'`, which every existing row was), `0017` the key swap (its one hand edit uncomments
  drizzle-kit's own `DROP CONSTRAINT "page_speed_pkey"`, which it cannot name itself), `0018`
  the default dropped — so a forgotten strategy is refused, not silently mobile.
- **What desktop costs, measured live 2026-10-11:** two PageSpeed calls per page per crawl
  instead of one. The worker drains 4–5 measurements a minute whatever the device, so a
  15-post crawl now takes 6–7 minutes to measure instead of 3–4 (semrush.com's 15 desktop rows:
  15:38:05–15:41:03). A desktop measurement's field values matched Google's live answer for the
  same URL (LCP 3056 ms, INP 255 ms, CLS 0.10, site data); the lab score was 65 against 64.
- **The worker** (`PageSpeedWorker`) starts only with `CRAWL_WORKER_ENABLED=true` AND a key. Two
  slots take turns from an in-process rate limiter (≥ 1 s apart), then claim one row with
  `SKIP LOCKED` under a 3-minute lease, only for pages still on their client's current run —
  "current" spelled by `CURRENT_RUN_STATUSES_SQL` (`be/src/persistence/sql/current-run-statuses.ts`),
  the same fragment the list, the detail and the report read, so the worker never measures a page
  the screens no longer show. The queue is fair, not FIFO: the user served longest ago first,
  then that user's client served longest ago, then — within that client — its mobile rows
  before its desktop rows (the `psi_strategy_enum` order), then the oldest row. A claim of
  either device serves its client. A client added behind another user's hundreds of pages is
  measured within minutes, not after them; observed live, each audit client's desktop rows
  started only once its mobile rows were done.
- **Deleting a client aborts its measurements.** The delete cascades to its `page_speed` rows,
  so nothing of it is claimed again; a call already in flight finishes, and its completion,
  fenced on the row, writes nothing.
- **One request, no in-call retry** (`PsiClient`): the key in the `x-goog-api-key` header, never
  in the URL (the URL reaches error messages, logs and fixtures), 90 s timeout.
- **Which value per metric** (`extractMeasurement`): the page's own field data, else the site's
  (`originLoadingExperience`, or `loadingExperience` with `origin_fallback`), else the Lighthouse
  lab run — never for INP. Each value keeps its source. CrUX reports CLS × 100; the scale is read
  from the distribution bounds in the answer.
- **What Google's answer means** (`classifyPsiResponse`), and what happens to the row:

  | outcome                                                               | row                                                                                                                    | queue                                                                             |
  | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
  | 200 with LCP, CLS and a score                                         | `done`, measurement + findings in one transaction                                                                      | continues                                                                         |
  | timeout, network, 5xx                                                 | back to `queued` after 1, 4, 16, 64 min; `failed PSI_UNAVAILABLE` at attempt 5                                         | continues                                                                         |
  | 429 / quota                                                           | released, attempt given back                                                                                           | every slot pauses for Retry-After or 60 s — an hour when the DAILY quota is spent |
  | key refused (400/403 key reasons)                                     | released, attempt given back                                                                                           | halted until restart; payloads say `keyRejected`                                  |
  | Lighthouse could not load / page errored / other 4xx / no measurement | `failed` with its reason                                                                                               | continues                                                                         |
  | an unexpected error (a bug, the database failing mid-write)           | a failed attempt: back to `queued` with the same backoff, `failed PSI_UNAVAILABLE` at attempt 5 — never left `running` | continues                                                                         |

  Every failure path writes job columns only, so the last good measurement survives.

- **Findings** (`cwvIssuesOf(strategy, …)`): a metric outside the good band yields exactly its
  one code on its device — `CWV_*_POOR` (Important) or `CWV_*_NEEDS_IMPROVEMENT` (Improvement),
  with a `_DESKTOP` twin of the same level and bound for desktop — with `{value, max,
source}`. The badge uses the same `cwvBandOf`, so a badge and its finding agree. Speed never
  enters the SEO score.
- **Lighthouse's verdicts** (`extractLighthouse`, lighthouse-checks). The same answer carries
  Lighthouse 13's SEO and accessibility categories; every audit Lighthouse SCORES in them (weight
  above 0 — 66 in 13.5.0) is an `LH_*` catalogue code, looked up by the audit id the answer uses:

  | the audit in the answer                | recorded                                      |
  | -------------------------------------- | --------------------------------------------- |
  | `binary`, score 1                      | `lighthouse_judged`                           |
  | `binary`, score 0                      | `lighthouse_judged` + one `seo_issues` row    |
  | `notApplicable`                        | `lighthouse_not_applicable`                   |
  | `error`, any other mode, or absent     | neither — nothing is invented for it          |
  | scored, but no catalogue code reads it | nothing; `warn` once per audit id per process |

  `lighthouse_failed` counts the findings, so the score reads `page_speed` alone. An answer with
  neither category is NOT an error: the Core Web Vitals are stored, the three Lighthouse columns
  and both category scores are null, and the page's earlier `LH_*` findings are removed with the
  rest of the replace — a finding with no record behind it could not be shown as a check (D20).
  Lighthouse's findings are checks and count in the page's score; the CWV ones still do not.
  The extraction is pinned against `lighthouse-url-field.json` and `lighthouse-lab-only.json`,
  live answers recorded 2026-10-11. Weights are never read from an answer, which reports 0 for
  every audit that did not apply: they are Lighthouse's configuration, snapshotted in
  `packages/contracts/src/domain/seo/catalogue/lighthouse/lighthouse-audits.fixture.json`.

- **Images that could be lighter** (`extractImageDelivery`, `speedIssuesOf`; image-delivery-finding).
  The mobile answer carries Lighthouse 13's `image-delivery-insight` audit (id read from live
  answers on 2026-10-11): it fails when its `score` is below 1, its total savings is
  `details.debugData.wastedBytes` (what its own "Est savings of … KiB" rounds), and each image is
  a `details.items[]` row with `url` and `wastedBytes`. `IMAGE_DELIVERY_INEFFICIENT` is raised
  when the audit fails with at least the catalogue's `min`, 102 400 bytes, and lists up to ten
  images, the largest saving first. The classifier reads it beside the measurement with its own
  schema. An answer without the audit, or with one that does not parse, is still a measurement,
  just without this finding, and `extractMeasurement` never reads it. It is mobile's alone: the
  desktop overload of `speedIssuesOf` takes no image input. It is a pageSpeed code, unscored, and
  not a Lighthouse one, because Lighthouse's owner is scored and a performance opportunity in the
  score would contradict "speed never enters the score". It is a lab estimate about one page, so
  the report never folds it into a whole-site row. Audited live on 2026-10-11: 32 firings on 104 pages, every one
  confirmed by a fresh PageSpeed answer for the same URL (tally in `PAGE_ANALYSIS_MODULE.md`).
- **Diagnostics** (`extractDiagnostics`): real visitors' TTFB (`EXPERIMENTAL_TIME_TO_FIRST_BYTE`,
  page else site, never lab), the good and poor share of visits per metric from the SAME data as
  the metric's value (none for a lab value), and the LCP breakdown from `lcp-breakdown-insight` —
  the element and up to four phases. Those phases are from Lighthouse's unthrottled trace and sum
  to no LCP the page shows. None of this is required for a measurement; each part is written on
  every measurement, null included, so a row's figures always come from one answer.
- **What is measured is the page's `final_url`**, not the sitemap URL: field data is keyed by the
  address visitors land on, and measuring a redirect measures the redirect.
- **No heartbeat.** One attempt is one bounded request (90 s) plus one transaction, so the 3-minute
  lease outlives it; a process that dies mid-call leaves the row to expire and be retaken as the
  next attempt, and past attempt 5 `failAbandonedForWorker` fails it `ABANDONED` — swept at most
  once a minute (`PAGE_SPEED_ABANDON_SWEEP_MS`), not on every idle poll. An error the worker
  did not expect is not left to that path: it is recorded at once as a failed attempt.
- **A threshold that moves leaves stored findings behind.** The badge's band is computed at read
  time from `CWV_THRESHOLDS`; the finding was written at measurement time. They disagree until the
  page is re-measured — at the next crawl, for any measurement at least 24 h old. The catalogue's
  CWV bounds read the same constants (`seo-issue-catalogue.test.ts` holds them equal), so the two
  can only drift in time, never in value.
- **Quota.** One call per current page per crawl at most, and none for a page measured in the last
  24 h. The real per-crawl cost and latency are NOT measured yet — the work was done without a key,
  against synthesized answers; a 429 degrades to a shared pause, never to failed pages. A spent
  DAILY quota (Google names a per-day limit, or `dailyLimitExceeded` / `quotaExceeded`) pauses
  for an hour instead of a minute: asking again every minute would ask all day for nothing.
- **What the screens say** comes from one `PageSpeedAvailabilityService`
  (`be/src/infrastructure/config/page-speed-settings/page-speed-availability/`), which the list,
  the detail and the report inject: the configured key plus what the worker learned since boot.
- **Known limitation:** the 429 pause, the halt and the key-rejected state live in process
  memory — right for the one API process docker-compose runs.

Pinned by the specs beside each service, `be/src/modules/pages/repositories/page-speed/
page-speed.repository.int-spec.ts` (CHECKs, fence, SKIP LOCKED, freshness boundary, current-run
claim, failures keep the measurement) and `be/test/e2e/page-speed.e2e-spec.ts` (a crawl is
measured; badges agree with findings; reading never calls Google; no key; a refused key).

## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Unless another path is named, the requirement lives in
`openspec/specs/be/src/modules/page-speed/spec.md`; spec paths below are relative to
`be/src/modules/`.

<!-- invariant: SPEED-001 -->

**A finished crawl queues its pages, on both devices, in the transaction that makes them current; a rolled-back or superseded finalize queues nothing.** Pinned by `crawl/services/crawl-run-executor/crawl-run-executor.service.spec.ts` -> "enqueues the run's pages in the finalize transaction" and "a superseded attempt enqueues nothing"; `be/test/e2e/page-speed.e2e-spec.ts` -> "a crawl queues both strategies of each page"; `page-speed-queue.service.spec.ts` -> "queues every strategy".

<!-- invariant: SPEED-002 -->

**A page is (re)queued on a device only with no row for it, after a failure, or with a measurement at least 24 h old — each device judged on its own; a queued or running row is left alone, and re-queuing keeps the measurement.** Pinned by `pages/repositories/page-speed/page-speed.repository.int-spec.ts` -> "re-queues a strategy measured exactly 24 h ago and leaves the other", "enqueue with both strategies queues both rows of a new page", "re-queues a measurement exactly 24 h old, not one 1 s younger", "re-queues a failed row with its attempts reset", "leaves a queued or running row alone", "keeps the measurement when re-queued"; `pages/services/page-speed-queue/page-speed-queue.service.spec.ts` -> "asks for pages measured a full day before now, in the given transaction".

<!-- invariant: SPEED-003 -->

**One slot holds a row at a time, only the attempt holding it writes its outcome, and a row abandoned five times fails `ABANDONED`.** Pinned by `page-speed.repository.int-spec.ts` -> "two concurrent claims take two different rows (SKIP LOCKED)", "a stale attempt's completion and failure write nothing", "reclaims a running row whose lease expired, as the next attempt", "fails a row abandoned at attempt 5 with ABANDONED, and never claims it"; the CHECK `page_speed_attempts_range`; `page-speed/workers/page-speed-worker/page-speed-worker.spec.ts` -> "runs at most 2 measurements at once".

<!-- invariant: SPEED-004 -->

**Only pages on their client's current run are claimed; any other row is left as it is.** Pinned by `page-speed.repository.int-spec.ts` -> "never claims a page its client's current run no longer has".

<!-- invariant: SPEED-005 -->

**Each metric takes this page's field data, else the site's, else the lab — INP never the lab — and keeps its source; the page's final URL is measured, on the row's own device.** The device is pinned by `page-speed/services/psi-client/psi-client.spec.ts` -> "a desktop request asks for strategy=desktop and category=performance only, the key only in the header". The rest is pinned by `page-speed/services/extract-measurement/extract-measurement.spec.ts` -> "takes URL field data when Google has it", "reads an origin fallback as the whole site, not as the page", "falls back to the origin per metric", "falls back to the lab for LCP and CLS, never for INP"; the CHECK `page_speed_inp_field_only`; `page-speed/services/page-speed-executor/page-speed-executor.service.spec.ts` -> "measures the page's final URL with the key, and writes the measurement with its findings"; `page-speed/services/psi-client/psi-client.spec.ts` -> "asks for mobile performance, SEO and accessibility in one request, with the page URL encoded". The extraction is pinned against SYNTHESIZED answers only — no key was available — so the comparison with a live answer is still owed.

<!-- invariant: SPEED-006 -->

**A measurement and its findings are written whole in one transaction, and a failed, released or abandoned attempt leaves the stored measurement byte-for-byte.** Pinned by `page-speed.repository.int-spec.ts` -> "refuses %s (%s)" (one row per CHECK) and "a failure, a release and an abandonment leave the measurement byte-for-byte"; `pages/services/page-speed-results/page-speed-results.service.spec.ts` -> "writes the measurement, its speed findings and its Lighthouse findings in one transaction"; `page-speed-executor.service.spec.ts` -> "a failure never calls completeForWorker (%s)".

<!-- invariant: SPEED-007 -->

**A metric outside the good band is exactly one speed finding of its band's code on its device, a good metric none, only the speed worker writes them, and a measurement replaces only its own device's codes.** The device half is pinned by `cwv-issues-of.spec.ts` -> "a desktop metric outside the good band yields its desktop code" and `pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` -> "a desktop replace leaves the page's mobile, Lighthouse and crawl findings" and "a mobile replace leaves its desktop findings". The rest is pinned by `page-speed/services/cwv-issues/cwv-issues-of.spec.ts` -> "a metric outside the good band yields exactly its one code (%s %d → %s)", "never yields two codes for one metric", "takes severity from the catalogue: poor is a warning, needs improvement a notice"; `pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` -> "a speed replace leaves the page's crawl findings"; `be/test/e2e/page-speed.e2e-spec.ts` -> "every non-good badge in the list has its finding in the detail, and no good one does". "Never two per metric" is NOT a database constraint — a CHECK cannot see the page's other rows.

<!-- invariant: SPEED-008 -->

**A timeout, network error or 5xx is retried after 1, 4, 16, 64 minutes and fails `PSI_UNAVAILABLE` at the fifth; a page Google cannot test fails at once with its reason; every reason but `ABANDONED` is producible.** Pinned by `page-speed/services/retry-delay/retry-delay.spec.ts` -> "waits 1, 4, 16, 64 minutes after the 1st to 4th failure"; `page-speed-executor.service.spec.ts` -> "a transient failure is retried later, with its attempt spent", "the 5th transient failure gives up on the page", "a permanent failure fails the page with its reason", "an unexpected error is a failed attempt, never a row left running"; `page-speed/services/classify-psi-response/classify-psi-response.spec.ts` -> "produces %s from some answer"; `psi-client.spec.ts` -> "one request, no retry, 90 s timeout".

<!-- invariant: SPEED-009 -->

**A 429 pauses every slot for `Retry-After` or 60 s — an hour when the daily quota is spent — and the row in flight goes back with its attempt.** Pinned by `page-speed/services/rate-limiter/page-speed-rate-limiter.spec.ts` -> "a pause holds every slot"; `page-speed-executor.service.spec.ts` -> "a 429 pauses every slot and releases the row without spending an attempt"; `classify-psi-response.spec.ts` -> "a 429 pauses as long as Retry-After asks, in seconds or as a date", "a 429 pauses for the default when Google names no Retry-After" and "a spent daily quota pauses for an hour"; `page-speed.repository.int-spec.ts` -> "a release gives back the attempt". The pause is per process — the known limitation above.

<!-- invariant: SPEED-010 -->

**A key Google refuses halts every slot until restart, gives the row back, logs the cause without the key, and makes the API say `keyRejected`.** Pinned by `classify-psi-response.spec.ts` -> "a rejected key halts the queue rather than failing the page" and "a key Google refuses for %s is rejected too"; `page-speed-executor.service.spec.ts` -> "a rejected key halts the queue, marks the state and gives the row back" and "no log line and no stored error contains the key"; `page-speed-worker.spec.ts` -> "a rejected key halts both slots and leaves the rows to the queue"; `be/test/e2e/page-speed.e2e-spec.ts` -> "after Google rejects the key every row is still queued and the state is keyRejected", which reads the list's and the report's payloads; the detail reaches the same `PageSpeedAvailabilityService` and is asserted at unit level only.

<!-- invariant: SPEED-011 -->

**Without a key the worker never starts and nothing asks Google, crawls still queue, and the API says `notConfigured`; with one it says `active`.** Pinned by `page-speed-worker.spec.ts` -> "does not start without a key" and "does not start with the worker flag off"; `be/src/infrastructure/config/page-speed-settings/page-speed-availability-of/page-speed-availability-of.spec.ts` -> "no key is notConfigured, a key is active, a rejected key is keyRejected"; `page-speed-availability/page-speed-availability.service.spec.ts` -> "answers from the configured key and what the worker learned since"; `be/test/e2e/page-speed.e2e-spec.ts` -> "the rows stay queued and nothing asks Google". "Adding a key and restarting drains the queue" is NOT pinned by a test.

<!-- invariant: SPEED-012 -->

**The key travels only in the `x-goog-api-key` header — never in a URL, a log line, a stored error or a fixture.** Pinned by `psi-client.spec.ts` -> "sends the key in a header and never in the URL"; `page-speed-executor.service.spec.ts` -> "no log line and no stored error contains the key". The fixtures are guarded by `be/test/fixtures/record-pagespeed-fixtures.ts`, which refuses an answer that echoes the key, and by the manual `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` — no test runs it.

<!-- invariant: SPEED-013 -->

**Reading a screen never calls PageSpeed.** Pinned by `be/test/e2e/page-speed.e2e-spec.ts` -> "opening the list, the detail and the report requests nothing from PageSpeed and writes nothing".

<!-- invariant: SPEED-014 -->
**Users take turns, then their clients, then — within a client — mobile rows before desktop rows, then rows by age; a user or client never served goes first, and a claim of either device serves it; a claim takes one row, page and device, and writes its outcome to that row alone.** Pinned by `pages/repositories/page-speed/page-speed.repository.int-spec.ts` -> "a client queued later takes turns with another client's backlog", "a user with many clients does not stand in front of another user", "a user measured recently waits behind one not served yet", "within one client, due mobile rows are claimed before its desktop rows", "a claim of a client's desktop row serves the client" and "a stale attempt on the desktop row writes nothing to the mobile row of the same page and attempt number".

<!-- invariant: SPEED-020 -->

**A page has at most one `page_speed` row per device, each queued, claimed and completed on its own; a row must name its device, a desktop row holds no Lighthouse data, and a desktop measurement never touches the page's Lighthouse record or findings.** Pinned by `pages/repositories/page-speed/page-speed.repository.int-spec.ts` -> "holds one row per page and strategy", "refuses a row without a strategy", "refuses a desktop row with %s", "deleting a page deletes both rows" and "claims a desktop row with its strategy"; `pages/services/page-speed-results/page-speed-results.service.spec.ts` -> "a desktop completion writes its speed findings and never calls the Lighthouse replace"; `page-speed-executor.service.spec.ts` -> "a desktop claim completes the desktop arm with no Lighthouse record"; `be/test/e2e/page-speed.e2e-spec.ts` -> "a desktop measurement leaves the page's Lighthouse findings, its score and its place in the list". The CHECK `page_speed_lighthouse_mobile_only` and the composite key `page_speed_pk` hold it in the database.
