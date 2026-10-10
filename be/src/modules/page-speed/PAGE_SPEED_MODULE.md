# Page-speed module

Measures queued pages with Google PageSpeed Insights (mobile, performance only) and writes what
Google said. Owns no table: the pages module owns `page_speed` and `seo_issues`; this module only
executes, the way the crawl module executes runs the clients module queues. Imported by
`AppModule` only — the seed process must never hold a worker it would exit under mid-call.

- **The queue is `page_speed`, one row per page.** A finished crawl queues its pages inside its
  finalize transaction (`PageSpeedQueueService.enqueueForWorker`) when a page has no row, failed
  last time, or was measured at least 24 h ago (`PAGE_SPEED_FRESH_FOR_MS`); the seed queues
  current pages that never had a row. There is no scheduler and no per-page button.
- **The worker** (`PageSpeedWorker`) starts only with `CRAWL_WORKER_ENABLED=true` AND a key. Two
  slots take turns from an in-process rate limiter (≥ 1 s apart), then claim one row with
  `SKIP LOCKED` under a 3-minute lease, only for pages still on their client's current run.
- **One request, no in-call retry** (`PsiClient`): the key in the `x-goog-api-key` header, never
  in the URL (the URL reaches error messages, logs and fixtures), 90 s timeout.
- **Which value per metric** (`extractMeasurement`): the page's own field data, else the site's
  (`originLoadingExperience`, or `loadingExperience` with `origin_fallback`), else the Lighthouse
  lab run — never for INP. Each value keeps its source. CrUX reports CLS × 100; the scale is read
  from the distribution bounds in the answer.
- **What Google's answer means** (`classifyPsiResponse`), and what happens to the row:

  | outcome                                                               | row                                                                            | queue                                            |
  | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------ |
  | 200 with LCP, CLS and a score                                         | `done`, measurement + findings in one transaction                              | continues                                        |
  | timeout, network, 5xx                                                 | back to `queued` after 1, 4, 16, 64 min; `failed PSI_UNAVAILABLE` at attempt 5 | continues                                        |
  | 429 / quota                                                           | released, attempt given back                                                   | every slot pauses for Retry-After or 60 s        |
  | key refused (400/403 key reasons)                                     | released, attempt given back                                                   | halted until restart; payloads say `keyRejected` |
  | Lighthouse could not load / page errored / other 4xx / no measurement | `failed` with its reason                                                       | continues                                        |

  Every failure path writes job columns only, so the last good measurement survives.
- **Findings** (`cwvIssuesOf`): a metric outside the good band yields exactly its one code —
  `CWV_*_POOR` (Important) or `CWV_*_NEEDS_IMPROVEMENT` (Improvement) — with `{value, max,
  source}`. The badge uses the same `cwvBandOf`, so a badge and its finding agree. Speed never
  enters the SEO score.
- **What is measured is the page's `final_url`**, not the sitemap URL: field data is keyed by the
  address visitors land on, and measuring a redirect measures the redirect.
- **No heartbeat.** One attempt is one bounded request (90 s) plus one transaction, so the 3-minute
  lease outlives it; a process that dies mid-call leaves the row to expire and be retaken as the
  next attempt, and past attempt 5 `failAbandonedForWorker` fails it `ABANDONED`.
- **A threshold that moves leaves stored findings behind.** The badge's band is computed at read
  time from `CWV_THRESHOLDS`; the finding was written at measurement time. They disagree until the
  page is re-measured — at the next crawl, for any measurement at least 24 h old. The catalogue's
  CWV bounds read the same constants (`seo-issue-catalogue.test.ts` holds them equal), so the two
  can only drift in time, never in value.
