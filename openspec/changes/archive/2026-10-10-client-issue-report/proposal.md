# A client's issues, in one report a marketer can act on

## Why

The brief asks for every issue across all of a client's pages: on which page, what it is, why it
matters, what to do — with a severity that says what to fix first, filtering or grouping, written
for a marketing person rather than a developer. Today the findings exist but are scattered: a
page's issues on its own detail screen, the site checks inside a crawl's run log, and nothing that
reads across a client. And every finding speaks the curated, precise language of the catalogue —
right for "Technical details", wrong as the first thing a marketer reads.

## What Changes

- `@app/contracts`: a required `plain: { what, why, fix }` on every page and site catalogue entry
  (65), in marketer voice, `fix` naming who acts; the curated label, hint, explanation and sources
  stay as Technical details. `IClientIssueReport` and its location union.
- `be/src/modules/issue-report` (new, owns no table): `GET /api/clients/:id/issues` — one snapshot
  of the current run's page findings, speed findings and failed site checks, origin-sourced speed
  findings collapsed to one Whole site row per code, scoped to the owner.
- `fe`: an Issues screen at `/issues` — client selector, rubric, By issue / By page, level, type
  and URL filters, all in the URL, every grouping and filter a pure function over the snapshot;
  Issues in the navigation; the list's issue count and the Clients screen open it.
- One name per severity — Critical / Important / Improvement — wherever severity is shown, from
  one `Record` (plan D28).
- The report carries PageSpeed's three-valued state and says what each means (plan D27).

## Capabilities

- `be/src/modules/issue-report` — REPORT-001 … REPORT-004 (new capability).
- `be/src/modules/page-analysis` — ANALYSIS-013 (new).
- `fe/src/Modules/Issues` — ISSUESUI-001 … ISSUESUI-006 (new capability).
- `fe/src/Modules/Pages` — PAGELIST-009 (new).
- `fe/src/Modules/Clients` — CLIENTSUI-006 (new).
- `fe/src/App` — SHELL-004 (modified).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-005 (modified, plan D28).

`_root/data-isolation` gains no delta: ISO-005 already requires the new route's matrix row, and
the matrix's static check fails without it — that is task 2.1.

The MODIFIED blocks restate each requirement whole; at archive they replace the requirement of the
same id in `specs/` by hand. VERIFY: `pnpm exec openspec validate client-issue-report` accepts them
against `[ID]`-form base requirements.

## Impact

`packages/contracts/src/domain/{seo,site,issue-report}/**`, `be/src/modules/issue-report/**`,
`be/src/app/app.module.ts`, `be/test/e2e/{isolation-matrix,issue-report}.e2e-spec.ts`,
`fe/src/{App/Router,Gateways/IssueReportGateway,ViewModels/IssueReportViewModel,Modules/Issues}/**`,
`fe/src/Core/Constants/severityLabel.ts`, `fe/src/Modules/{_Shared/AppLayout,Pages/PagesTable,Clients/ClientsTable,Clients/RunLog/SiteChecks,PageDetail/IssuesSection}/**`,
`README.md`.

Depends on `issue-catalogue-owners` (owners decide the type filter) and `page-speed-measurement`
(speed findings carry the `source` the collapse reads). Independent of `core-web-vitals-display`.

Plan: `docs/_plans/issue-report-and-pagespeed.md`, phase 4.
