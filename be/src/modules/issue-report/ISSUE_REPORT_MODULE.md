# Issue-report module

`GET /api/clients/:id/issues` — every finding on one client's current crawl, as one snapshot.
A read model across three owners' tables (pages and `seo_issues`, `page_speed`, `site_checks`),
so it owns none of them.

- **One snapshot of the current run.** The current run is the client's latest succeeded or
  partial run — never a newer failed one, whose site checks describe pages that are not listed.
  A client with no finished crawl answers `generatedFrom: null` and no issues.
- **Rows carry facts, not words.** Each row is `code`, `severity`, `details` and a `location`:
  a page, the whole site (a failed site check), or `allPages` — Google's whole-site speed figure,
  folded into one row per code with its page count (`collapseOriginFindings`) instead of the
  same row once per page. The screen reads what / why / fix from the catalogue by code.
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
**A client's report is one unfiltered, copy-free snapshot, answered only to its owner; another user's client is the same 404 as a missing one.** Pinned by `be/test/e2e/isolation-matrix.e2e-spec.ts` -> the row `GET /api/clients/:id/issues` and the static case "covers every route that takes an id or a clientId"; `repositories/issue-report/issue-report.repository.int-spec.ts` -> "answers another user's client with nothing"; `be/test/e2e/issue-report.e2e-spec.ts` -> "returns one snapshot of page, speed and site findings", "a client with no finished crawl has generatedFrom null and no issues", "the report carries the PageSpeed state" and "a missing client is a 404". The report's `keyRejected` is NOT asserted end to end — only `active`; the state comes from the same `pageSpeedAvailabilityOf` the pages list's e2e pins.

<!-- invariant: REPORT-002 -->
**The report reads the client's current run only: its pages' findings and its FAILED site checks — never a newer failed run's, never passed or skipped ones.** Pinned by `issue-report.repository.int-spec.ts` -> "reads site checks of the current run only — not of a newer failed run", "reads only failed site checks" and "reads only current pages' findings".

<!-- invariant: REPORT-003 -->
**An origin-sourced speed finding is one whole-site row per code with its page count; URL and lab findings stay on their page; only a speed finding may be whole-site.** Pinned by `services/collapse-origin-findings/collapse-origin-findings.spec.ts` -> "folds origin findings into one row per code with the page count", "keeps url and lab findings per page", "carries the details of the most recently measured page"; `be/test/e2e/issue-report.e2e-spec.ts` -> "an origin speed finding on 15 pages is one Whole site row"; `fe/src/Gateways/IssueReportGateway/IssueReportGateway.test.ts` -> "refuses a whole-site row that is not a speed finding". The "only speed" half is also the contract's type: the `allPages` location exists only on the speed variant.

<!-- invariant: REPORT-004 -->
**Reading a report makes no outbound request and writes nothing.** NOT pinned by a test — the planned e2e case "reading the report requests nothing and writes nothing" was not written. It rests on structure: `IssueReportRepository` has only read methods, and `IssueReportModule` imports `ClientsModule` and nothing that holds `PsiClient`.
