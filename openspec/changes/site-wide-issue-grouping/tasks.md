# Tasks — site-wide-issue-grouping

Generated from the plan `seo-analysis-accuracy` (`docs/_plans/`), Phase 3. Correct it through the
plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`.

`page-health-score` must be closed before task 1.1 starts — not for a logical dependency, but
because both phases patch the same `ORDER BY` and the same two screens.

## 1. The spread, at read time (3a) — PAGES-011

- [ ] 1.1 Write the int-spec cases in `be/src/modules/pages/repositories/page-list/page-list.repository.int-spec.ts` first: "a code on five of a client's pages reports five", **"a search matching one page still reports five"**, "a code on one page reports one", "two clients count only their own pages"; they fail. Verify: `pnpm --filter be test:db -- page-list` fails
- [ ] 1.2 Write the `page-read.service.spec.ts` case first: "a page's siteWide count is the number of its distinct codes whose client spread is above one"; it fails. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-read` fails
- [ ] 1.3 Write the e2e case in `be/test/e2e/pages.e2e-spec.ts` first: "the detail's issues carry pagesAffected"; it fails. Verify: `pnpm --filter be test:db -- pages` fails
- [ ] 1.4 `IPageIssueCounts.siteWide` and the detail's per-issue `pagesAffected` in `@app/contracts`; `PageSchemas.ts` updated, forced by `satisfies z.ZodType<…>`. Verify: `pnpm --filter @app/contracts run build && pnpm typecheck`
- [ ] 1.5 A fifth statement in `page-list.repository.ts`: the per-client code spread over the client's current pages, built from the current-pages set WITHOUT the search filter — inheriting the filter is the easy way to write it and the reason case 1.1's second assertion exists. `page-detail.repository.ts`'s `issuesForPage` returns the same number per code. Verify: `pnpm --filter be test:db -- page-list pages`
- [ ] 1.6 `page-read.service.ts` folds the spread into `issues.siteWide` for the list and `pagesAffected` for the detail, beside the existing read-time derivations. Verify: `pnpm --filter be test:ci -- src/modules/pages`
- [ ] 1.7 The list is still a constant number of statements, not a query per row. Verify: the int-spec's statement-count assertion (five) passes in `pnpm --filter be test:db -- page-list`
- [ ] 1.8 Against the seeded stack. Verify: `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20' | grep -o '"siteWide":[0-9]*' | head` shows non-zero values for template-level findings
- [ ] 1.9 Commit: `feat(be): count how many of a client's pages share each finding`

## 2. Where the user sees it (3b) — PAGELIST-007, PAGEDETAIL-008

- [ ] 2.1 Write the `IssuesSection.test.tsx` cases first: "an issue on five of fifteen pages reads 'on 5 of 15 pages'" and "an issue on one page says nothing extra"; they fail. Verify: `pnpm --filter fe test:ci -- IssuesSection` fails
- [ ] 2.2 Write the `PagesTable.test.tsx` cases first: "a row with two shared findings reads '2 site-wide'" and "a row with none shows only the severity badges"; they fail. Verify: `pnpm --filter fe test:ci -- PagesTable` fails
- [ ] 2.3 `groupIssues.ts`: `IIssueView` gains `pagesAffected`; `IssuesSection.tsx` renders the clause only above one; `PagesTable.tsx`'s `IssueCounts` gains the dimmed suffix only above zero. Verify: `pnpm --filter fe test:ci && pnpm lint && pnpm typecheck`
- [ ] 2.4 `IssuesSection`'s "No issues found" state and the severity grouping still pass. Verify: `pnpm --filter fe test:ci -- IssuesSection`
- [ ] 2.5 Browser walk. Verify: `docker compose up -d --build`, then a template-level finding reads the same number on every page of the client, with no console error
- [ ] 2.6 Commit: `feat(fe): a finding shared across a client's pages says so`

## 3. Phase acceptance and the plan's close-out

- [ ] 3.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
- [ ] 3.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
- [ ] 3.3 Harvest before archiving (plan §18): create `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` carrying the applicability table of plan §10.1 and why a threshold's bounds are snapshotted into the row, each as an invariant with its `<!-- invariant: … -->` marker, its pinning line and the spec file's own path. Cite the field study's findings 3, 4 and 7 rather than copying them. Verify: `git grep -n "invariant: " -- be/src/modules/page-analysis` lists every deposited id
- [ ] 3.4 Archive the three changes, rewrite each archived heading from the delta form into the `[<CAP>-<NNN>]` form (`openspec/README.md` §3a, §8), then deposit. Verify: `pnpm exec openspec validate --type spec` and `git grep -n "Requirement \[" openspec/specs` lists the new ids exactly once each
- [ ] 3.5 Move `docs/_plans/seo-analysis-accuracy.md` to `docs/_plans-archive/` with a header naming the branch, what was harvested where, and what was left open. Verify: `git grep -rn "seo-analysis-accuracy" -- ':!docs/_plans-archive'` finds no link into the archived plan from a skill or a module document
