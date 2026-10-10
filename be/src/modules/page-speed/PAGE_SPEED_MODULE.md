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
