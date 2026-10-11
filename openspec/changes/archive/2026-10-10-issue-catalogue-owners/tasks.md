# Tasks — issue-catalogue-owners

Generated from the plan `issue-report-and-pagespeed` (`docs/_plans/`), Phase 1. Correct it through
the plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`. A test named "first" is run and seen failing for the stated reason,
then lands in the same commit as the code that turns it green.

## 1. Ownership and the Core Web Vitals vocabulary (1a) — ANALYSIS-012, ANALYSIS-001, ANALYSIS-011, PAGES-012

- [x] 1.1 Write first in `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts`: "partitions the catalogue by owner: every code in exactly one writer's set" and "each CWV code's max is its metric's threshold for its band"; they fail (no `owner`, no CWV entries). Verify: `pnpm --filter @app/contracts test:ci` fails on those two
- [x] 1.2 Write first `packages/contracts/src/domain/page-speed/cwv-band-of/cwv-band-of.util.test.ts`: the boundary `it.each` of plan §10.1 (2500 good, 2501 needs improvement, 4000 needs improvement, 4001 poor; INP 200/201/500/501; CLS 0.1/0.1001/0.25/0.2501); it fails (no module). Verify: `pnpm --filter @app/contracts test:ci -- cwv-band-of` fails
- [x] 1.3 Contracts: `seo/issue-owner.enum.ts`; `page-speed/{cwv-metric.enum.ts, cwv-band.enum.ts, cwv-source.enum.ts, cwv-thresholds.constant.ts, cwv-issue-codes.constant.ts, cwv-measurement.interface.ts, cwv-band-of/cwv-band-of.util.ts}`; `owner: 'crawl'` on all 50 entries; six `pageSpeed` entries (severity per D10, `max` read from `CWV_THRESHOLDS`, label, hint, an explanation of more than one sentence saying Google calls page experience a small signal, and `ISSUE_SOURCES` entries for web.dev LCP/INP/CLS and the PSI docs — each URL opened and read the day it is cited); `CRAWL_ISSUE_CODES`, `PAGE_SPEED_ISSUE_CODES`, `TCrawlIssueCode`, `TPageSpeedIssueCode`; `TRunIssueCode`, `TPageIssueCode`, `ACTIVE_ISSUE_CODES` over crawl codes; `TIssueDetails` maps speed codes to `ICwvMeasurement`; `TCrawlSeoIssue`, `TPageSpeedSeoIssue`; `IPageCheck.code: TCrawlIssueCode`; every file in `src/index.ts`. Verify: `pnpm --filter @app/contracts test:ci && pnpm --filter @app/contracts run build`
  AMENDED during implementation: `MEASURED_ISSUE_CODES` / `TMeasuredIssueCode` were narrowed to
  crawl codes too. A speed code declares a `max` but is not a crawl measurement — its details are
  the separate `ICwvMeasurement` variant (`value`, `max`, `source`) — so leaving it in the measured
  set would have given one code two detail shapes. Five sources were added, not four: Search
  Central's page-experience page backs the "small signal" sentence; the block is commented
  "opened and read on 2026-10-10".
- [x] 1.4 Change first in `be/src/modules/page-analysis/services/checks/checks.registry.spec.ts`: "has exactly one check per catalogued code" becomes "has exactly one check per crawl-owned code", and add "has no check for a pageSpeed-owned code"; the `SEO_ISSUE_CODES` loops of the two cases after it iterate `CRAWL_ISSUE_CODES`. With 1.3 built and the registry untouched, `pnpm typecheck` fails on the six missing checks — that failure is the guard working. Verify: `pnpm typecheck` fails in `be` on `CHECKS`
- [x] 1.5 `checks.registry.ts`: `TCheckRegistry = { [K in TCrawlIssueCode]: TCheck<K> }`; `ISeoEvaluation` lists and `verdictsByCode` typed over crawl codes. `crawl-results.service.ts`: `IRunPage.issues: TCrawlSeoIssue[]`, `checksJudged`/`checksNotApplicable: TCrawlIssueCode[]`. `compose-page-checks.ts`: types narrowed, behaviour unchanged. Verify: `pnpm --filter be typecheck && pnpm --filter be test:ci -- src/modules/page-analysis src/modules/pages`
  AMENDED during implementation: `compose-page-checks.ts` needed no edit. It iterates
  `ACTIVE_ISSUE_CODES`, which 1.3 had already narrowed to crawl codes, so its types followed
  without touching the file.
- [x] 1.6 `be/test/support/seed-page.ts` slices `ACTIVE_ISSUE_CODES` (crawl codes), not `SEO_ISSUE_CODES` — otherwise a seeded page stores speed codes in `checks_not_applicable`. Verify: `pnpm --filter be test:db -- pages crawl` (includes "the detail answers for every catalogue check, and the answers add up")
- [x] 1.7 Write first `fe/src/Core/Helpers/DescribeIssue/describeIssue.test.ts`: the existing `groupIssues` sentence cases moved here, plus "describes CWV_LCP_NEEDS_IMPROVEMENT from its stored bound and source" ("LCP is 3.1 s for this page's real visitors; good is 2.5 s or less."); it fails (no module). Verify: `pnpm --filter fe test:ci -- describeIssue` fails
  AMENDED during implementation: the existing sentence cases were NOT moved — they stay in
  `groupIssues.test.ts`, which still runs them through the moved `DESCRIBE` record, so
  PAGEDETAIL-005's pin kept its file. `describeIssue.test.ts` holds one measured case ("reads a
  measured sentence from the bounds the crawl stored") and the speed sentences: the case named
  here, "says a poor value is over the poor bound" and "names a lab value as one". Built here
  rather than in `core-web-vitals-display` 2.2: `fe/src/Core/Helpers/DescribeCwv/describeCwv.ts`
  (value formatting and source phrases), because the speed sentences needed it first.
- [x] 1.8 `fe/src/Core/Helpers/DescribeIssue/describeIssue.ts`: the `DESCRIBE` record moved from `groupIssues.ts` (a second ViewModel will need it, `fe/skills/folder-structure`), plus one sentence per speed code reading `value`, `max` and `source` from the finding; `groupIssues.ts` imports it. Verify: `pnpm --filter fe test:ci -- describeIssue groupIssues IssuesSection`
- [x] 1.9 `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`: speed variants with a `cwvMeasurementSchema` (`source` required, `z.enum(CWV_SOURCES)`); measured variants exclude speed codes; `pageCheckSchema.code` over crawl codes; every schema still `satisfies z.ZodType<…>`. Then `PageSchemas.test.ts` → "parses a speed finding with its source; refuses one without". Verify: `pnpm --filter fe test:ci -- PageSchemas && pnpm --filter fe typecheck`
- [x] 1.10 Regression: no speed code reaches a crawl-only list. Verify: `pnpm --filter fe test:ci -- ChecksSection summariseChecks && pnpm --filter be test:db -- pages crawl`
- [x] 1.11 Commits, in order: `feat(contracts): every issue code names the writer that owns it` · `feat(contracts): Core Web Vitals thresholds, bands and six speed codes` · `refactor(page-analysis): checks are keyed by crawl-owned codes` · `feat(fe): parse and describe a speed finding`. Verify: `git log --oneline main..HEAD` reads in that order, and `pnpm lint && pnpm typecheck && pnpm test` passes on HEAD
  AMENDED during implementation: one commit, not four — `d970a40 feat(contracts): every issue
  code names its writer; six Core Web Vitals codes`. The contracts change alone breaks the `be`
  and `fe` typecheck (the registry and the schemas are keyed by the code union), and every commit
  on the branch must be green, so the four could not land apart.

## 2. The crawl replaces only what it owns (1b) — ANALYSIS-007

- [x] 2.1 Write first `be/src/modules/pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` → "a crawl's replace leaves the page's speed findings": insert `CWV_LCP_POOR` for a current page, run the crawl replace for that page with no rows, assert the speed row remains and the page's crawl rows are gone; it fails (today's delete takes every code). Verify: `pnpm --filter be test:db -- seo-issues` fails on that case
- [x] 2.2 `seo-issues.repository.ts`: `replaceForPagesForWorker` becomes `replaceCrawlFindingsForWorker(tx, pageIds, rows: TNewCrawlIssue[])` whose delete is `page_id in (…) and code in (CRAWL_ISSUE_CODES)`; `crawl-results.service.ts` and its spec call it. Verify: `pnpm --filter be test:db -- seo-issues && pnpm --filter be test:ci -- src/modules/pages/services/crawl-results`
  AMENDED during implementation: the speed half — `replacePageSpeedFindingsForWorker`,
  `TNewPageSpeedIssue` and "a speed replace leaves the page's crawl findings"
  (`page-speed-measurement` 3.5) — landed in the same commit: the two replaces partition one table
  and are pinned side by side in one int-spec.
- [x] 2.3 ANALYSIS-007's existing pin still holds: "replaces the issues of every re-fetched page, even a page with none now". Verify: `pnpm --filter be test:ci -- crawl-results`
- [x] 2.4 Commit: `fix(pages): a crawl replaces only the findings it owns`. Verify: `git show --stat HEAD` lists the repository, its int-spec and the service
  AMENDED during implementation: committed as `0977ec2 fix(pages): each writer replaces only the
  findings it owns`, worded for 2.2's amendment.

## 3. Phase acceptance

- [x] 3.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
- [ ] 3.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`, then in a browser a page detail's checks section lists no speed code and nothing on any screen changed
  NOT DONE: no browser was available. The health check passes on the rebuilt stack
  (`{"status":"ok","database":"up"}`), and "no speed code in the checks section" is pinned by
  `PageSchemas.test.ts` -> "refuses a speed code" and `ChecksSection.test.tsx`; the walk itself is
  open.
- [x] 3.3 Archive and deposit are plan phase 5 (`docs/_plans/issue-report-and-pagespeed.md` §15, §18): harvest the owner field and the crawl-only check registry into `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` before archiving; after archiving, fold each MODIFIED block into the requirement of the same id in `openspec/specs/` by hand, rewrite the ANALYSIS-012 heading into the `[ID]` form, and deposit. Verify: `pnpm exec openspec validate --specs` and `git grep -n "invariant: ANALYSIS-012" -- '*.md'`
  DONE in phase 5: harvested in `d1c2d25` and the phase-5 harvest commit; ANALYSIS-001, -007, -011
  and PAGES-012 folded by hand into `openspec/specs/be/src/modules/{page-analysis,pages}/spec.md`;
  ANALYSIS-012 appended in `[ID]` form and deposited in `PAGE_ANALYSIS_MODULE.md`.
