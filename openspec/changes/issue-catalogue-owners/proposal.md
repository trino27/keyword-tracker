# The issue catalogue says which process writes each code

## Why

Core Web Vitals findings are going to live in `seo_issues` beside the crawl's findings, under
codes in the same shared catalogue — so the pages-list counts, the page's issues section and the
issue report read one table and agree without a second read path (plan D6). Today that is
impossible to do safely, for three reasons the code makes concrete:

- `CHECKS` is typed `{ [K in TSeoIssueCode]: TCheck<K> }`: a catalogue code without a check does
  not compile, so a speed code would demand a crawl check that cannot exist.
- `ACTIVE_ISSUE_CODES` is the whole catalogue. `evaluateChecks` iterates it, and
  `composePageChecks` lists every entry as a check — six speed codes would surface on every page
  as "not yet checked".
- `SeoIssuesRepository.replaceForPagesForWorker` deletes EVERY finding of a re-fetched page. A
  re-crawl would erase the PageSpeed worker's findings, and the badge on screen would contradict
  the issue list beside it until the next measurement.

So before anything writes a speed finding, every code names the one process that writes it, each
writer's code set is derived from that, and the crawl is made unable to touch a code it does not
own.

## What Changes

- `@app/contracts`: `ISeoIssueDefinition.owner: 'crawl' | 'pageSpeed'`, required; every
  existing entry `'crawl'`. Six new entries, `CWV_{LCP,INP,CLS}_{NEEDS_IMPROVEMENT,POOR}`, owner
  `'pageSpeed'`, warning for poor and notice for needs-improvement, each bounded by
  `CWV_THRESHOLDS`. Derived `CRAWL_ISSUE_CODES` / `PAGE_SPEED_ISSUE_CODES`; `TRunIssueCode`,
  `TPageIssueCode` and `ACTIVE_ISSUE_CODES` computed over crawl codes. `CWV_METRICS`,
  `CWV_BANDS`, `CWV_SOURCES`, `CWV_THRESHOLDS`, `cwvBandOf`, `CWV_ISSUE_CODES`,
  `ICwvMeasurement`. `IPageCheck.code` narrows to crawl codes.
- `be/src/modules/page-analysis`: the registry is keyed by crawl-owned codes.
- `be/src/modules/pages`: the crawl's replace becomes `replaceCrawlFindingsForWorker` and deletes
  only crawl-owned codes; the check composition is unchanged in behaviour and narrowed in type.
- `fe`: the page gateway parses a speed finding (with its `source`); the `DESCRIBE` sentences
  move to `Core/Helpers/DescribeIssue/` and gain one per speed code.

Nothing a user sees changes: no process writes a speed code yet.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-012 (new); ANALYSIS-001, ANALYSIS-007, ANALYSIS-011
  (modified).
- `be/src/modules/pages` — PAGES-012 (modified).

The MODIFIED blocks restate each requirement whole, with its earlier AMENDED paragraphs. The
delta headings follow `openspec/README.md` §3a; at archive each block replaces the requirement of
the same id in `specs/` by hand, as the heading rewrite already is. VERIFY:
`pnpm exec openspec validate issue-catalogue-owners` accepts a MODIFIED block whose base
requirement is written in the `[ID]` form; if it refuses, record that here with an
`AMENDED during implementation:` line and keep the blocks for the by-hand fold.

## Impact

`packages/contracts/src/domain/{seo,page-speed,pages}/**`,
`be/src/modules/page-analysis/services/checks/checks.registry.ts`,
`be/src/modules/pages/{repositories/seo-issues,services/crawl-results,services/page-checks}/**`,
`be/test/support/seed-page.ts`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`,
`fe/src/Core/Helpers/DescribeIssue/**`,
`fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts`.

First of four changes; `page-speed-measurement` depends on it.

Plan: `docs/_plans/issue-report-and-pagespeed.md`, phase 1.
