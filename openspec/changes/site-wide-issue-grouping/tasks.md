# Tasks — site-wide-issue-grouping

Generated from the plan `seo-analysis-accuracy` (`docs/_plans-archive/`), Phase 3. Correct it through the
plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`.

`page-health-score` must be closed before task 1.1 starts — not for a logical dependency, but
because both phases patch the same `ORDER BY` and the same two screens.

## 1. The spread, at read time (3a) — PAGES-011

- [x] 1.1 Write the int-spec cases in `be/src/modules/pages/repositories/page-list/page-list.repository.int-spec.ts` first: "a code on five of a client's pages reports five", **"a search matching one page still reports five"**, "a code on one page reports one", "two clients count only their own pages"; they fail. Verify: `pnpm --filter be test:db -- page-list` fails
- [x] 1.2 Write the `page-read.service.spec.ts` case first: "a page's siteWide count is the number of its distinct codes whose client spread is above one"; it fails. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-read` fails
- [x] 1.3 Write the e2e case in `be/test/e2e/pages.e2e-spec.ts` first: "the detail's issues carry pagesAffected"; it fails. Verify: `pnpm --filter be test:db -- pages` fails
- [x] 1.4 `IPageIssueCounts.siteWide` and the detail's per-issue `pagesAffected` in `@app/contracts`; `PageSchemas.ts` updated, forced by `satisfies z.ZodType<…>`. Verify: `pnpm --filter @app/contracts run build && pnpm typecheck`
  AMENDED during implementation: the task named `siteWide` and `pagesAffected`. A third field
  was needed and the task did not have it: `IPageDetail.client.currentPages`. The detail's clause
  is "on 5 of 15 pages" (plan §1.2) and nothing in the payload carried the 15. It comes from a
  correlated count in `findCurrentPage` — one more column, no new round trip.
- [x] 1.5 A fifth statement in `page-list.repository.ts`: the per-client code spread over the client's current pages, built from the current-pages set WITHOUT the search filter — inheriting the filter is the easy way to write it and the reason case 1.1's second assertion exists. `page-detail.repository.ts`'s `issuesForPage` returns the same number per code. Verify: `pnpm --filter be test:db -- page-list pages`
  AMENDED during implementation: TWO methods, not one. `codeSpreadForClients` answers the
  per-client spread, and `siteWideCountsForPages` folds it down to one number per page inside SQL,
  because the list's issue counts group by severity and never carried the per-page CODES the
  task's wording assumed. The list is still five statements, not six: the fold is a CTE in the
  fifth, not a sixth round trip. Both take no filter argument at all.