- **Quota.** One call per current page per crawl at most, and none for a page measured in the last
  24 h. The real per-crawl cost and latency are NOT measured yet — the work was done without a key,
  against synthesized answers; a 429 degrades to a shared pause, never to failed pages.
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
**A finished crawl queues its pages in the transaction that makes them current; a rolled-back or superseded finalize queues nothing.** Pinned by `crawl/services/crawl-run-executor/crawl-run-executor.service.spec.ts` -> "enqueues the run's pages in the finalize transaction" and "a superseded attempt enqueues nothing"; `be/test/e2e/page-speed.e2e-spec.ts` -> "a crawl queues its pages".

<!-- invariant: SPEED-002 -->
**A page is (re)queued only with no row, after a failure, or with a measurement at least 24 h old; a queued or running row is left alone, and re-queuing keeps the measurement.** Pinned by `pages/repositories/page-speed/page-speed.repository.int-spec.ts` -> "re-queues a measurement exactly 24 h old, not one 1 s younger", "re-queues a failed row with its attempts reset", "leaves a queued or running row alone", "keeps the measurement when re-queued"; `pages/services/page-speed-queue/page-speed-queue.service.spec.ts` -> "asks for pages measured a full day before now, in the given transaction".

<!-- invariant: SPEED-003 -->
**One slot holds a row at a time, only the attempt holding it writes its outcome, and a row abandoned five times fails `ABANDONED`.** Pinned by `page-speed.repository.int-spec.ts` -> "two concurrent claims take two different rows (SKIP LOCKED)", "a stale attempt's completion and failure write nothing", "reclaims a running row whose lease expired, as the next attempt", "fails a row abandoned at attempt 5 with ABANDONED, and never claims it"; the CHECK `page_speed_attempts_range`; `page-speed/workers/page-speed-worker/page-speed-worker.spec.ts` -> "runs at most 2 measurements at once".

<!-- invariant: SPEED-004 -->
**Only pages on their client's current run are claimed; any other row is left as it is.** Pinned by `page-speed.repository.int-spec.ts` -> "never claims a page its client's current run no longer has".

<!-- invariant: SPEED-005 -->
**Each metric takes this page's field data, else the site's, else the lab — INP never the lab — and keeps its source; the page's final URL is measured, on mobile.** Pinned by `page-speed/services/extract-measurement/extract-measurement.spec.ts` -> "takes URL field data when Google has it", "reads an origin fallback as the whole site, not as the page", "falls back to the origin per metric", "falls back to the lab for LCP and CLS, never for INP"; the CHECK `page_speed_inp_field_only`; `page-speed/services/page-speed-executor/page-speed-executor.service.spec.ts` -> "measures the page's final URL with the key, and writes the measurement with its findings"; `page-speed/services/psi-client/psi-client.spec.ts` -> "asks for mobile, performance only, with the page URL encoded". The extraction is pinned against SYNTHESIZED answers only — no key was available — so the comparison with a live answer is still owed.

<!-- invariant: SPEED-006 -->
**A measurement and its findings are written whole in one transaction, and a failed, released or abandoned attempt leaves the stored measurement byte-for-byte.** Pinned by `page-speed.repository.int-spec.ts` -> "refuses %s (%s)" (one row per CHECK) and "a failure, a release and an abandonment leave the measurement byte-for-byte"; `pages/services/page-speed-results/page-speed-results.service.spec.ts` -> "writes the measurement and the page findings in one transaction"; `page-speed-executor.service.spec.ts` -> "a failure never calls completeForWorker (%s)".

<!-- invariant: SPEED-007 -->
**A metric outside the good band is exactly one speed finding of its band's code, a good metric none, and only the speed worker writes them.** Pinned by `page-speed/services/cwv-issues/cwv-issues-of.spec.ts` -> "a metric outside the good band yields exactly its one code (%s %d → %s)", "never yields two codes for one metric", "takes severity from the catalogue: poor is a warning, needs improvement a notice"; `pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` -> "a speed replace leaves the page's crawl findings"; `be/test/e2e/page-speed.e2e-spec.ts` -> "every non-good badge in the list has its finding in the detail, and no good one does". "Never two per metric" is NOT a database constraint — a CHECK cannot see the page's other rows.

