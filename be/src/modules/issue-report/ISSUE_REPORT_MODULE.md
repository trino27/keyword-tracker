# Issue-report module

`GET /api/clients/:id/issues` — every finding on one client's current crawl, as one snapshot.
A read model across three owners' tables (pages and `seo_issues`, `page_speed`, `site_checks`),
so it owns none of them.

- **One snapshot of the current run.** The current run is the client's latest succeeded or
  partial run — never a newer failed one, whose site checks describe pages that are not listed.
  A client with no finished crawl answers `generatedFrom: null` and no issues. The run, its
  pages' findings and its failed site checks are read in ONE read-only, repeatable-read
  transaction (`IssueReportRepository.snapshot`), so a crawl finishing mid-read cannot split the
  answer. "Current" is `CURRENT_RUN_STATUSES_SQL` (`be/src/persistence/sql/current-run-statuses.ts`),
  the fragment the pages list, the detail and the PageSpeed claim share; the PageSpeed state
  comes from the same `PageSpeedAvailabilityService` they inject.
- **Rows carry facts, not words.** Each row is `code`, `severity`, `details` and a `location`:
  a page, the whole site (a failed site check), or `allPages` — Google's whole-site Core Web
  Vitals figure, folded into one row per code with its page count (`collapseOriginFindings`)
  instead of the same row once per page. Each device's code folds on its own, and each finding
  is dated by its own device's measurement (the report joins `page_speed` on the code's
  strategy). Image delivery never folds: it is a lab estimate about one page's images, with no
  site figure behind it, and the `allPages` row is typed `TCwvSeoIssue`. The screen reads what / why / fix from the catalogue by code.
- **No server-side filters or pagination.** A client has at most 15 current pages, so a few
  hundred rows; filters and groupings are pure functions on the screen and never disagree with
  each other about the data.
- **Owner in every statement.** Each query joins `clients.user_id = scope.userId`; the service
  first asks `ClientsService.getClient`, so another user's client and a missing one are the
  same `404 CLIENT_NOT_FOUND` (the isolation matrix row `GET /api/clients/:id/issues`).

Pinned by `collapse-origin-findings.spec.ts`, `issue-report.repository.int-spec.ts` (current run
only, failed site checks only, current pages only, another user gets nothing) and
`be/test/e2e/issue-report.e2e-spec.ts`.

## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. The requirements live in `openspec/specs/be/src/modules/issue-report/spec.md`;
spec paths below are relative to `be/src/modules/issue-report/`.

<!-- invariant: REPORT-001 -->
**A client's report is one unfiltered, copy-free snapshot, answered only to its owner; another user's client is the same 404 as a missing one.** Pinned by `be/test/e2e/isolation-matrix.e2e-spec.ts` -> the row `GET /api/clients/:id/issues` and the static case "covers every route that takes an id or a clientId"; `repositories/issue-report/issue-report.repository.int-spec.ts` -> "answers another user's client with nothing"; `be/test/e2e/issue-report.e2e-spec.ts` -> "returns one snapshot of page, speed and site findings", "a client with no finished crawl has generatedFrom null and no issues", "the report carries the PageSpeed state" and "a missing client is a 404"; `be/test/e2e/page-speed.e2e-spec.ts` -> "after Google rejects the key every row is still queued and the state is keyRejected", which reads the report's `keyRejected`. That the three reads are one snapshot is the transaction in `IssueReportRepository.snapshot`, not a test.

<!-- invariant: REPORT-002 -->
**The report reads the client's current run only: its pages' findings and its FAILED site checks — never a newer failed run's, never passed or skipped ones.** Pinned by `issue-report.repository.int-spec.ts` -> "reads site checks of the current run only — not of a newer failed run", "reads only failed site checks" and "reads only current pages' findings".

<!-- invariant: REPORT-003 -->
**An origin-sourced Core Web Vitals finding is one whole-site row per code with its page count; URL and lab findings stay on their page; only a Core Web Vitals finding may be whole-site, so image delivery always stays at its page.** Pinned by `collapse-origin-findings.spec.ts` -> "keeps IMAGE_DELIVERY_INEFFICIENT at its page, and folds origin-sourced desktop CWV codes into one row each", and `issue-report.repository.int-spec.ts` -> "returns each finding once when both strategies are stored, with its own strategy's measured_at"; and by `services/collapse-origin-findings/collapse-origin-findings.spec.ts` -> "folds origin findings into one row per code with the page count", "keeps url and lab findings per page", "carries the details of the most recently measured page"; `be/test/e2e/issue-report.e2e-spec.ts` -> "an origin speed finding on 15 pages is one Whole site row"; `fe/src/Gateways/IssueReportGateway/IssueReportGateway.test.ts` -> "refuses a whole-site row that is not a speed finding". The "only speed" half is also the contract's type: the `allPages` location exists only on the speed variant.

<!-- invariant: REPORT-004 -->
**Reading a report makes no outbound request and writes nothing.** Pinned by `be/test/e2e/page-speed.e2e-spec.ts` -> "opening the list, the detail and the report requests nothing from PageSpeed and writes nothing" (no request to Google; `page_speed` unchanged). The database holds the other half: the snapshot transaction is `read only`, so a write inside it fails.