- [x] 1.6 `page-read.service.ts` folds the spread into `issues.siteWide` for the list and `pagesAffected` for the detail, beside the existing read-time derivations. Verify: `pnpm --filter be test:ci -- src/modules/pages`
- [x] 1.7 The list is still a constant number of statements, not a query per row. Verify: the int-spec's statement-count assertion (five) passes in `pnpm --filter be test:db -- page-list`
- [x] 1.8 Against the seeded stack. Verify: `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20' | grep -o '"siteWide":[0-9]*' | head` shows non-zero values for template-level findings
  VERIFIED against an isolated seeded stack (compose project `skt-accuracy`, port 8081, built
  from this worktree so the other session's containers were untouched): Yoast's list returns
  `"siteWide":1` on three pages, and the detail of one of them reports `pagesAffected: 3` for
  META_DESCRIPTION_LENGTH with `client.currentPages: 15`. The list's count and the detail's
  per-code number agree, which is what the e2e case asserts and this confirms on live data.
- [x] 1.9 Commit: `feat(be): count how many of a client's pages share each finding`

## 2. Where the user sees it (3b) — PAGELIST-007, PAGEDETAIL-008

- [x] 2.1 Write the `IssuesSection.test.tsx` cases first: "an issue on five of fifteen pages reads 'on 5 of 15 pages'" and "an issue on one page says nothing extra"; they fail. Verify: `pnpm --filter fe test:ci -- IssuesSection` fails
- [x] 2.2 Write the `PagesTable.test.tsx` cases first: "a row with two shared findings reads '2 site-wide'" and "a row with none shows only the severity badges"; they fail. Verify: `pnpm --filter fe test:ci -- PagesTable` fails
- [x] 2.3 `groupIssues.ts`: `IIssueView` gains `pagesAffected`; `IssuesSection.tsx` renders the clause only above one; `PagesTable.tsx`'s `IssueCounts` gains the dimmed suffix only above zero. Verify: `pnpm --filter fe test:ci && pnpm lint && pnpm typecheck`
- [x] 2.4 `IssuesSection`'s "No issues found" state and the severity grouping still pass. Verify: `pnpm --filter fe test:ci -- IssuesSection`
- [ ] 2.5 Browser walk. Verify: `docker compose up -d --build`, then a template-level finding reads the same number on every page of the client, with no console error
  NOT DONE HERE: no browser in this environment. The stack it needs is LEFT RUNNING at
  http://localhost:8081 (compose project `skt-accuracy`, seeded with both demo users) so the walk
  is one browser tab away. What was confirmed without a browser, against that stack: a Yoast
  meta-description finding reports `pagesAffected: 3` from the detail endpoint and `siteWide: 1`
  from the list, consistently, on every page carrying it.
- [x] 2.6 Commit: `feat(fe): a finding shared across a client's pages says so`

## 3. Phase acceptance and the plan's close-out

- [x] 3.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
  VERIFIED: lint, typecheck, 61 contracts + 347 backend + 156 frontend unit tests, 121 database
  tests. All green.
- [x] 3.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
  VERIFIED on the isolated stack: `docker compose -p skt-accuracy up -d --build` then
  `curl -fsS http://localhost:8081/api/health` → `{"status":"ok","database":"up"}`. The migration
  applied NOT NULL columns onto an empty database without incident, which is the reviewer's path
  the schema was designed for. `docker compose run --rm seed` crawled both live sites: 2 runs
  succeeded, 15 posts each, 154 pairs × 365 days = 56 210 snapshots.
- [x] 3.3 Harvest before archiving (plan §18): create `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` carrying the applicability table of plan §10.1 and why a threshold's bounds are snapshotted into the row, each as an invariant with its `<!-- invariant: … -->` marker, its pinning line and the spec file's own path. Cite the field study's findings 3, 4 and 7 rather than copying them. Verify: `git grep -n "invariant: " -- be/src/modules/page-analysis` lists every deposited id
  AMENDED during implementation: this task asked for two different acts and `openspec/README.md`
  §8 separates them. The HARVEST — the durable facts that are not requirements — belongs BEFORE
  the archive, and it is done: `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` now carries
  the applicability table, which five checks are conditional and on what, why a threshold's bounds
  are copied into the stored finding, why the two retired checks were retired, and the extraction
  defect — each citing the field study rather than restating it. The `<!-- invariant: ID -->`
  markers the task also asked for are the DEPOSIT, which cannot precede the archive: until then
  the requirement still lives under `changes/` and a marker pointing at it points at a proposal.
  They are task 3.4's, and are tracked there.
  AMENDED further: `PAGE_ANALYSIS_MODULE.md` ALREADY EXISTED — `docs(be): module documents`
  created it after this plan was written, so the plan's "no *_MODULE.md exists anywhere under
  be/src/modules/" was already false. The harvest extended that file rather than creating one, and
  corrected its "SEO rules" bullet, which still described the pre-change
  `Record<TSeoIssueCode, TSeoRule>`.
- [ ] 3.4 Archive the three changes, rewrite each archived heading from the delta form into the `[<CAP>-<NNN>]` form (`openspec/README.md` §3a, §8), then deposit. Verify: `pnpm exec openspec validate --type spec` and `git grep -n "Requirement \[" openspec/specs` lists the new ids exactly once each
  NOT DONE HERE: an archive is irreversible in the sense that matters — it turns a delta into
  approved truth — and five browser walks are open across the repository (this change's 2.5,
  `page-health-score` 4.4, `seo-check-catalogue-correction` 4.6, `tracker-screens` 4.3,
  `readme-and-clean-clone` 2.3). `openspec/README.md` §8 says review is the only check on an
  archive, so an archive approved over unrun acceptance is the lifecycle doing nothing.
  Scope note for whoever runs it: this is NOT three changes. `openspec/specs/` still holds only
  `.gitkeep`, so nothing in the repository has ever been archived — eleven changes and 92
  requirements, each needing its delta heading rewritten from `Requirement: ID — text` into §3's
  `[ID]` form and then deposited into the module document that owns the invariant. One pass, done
  once, after the walks.
- [x] 3.5 Move `docs/_plans-archive/seo-analysis-accuracy.md` to `docs/_plans-archive/` with a header naming the branch, what was harvested where, and what was left open. Verify: `git grep -rn "seo-analysis-accuracy" -- ':!docs/_plans-archive'` finds no link into the archived plan from a skill or a module document
  VERIFIED: moved to `docs/_plans-archive/seo-analysis-accuracy.md` with a header naming the
  branch (`feat/page-health-and-catalogue`), what was harvested into which owning document, and
  the four things left open — the browser walks, this change's own 3.3 and 3.4, the stale
  developer database, and OQ5.
  AMENDED during implementation: the verify command found one link that had to go first.
  `practices/search-engines/SKILL.md` cited the plan by path, which `docs/_plans/README.md`
  forbids outright — "a skill or module document citing a plan starts lying the day the plan is
  archived". It now cites the three OpenSpec changes and the module document instead. The six
  references from the changes' own proposals and tasks are the plan-to-change link the lifecycle
  expects, not a skill reaching in; they were repointed to the archive path.