<!-- invariant: SPEED-008 -->
**A timeout, network error or 5xx is retried after 1, 4, 16, 64 minutes and fails `PSI_UNAVAILABLE` at the fifth; a page Google cannot test fails at once with its reason; every reason but `ABANDONED` is producible.** Pinned by `page-speed/services/retry-delay/retry-delay.spec.ts` -> "waits 1, 4, 16, 64 minutes after the 1st to 4th failure"; `page-speed-executor.service.spec.ts` -> "a transient failure is retried later, with its attempt spent", "the 5th transient failure gives up on the page", "a permanent failure fails the page with its reason"; `page-speed/services/classify-psi-response/classify-psi-response.spec.ts` -> "produces %s from some answer"; `psi-client.spec.ts` -> "one request, no retry, 90 s timeout".

<!-- invariant: SPEED-009 -->
**A 429 pauses every slot for `Retry-After` or 60 s, and the row in flight goes back with its attempt.** Pinned by `page-speed/services/rate-limiter/page-speed-rate-limiter.spec.ts` -> "a pause holds every slot"; `page-speed-executor.service.spec.ts` -> "a 429 pauses every slot and releases the row without spending an attempt"; `classify-psi-response.spec.ts` -> "a 429 pauses as long as Retry-After asks, in seconds or as a date" and "a 429 pauses for the default when Google names no Retry-After"; `page-speed.repository.int-spec.ts` -> "a release gives back the attempt". The pause is per process — the known limitation above.

<!-- invariant: SPEED-010 -->
**A key Google refuses halts every slot until restart, gives the row back, logs the cause without the key, and makes the API say `keyRejected`.** Pinned by `classify-psi-response.spec.ts` -> "a rejected key halts the queue rather than failing the page" and "a key Google refuses for %s is rejected too"; `page-speed-executor.service.spec.ts` -> "a rejected key halts the queue, marks the state and gives the row back" and "no log line and no stored error contains the key"; `page-speed-worker.spec.ts` -> "a rejected key halts both slots and leaves the rows to the queue"; `be/test/e2e/page-speed.e2e-spec.ts` -> "after Google rejects the key every row is still queued and the state is keyRejected" — the list's payload; the detail and the report reach the same `pageSpeedAvailabilityOf` and are not asserted end to end.

<!-- invariant: SPEED-011 -->
**Without a key the worker never starts and nothing asks Google, crawls still queue, and the API says `notConfigured`; with one it says `active`.** Pinned by `page-speed-worker.spec.ts` -> "does not start without a key" and "does not start with the worker flag off"; `be/src/infrastructure/config/page-speed-settings/page-speed-availability-of/page-speed-availability-of.spec.ts` -> "no key is notConfigured, a key is active, a rejected key is keyRejected"; `be/test/e2e/page-speed.e2e-spec.ts` -> "the rows stay queued and nothing asks Google". "Adding a key and restarting drains the queue" is NOT pinned by a test.

<!-- invariant: SPEED-012 -->
**The key travels only in the `x-goog-api-key` header — never in a URL, a log line, a stored error or a fixture.** Pinned by `psi-client.spec.ts` -> "sends the key in a header and never in the URL"; `page-speed-executor.service.spec.ts` -> "no log line and no stored error contains the key". The fixtures are guarded by `be/test/fixtures/record-pagespeed-fixtures.ts`, which refuses an answer that echoes the key, and by the manual `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` — no test runs it.

<!-- invariant: SPEED-013 -->
**Reading a screen never calls PageSpeed.** Pinned by `be/test/e2e/page-speed.e2e-spec.ts` -> "opening the list and the detail requests nothing from PageSpeed". The issue report's half is NOT pinned by a test: it rests on `IssueReportModule` importing nothing of this module.
