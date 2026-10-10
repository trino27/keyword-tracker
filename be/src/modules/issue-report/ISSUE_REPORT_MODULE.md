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
