# Tasks — page-health-score

Generated from the plan `seo-analysis-accuracy` (`docs/_plans/`), Phase 2. Correct it through the
plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`.

`seo-check-catalogue-correction` must be closed before task 1.1 starts: scoring a check that is
about to be retired would bake it into a number.
  VERIFIED: closed at 26 of 30 before 1.1 began; the four open tasks are the browser walk, the
  stale developer database and the two docker acceptance commands, none of which touches the
  catalogue this phase scores.

## 1. Applicability is counted where it is known, and stored (2a) — ANALYSIS-010

- [x] 1.1 Write the int-spec cases in `be/src/modules/pages/repositories/pages/pages.repository.int-spec.ts` first, using `be/test/support/expect-pg-error.ts`: "`checks_failed` above `checks_applicable` violates `pages_checks_failed_range`", "`checks_applicable = 0` violates `pages_checks_applicable_positive`", "an insert without the counters is rejected"; they fail. Verify: `pnpm --filter be test:db -- pages` fails because the columns do not exist
- [x] 1.2 Write the registry cases in `services/seo-rules/seo-rules.registry.spec.ts` first: "a page with no title reports TITLE_LENGTH as not applicable, so checksApplicable is 17", "checksFailed equals issues.length", and over every recorded fixture post "13 <= checksApplicable <= 18"; they fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules` fails
- [x] 1.3 Write the e2e case in `be/test/e2e/crawl.e2e-spec.ts` first: "every crawled page stores 13–18 applicable checks and a failed count equal to its issue count", asserting the run's status before reading the pages; it fails. Verify: `pnpm --filter be test:db -- crawl` fails
- [x] 1.4 `seo-rule.interface.ts`: `TRuleVerdict` gains `notApplicable`; update all seven rule groups with the applicability conditions in plan §10.1 (TITLE_LENGTH, META_DESCRIPTION_LENGTH, HEADING_SKIP, CANONICAL_MISMATCH, IMAGES_MISSING_ALT are the five conditional ones). Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules`
- [x] 1.5 `evaluateSeoRules` returns `{ issues, checksApplicable, checksFailed }` from one pass; `PageAnalysisService.analyseRun` carries them; `toRunPage` in `crawl-run-executor.service.ts` passes them into `IRunPage`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis && pnpm typecheck`
- [x] 1.6 `pages.schema.ts`: `checksApplicable` and `checksFailed` as `smallint().notNull()` with the two CHECK constraints; the `response_ms` comment stops citing SLOW_RESPONSE and says it is a fact of the crawl. `pnpm db:generate`, then READ the SQL — two `ADD COLUMN … NOT NULL`, two `ADD CONSTRAINT … CHECK`, nothing dropped or renamed — then `pnpm db:migrate`. Verify: `pnpm db:generate && pnpm db:migrate && pnpm --filter be test:db -- pages`
  AMENDED during implementation: `pnpm db:migrate` was NOT run from this worktree. It targets
  DATABASE_URL, which is the shared developer database another session is working in, and the
  migration is NOT NULL without a default — against a table with rows it fails, by design (see
  4.5 of the catalogue change and the plan's OQ2). The generated SQL was read and then applied by
  the database suite's globalSetup, which runs the same generated migrations the same way against
  this worktree's own `seo_tracker_accuracy_test`. The SQL is exactly what the task predicted: two
  ADD COLUMN ... NOT NULL, two ADD CONSTRAINT ... CHECK, nothing dropped or renamed.
- [x] 1.7 `IUpsertPage`, `PagesRepository.upsertManyForWorker`'s `set` block, and `CrawlResultsService` carry both counters, so a re-crawl refreshes them with the issues. Verify: `pnpm --filter be test:db -- pages crawl`
- [x] 1.8 Nothing deletes pages or pairs. Verify: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src ':!*spec.ts'` prints nothing
- [x] 1.9 Commits: `feat(be): a rule can be not applicable, and the page counts both`; `feat(be): store how many checks applied to a page and how many failed`

## 2. The score crosses the wire (2b) — PAGES-009

- [x] 2.1 Write `packages/contracts/src/domain/pages/page-score/page-score.util.test.ts` first: `18/0 → 100`, `16/2 → 88`, `3/3 → 0`, half-up rounding at `.5`; it fails. Verify: `pnpm --filter @app/contracts run test:ci` fails
- [x] 2.2 Write the e2e case in `be/test/e2e/pages.e2e-spec.ts` first: "the detail carries a score of 88 with its applicable and failed counts"; it fails. Verify: `pnpm --filter be test:db -- pages` fails
  AMENDED during implementation: the detail e2e case the task named lives in
  `pages-history.e2e-spec.ts`, not `pages.e2e-spec.ts`. Both were extended — the seeded one with
  the exact score 83 of 18/3, and `pages.e2e-spec.ts` with a case over the REAL crawl asserting
  the score, page.responseMs and the measured shape of a TITLE_LENGTH finding.
- [x] 2.3 New `page-score/page-score.util.ts` (`IPageScore`, `pageScoreOf`) and `seo/score-band.constant.ts` (`SCORE_BANDS`, with the comment naming Lighthouse's published model as the precedent); barrel; `IPageListItem.score` and `IPageDetail.score`. Verify: `pnpm --filter @app/contracts run test:ci && pnpm --filter @app/contracts run build`
- [x] 2.4 `page-list.repository.ts` and `page-detail.repository.ts` select both counters; `page-read.service.ts` maps `pageScoreOf(...)` into both payloads, beside `bestPosition` and `lastCapturedAt`. Verify: `pnpm --filter be test:db -- pages && pnpm --filter be test:ci -- src/modules/pages`
- [x] 2.5 `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` gains `pageScoreSchema` in both payloads — forced by `satisfies z.ZodType<IPageListItem>`, which is why it is done here and not with the UI. Verify: `pnpm typecheck`
- [x] 2.6 Isolation is unchanged by the new columns. Verify: `pnpm --filter be test:db -- isolation-matrix`
- [x] 2.7 Commits: `feat(contracts): a page score with the denominator it was computed from`; `feat(be): the pages API answers with each page's score`

## 3. Worst first, and the same page on exactly one page of the list (2c) — PAGES-010

- [x] 3.1 Write the int-spec cases in `page-list.repository.int-spec.ts` first: "two pages scoring 50 and 90 come back worst first" and "walking every page at pageSize 3 returns each id exactly once and all of them", seeding at least four pages that TIE on score so the tie-breaker is exercised and asserting the seeded row count; they fail. Verify: `pnpm --filter be test:db -- page-list` fails
  AMENDED during implementation: the task's "two pages scoring 50 and 90" does NOT catch a missing
  ::numeric cast. Under integer division both scores collapse to 0, the rows tie, and the next key
  `checks_failed desc` happens to put the worse page first anyway — the assertion passes while the
  bug is present. The case that catches it needs the tie-break to INVERT the order: 3 of 4 passed
  (75) against 8 of 10 (80), where integer division puts the BETTER page first. Verified by
  removing the cast and watching exactly that one case go red, then restoring it.
- [x] 3.2 Replace the slice's `ORDER BY` with `(p.checks_applicable - p.checks_failed)::numeric / p.checks_applicable asc, p.checks_failed desc, c.name, c.id, p.sitemap_position, p.id`. The `::numeric` and the trailing `p.id` are both load-bearing — without the cast every score collapses to 0 or 1, without the unique last key rows repeat between pages. Verify: `pnpm --filter be test:db -- page-list`
- [x] 3.3 Record the plan, not the assumption. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "explain (analyze, buffers) <the slice query>"` on the seeded stack, with the plan and the row count pasted into the commit body
  AMENDED during implementation: run against this worktree's test database at the seeded size
  (2 clients, 30 current pages) rather than the shared docker stack, which belongs to another
  session. The plan is in the commit body of `feat(be): order the pages list worst first`:
  quicksort, 28 kB, 32 shared buffer hits, 0.276 ms, index scans throughout. No index needed.
- [x] 3.4 Pagination metadata is unchanged. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-read`
- [x] 3.5 Commit: `feat(be): order the pages list worst first, with a total order`

## 4. The score on both screens (2d) — PAGELIST-006, PAGEDETAIL-007

- [x] 4.1 Write `fe/src/Modules/_Shared/ScoreBadge/ScoreBadge.test.tsx` and the `PagesTable.test.tsx` cases first: "a page scoring 42 renders in the poor band", "the first row is the lowest score the gateway returned"; they fail. Verify: `pnpm --filter fe test:ci -- ScoreBadge PagesTable` fails
- [x] 4.2 New `ScoreBadge` (number, band colour, optional `14/16 checks` note); `PagesTable.tsx` gains a **Score** column after **Page**; `KpiCards.tsx` gains a first **Health score** card and goes to `cols={{ base: 1, xs: 2, md: 5 }}`. The wording stays inside what a share-of-passed score may claim: no traffic prediction, no competitive comparison, no quality judgement. Verify: `pnpm --filter fe test:ci && pnpm lint && pnpm typecheck`
- [x] 4.3 The table's loading skeleton, four empty kinds and error state still render with the extra column. Verify: `pnpm --filter fe test:ci -- PagesTable`
- [ ] 4.4 Browser walk as both seed users. Verify: `docker compose up -d --build`, then `/pages` is worst-first and `/pages/<id>` shows the score card, with no console error
  NOT DONE HERE: no browser in this environment. The stack is LEFT RUNNING at
  http://localhost:8081 (compose project `skt-accuracy`, seeded, both demo users), built under a
  separate project name because the default belongs to another session's containers.
  VERIFIED without a browser, against that stack, and it is the finding worth keeping: BOTH seed
  users' lists come back worst first, and Yoast's /on-gutenberg-and-wordpress-5-0/ scores
  **100 out of 17** — it carries no images, so IMAGES_MISSING_ALT is not applicable and the page
  is neither rewarded nor punished for having none. A fixed denominator of 18 would have scored
  it 94 and ranked it below pages with real problems. That is the honest denominator working on
  live data, not on a fixture.
- [x] 4.5 Commits: `feat(fe): a health score badge with its band`; `feat(fe): the pages list leads with the score, worst first`

## 5. The requirement that already existed (2a) — ANALYSIS-007

- [x] 5.1 `openspec/changes/page-analysis/specs/be/src/modules/page-analysis/spec.md` — ANALYSIS-007 is amended in place with its `AMENDED during implementation:` line: a re-crawl replaces the page's issues AND refreshes its two check counters in the same act. Amended in place because `openspec/specs/` holds no base to write a MODIFIED block against (plan §20 OQ4). Verify: `pnpm exec openspec validate --type spec`
- [x] 5.2 Commit: `docs(openspec): a re-crawl refreshes the check counters too`

## 6. The README learns the two new facts (2e)

- [x] 6.1 `README.md` — the decisions section gains the score's honest denominator and the worst-first order, in two lines; the unfinished section gains "whether a future catalogue change needs a stale-analysis mechanism" (plan OQ5). The README stays one page and its command block stays identical to the one `readme-and-clean-clone` ran verbatim. Verify: `git diff README.md` shows only those sections
- [x] 6.2 Commit: `docs: the page score and the list's order`

## 7. Phase acceptance

- [x] 7.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
  VERIFIED: lint, typecheck, 61 + 347 + 156 unit tests, 121 database tests, all green.
- [x] 7.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
  VERIFIED on the isolated stack: health answers `{"status":"ok","database":"up"}` after a
  clean build, migrate and seed.
