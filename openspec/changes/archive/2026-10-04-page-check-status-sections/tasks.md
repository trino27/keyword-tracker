# Tasks — page-check-status-sections

Generated from the plan `page-check-status-sections` (`docs/_plans/`), Phase 1. Correct it through
the plan; record a wrong task with an `AMENDED during implementation:` line and an
already-satisfied one as `VERIFIED, NOT BUILT`.

Branch `feat/page-check-status-sections`, based on `fix/keyword-extraction-accuracy`. Sub-phase 1a
ends with `pnpm typecheck` FAILING on purpose; the phase, not the sub-phase, is what must be green.

## 1. The contract (1a) — ANALYSIS-011, PAGES-012

- [x] 1.1 Write `packages/contracts/src/domain/seo/conditional-issue-codes.test.ts` first: "the derived set is exactly TITLE_LENGTH, META_DESCRIPTION_LENGTH, CANONICAL_MISMATCH, IMAGES_MISSING_ALT, HEADING_SKIP", "every conditional code has a non-empty skipReason" and "skipReasonOf returns null for TITLE_MISSING"; it fails. Verify: `pnpm --filter @app/contracts run test:ci` fails because the module does not exist
- [x] 1.2 `seo-issue-catalogue.constant.ts`: `ISeoIssueDefinition` gains `skipReason?: string`, documented as present exactly on the codes whose rule can answer `notApplicable`; the five conditional entries gain the plan's §1.2 sentences verbatim. Verify: `pnpm --filter @app/contracts run test:ci`
- [x] 1.3 New `seo/conditional-issue-codes.constant.ts`: `TConditionalIssueCode` mapped over the catalogue on the presence of `skipReason`, `CONDITIONAL_ISSUE_CODES` filtered from `SEO_ISSUE_CODES`, and `skipReasonOf(code): string | null` — the one narrowing lookup, because `SEO_ISSUE_CATALOGUE[code].skipReason` does not compile for the full union. Mirrors `measured-issue-codes.constant.ts`; no second list. Verify: `pnpm --filter @app/contracts run test:ci`
- [x] 1.4 New `pages/page-check.interface.ts`: `PAGE_CHECK_STATUSES` (`passed`, `failed`, `notApplicable`, `notYetChecked`), `TPageCheckStatus`, `IPageCheck`. The comment says why there are four and not three: `notYetChecked` makes adding a check a visible reason to re-crawl instead of a silent pass on a check that never ran. Verify: `pnpm --filter @app/contracts run build`
      - AMENDED during implementation: the constants are `CHECK_STATUSES` / `TCheckStatus`, not `PAGE_CHECK_STATUSES` / `TPageCheckStatus`. The shorter names read better at the call sites, where the surrounding type is already a page check.
- [x] 1.5 `page-detail.interface.ts`: `IPageDetail` gains `checks: IPageCheck[] | null`, commented with why it is composed on the backend and what the null means. Export both new files from `src/index.ts`. Verify: `pnpm --filter @app/contracts run build` succeeds and `pnpm typecheck` now FAILS in `be` and `fe` on the missing property — that failure is this sub-phase's deliverable; a passing typecheck here means `IPageDetail` was not changed
      - AMENDED during implementation: written last, not first. Contracts, backend and frontend each landed with their tests beside them rather than ahead of them, so the deliberately-failing typecheck this sub-phase expected never existed as a separate state.
- [x] 1.6 Commits: `feat(contracts): a conditional check declares why it can be skipped`; `feat(contracts): a page check carries one of four statuses`

## 2. The single pass keeps what it was discarding (1b) — ANALYSIS-011

- [x] 2.1 Write the two cases in `be/src/modules/page-analysis/services/seo-rules/seo-rules.registry.spec.ts` first: "every catalogue code is judged or skipped exactly once, over every recorded page" (over the same 30+ fixture corpus as the existing assertion at `:82-110` — disjoint, union equals the catalogue set, no duplicates, every skipped code in `CONDITIONAL_ISSUE_CODES`) and "the skipped set is exactly CONDITIONAL_ISSUE_CODES" over the all-conditions-absent input at `:46-60`; both fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules` fails because `ISeoEvaluation` has no such fields
- [x] 2.2 `seo-rules.registry.ts`: `ISeoEvaluation` gains `checksJudged` and `checksNotApplicable`; the loop pushes the code instead of discarding it at `:58` and pushes every judged code. `checksApplicable` is returned as `checksJudged.length` — the comment says the equality is a tautology here and that the DB CHECK is what ties them, so nobody writes a test that cannot fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules`
- [x] 2.3 `page-analysis.service.ts`: `IPageAnalysis` gains both lists (the spread of `evaluateSeoRules` at `:42` carries them already). Verify: `pnpm --filter be test:ci -- src/modules/page-analysis`
- [x] 2.4 Add "a failing code is always in the judged list" to the registry spec. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules`
- [x] 2.5 The existing corpus assertions (`13 <= checksApplicable <= 18`, `checksFailed === issues.length`) still pass untouched. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis`. If one moves, record it here as an `AMENDED during implementation:` line with the before and after — never loosen the bound
- [x] 2.6 Commit: `feat(be): the rules pass records which checks it could not judge`

## 3. The columns and their constraints (1c) — PAGES-012

- [x] 3.1 Write the `pages.repository.int-spec.ts` cases first: the array round-trip; "a re-crawl that skips nothing comes back with an empty array" (extending the counter case at `:95-112`); and four refusals through `expectPgError`, each naming its constraint — `pages_checks_judged_counter`, `pages_checks_disjoint`, `pages_checks_judged_clean` (a duplicate, and an empty-string element), `pages_checks_arrays_together`; plus "a row with both arrays null is accepted". Verify: `pnpm --filter be test:db -- src/modules/pages/repositories/pages` fails because the columns do not exist
- [x] 3.2 `pnpm --filter be exec dotenv -e ../.env -- drizzle-kit generate --custom --name check_array_helpers` creates `be/drizzle/0008_check_array_helpers.sql` and its journal entry; write the `array_is_clean(varchar[])` body into the generated file (IMMUTABLE, parallel safe, null-tolerant). The comment names the reason: a CHECK may not contain the subquery that `unnest` needs. Verify: read the file; `git status` shows `0008_*.sql` and `meta/_journal.json` and nothing hand-edited
      - AMENDED during implementation: the numbering came out `0008` generated (columns and four CHECKs), `0009` custom (`array_is_clean`), `0010` generated (swapping a loose non-empty CHECK for the two clean ones). The plan expected the custom one first; the function was reached for only after the first attempt concluded, wrongly, that distinctness could not be a CHECK at all.
- [x] 3.3 `pages.schema.ts`: `checksJudged` and `checksNotApplicable` as nullable `varchar('…', { length: 64 }).array()` with the plan's §3 comments, plus the five CHECKs. Then `pnpm db:generate` and READ `be/drizzle/0009_*.sql`: it must say `varchar(64)[]`, five `ADD CONSTRAINT … CHECK`, no `NOT NULL`, no `DROP`. Verify: the SQL as read, then `pnpm db:migrate`
      - AMENDED during implementation: the constraint names differ from the plan: `pages_checks_sets_together`, `pages_checks_judged_matches_applicable`, `pages_checks_sets_disjoint`, `pages_checks_judged_clean`, `pages_checks_not_applicable_clean`.
- [x] 3.4 `pages.repository.ts`: `IUpsertPage` gains both arrays, and the `onConflictDoUpdate` set clause names both — a re-crawl that merged instead of overwriting would be invisible. Verify: `pnpm --filter be test:db -- src/modules/pages/repositories/pages`
- [x] 3.5 The five constraints exist under those names. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "\d+ pages"`
- [x] 3.6 Nothing that inserts a page without the arrays broke — the int-spec fixtures, the e2e crawls and the seed all still work, which is also the proof the columns are genuinely nullable. Verify: `pnpm --filter be test:db`
- [x] 3.7 Commits: `feat(be): a check constraint helper for array contents`; `feat(be): a page records which checks were judged and which were skipped`

## 4. The crawl writes them (1d) — PAGES-012

- [x] 4.1 Write the `crawl-results.service.spec.ts` case first: the upsert row carries both arrays from the `IRunPage`; it fails on the missing fields. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/crawl-results` fails
- [x] 4.2 `crawl-results.service.ts`: `IRunPage` gains both lists beside the counters at `:34-36`, and the row mapping at `:78-95` copies them. `crawl-run-executor.service.ts`: `toRunPage` at `:236-254` copies them from the analysis. Verify: `pnpm --filter be test:ci -- src/modules/pages src/modules/crawl`
- [x] 4.3 A real recorded crawl stores rows the counter CHECK accepts — the first proof the array and the counter come from the same pass. Verify: `pnpm --filter be test:db -- test/e2e/crawl.e2e-spec.ts`
- [x] 4.4 Commit: `feat(be): the crawl stores the judged and skipped checks with the counters`

## 5. The read path composes the statuses (1e) — PAGES-012

- [x] 5.1 Write `be/src/modules/pages/services/page-checks/compose-page-checks.spec.ts` first: one row per catalogue code in catalogue order; the four statuses including `notYetChecked` for a code in neither array; `null` in, `null` out; a stored code outside today's catalogue renders nothing; a failing code reports `failed`, not `passed`. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-checks` fails because the module does not exist
- [x] 5.2 Write the `pages.e2e-spec.ts` case first: the detail of a crawled page carries `checks` with exactly `SEO_ISSUE_CODES.length` entries in catalogue order, none `notYetChecked`, and as many `passed` as `score.applicable - score.failed`. Verify: `pnpm --filter be test:db -- test/e2e/pages.e2e-spec.ts` fails because `checks` is absent
- [x] 5.3 `compose-page-checks.ts`: `composePageChecks(stored: IStoredChecks | null, failed)` with the plan's §10.2 precedence — notApplicable, then failed, then judged, else notYetChecked. It iterates the CATALOGUE, never the arrays. `stored` is one nullable object, not two nullable arrays, so the half-recorded state is unrepresentable; the comment names CHECK `pages_checks_arrays_together` as what licenses that. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-checks`
      - AMENDED during implementation: `composePageChecks` takes two nullable arrays rather than one nullable `IStoredChecks`, so the half-recorded state IS representable in TypeScript and is prevented only by CHECK `pages_checks_sets_together`.
- [x] 5.4 `page-detail.repository.ts`: `ICurrentPageRecord` and `IPageRow` gain the two columns, `findCurrentPage`'s select at `:96-98` reads them, and the mapping builds the nullable `IStoredChecks`. The cast from `string[]` is a trust boundary and is commented as one, like `details_json` in `issuesForPage`. Verify: `pnpm --filter be test:db -- test/e2e/pages.e2e-spec.ts`
- [x] 5.5 `page-read.service.ts`: `getPage` passes the record's stored lists and the issue codes to `composePageChecks` and returns `checks`. No new query. Extend `page-read.service.spec.ts`: the composed result, and `checks: null` for a record with null arrays. Verify: `pnpm --filter be test:ci -- src/modules/pages/services/page-read`
      - AMENDED during implementation: `page-read.service.spec.ts` had no `getPage` suite to extend, so one was written: the 404, the catalogue ordering of issues, the composed statuses, the skipped case, the null case, and the source of `lastCrawl`.
- [x] 5.6 Commits: `feat(be): compose every catalogue check's status for a page`; `feat(be): the page detail answers per check`

## 6. The two sections (1f) — PAGEDETAIL-009, PAGEDETAIL-010

- [x] 6.1 Write the `PageSchemas.test.ts` cases first: `checks: null` parses; an unknown status fails to parse; an unknown code fails to parse. Verify: `pnpm --filter fe test:ci -- PageSchemas` fails
- [x] 6.2 Write `fe/src/ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.test.ts` first with the plan's §10.4 table verbatim — 16/18 → "100 × 16 ÷ 18 ≈ 88.89, rounded half-up to 89."; 1/16 → "100 × 1 ÷ 16 = 6.25, rounded half-up to 6."; 18/18 → "100 × 18 ÷ 18 = 100." with no rounding clause — plus "the rounded value in the sentence always equals the score passed in". Verify: `pnpm --filter fe test:ci -- explainScore` fails
- [x] 6.3 Write `.../Services/SummariseChecks/summariseChecks.test.ts` first: counts per status; the subtitle omits zero groups and orders judged · not applicable · not yet checked; a reason is attached to `notApplicable` and `notYetChecked` rows and to no other. Verify: `pnpm --filter fe test:ci -- summariseChecks` fails
- [x] 6.4 Write `fe/src/Modules/PageDetail/ChecksSection/ChecksSection.test.tsx` first: a row per catalogue code with the right status and label; the skip reason rendered for a not-applicable row; the closing line present with failures and absent without; `checks={null}` renders "Re-crawl this page to see each check." and no rows. Verify: `pnpm --filter fe test:ci -- ChecksSection` fails
- [x] 6.5 `PageSchemas.ts`: `pageCheckSchema` with `z.enum(SEO_ISSUE_CODES)` and `z.enum(PAGE_CHECK_STATUSES)`; `pageDetailSchema` gains `checks: z.array(pageCheckSchema).nullable()`. Verify: `pnpm --filter fe test:ci -- PageSchemas`
- [x] 6.6 `explainScore.ts` and `summariseChecks.ts` per the plan's §10.3 and §10.4. Paragraph 4's band numbers come from `SCORE_BANDS`, never from retyped literals, so moving a band moves the sentence. Verify: `pnpm --filter fe test:ci -- explainScore summariseChecks`
- [x] 6.7 `ChecksSection.tsx` and `ScoreExplainer.tsx` (+ `ScoreExplainer.test.tsx`: the four paragraphs render and the page's own numbers appear in the first); both mounted in `PageDetailScreen.tsx` between `PositionHistory` and `IssuesSection`. Neither component sorts or derives a status. Verify: `pnpm --filter fe test:ci && pnpm typecheck && pnpm lint`
- [x] 6.8 `IssuesSection.test.tsx` and `PageDetailViewModel.test.ts` pass unchanged — the severity ordering is what D6 protects and the new section sits directly above it. Verify: `pnpm --filter fe test:ci`
- [x] 6.9 Commits: `feat(fe): parse the per-check statuses from the detail response`; `feat(fe): a Checks section listing every catalogue check`; `feat(fe): explain the health score on the page's own numbers`

## 7. Phase acceptance (1g)

- [x] 7.1 Verify: `pnpm lint && pnpm typecheck && pnpm test`
- [x] 7.2 Verify: `pnpm --filter be test:db` (every `*.int-spec.ts` and `*.e2e-spec.ts`, serially)
- [x] 7.3 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health` — this also proves the migration order, because 0008 must create `array_is_clean` before 0009's CHECK uses it on a volume built from empty
      - AMENDED during implementation: done in two steps. The first `docker compose up -d --build` left `web` unable to bind 8080 because another process held it; once that freed, `docker compose up -d web` brought Caddy up and the whole path verified — `/api/health` 200, `/pages/1` serving the SPA shell with `id="root"`, and both built assets 200. The migration order is proved by `be` reaching healthy with 0008-0010 applied.
- [x] 7.4 A signed-in `curl` of `/api/pages/<id>` shows `checks` with one entry per catalogue code. Verify: the response body
      - AMENDED during implementation: verified against a locally started API rather than the compose stack, 8080 being unavailable. The response carried 18 checks, 16 passed and 2 failed, agreeing with `score` 89 over 18 applicable.
- [x] 7.5 Browser walk: `/pages/<id>` shows both sections, the subtitle matches the rows, the closing line matches the failure count, and the console is clean. Verify: `docker compose up -d --build` then the page at http://localhost:8080
      - DONE: walked and confirmed by the repository owner, not by the session that wrote this file. Recorded that way so a later reader knows which checks were machine-verified (the served stack, the API reads, the test suites) and which rest on a person having looked.
- [x] 7.6 Record phase 2's readiness. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from pages where checks_judged is null"` — write the number here. A non-zero count is information, not a failure: it means `page-checks-required` waits for a re-crawl (plan O1, R1)
      - AMENDED during implementation: recorded on `seo_tracker`: 105 rows, 17 without the record, and 88 of 88 CURRENT pages with it. That answer closes `page-checks-required` rather than unblocking it — see its proposal.
- [x] 7.7 Commit, if the README line lands here rather than at harvest: `docs: the detail says what each check concluded`

## 8. Harvest and archive

Before archiving, and in this order (`openspec/README.md` §8): harvest, archive, rewrite the delta
headings into the `[ID]` form, deposit.

- [x] 8.1 Harvest the plan's §18 table into its owning documents — `PAGE_ANALYSIS_MODULE.md` (the union invariant and the conditional codes' reasons), `PAGES_MODULE.md` (the four statuses, the composition precedence, the trust boundary), `be/skills/architecture-decisions/SKILL.md` (the two-phase column), `practices/be/drizzle/database-patterns/SKILL.md` (a function-backed CHECK and its limit). Verify: `git grep -n "notYetChecked" -- be/src/modules/*/\*_MODULE.md` finds the deposit
      - AMENDED during implementation: harvested into `PAGE_ANALYSIS_MODULE.md` (the two lists, the union invariant and why no constraint can state it; the catalogue-owned skip reason), `PAGES_MODULE.md` (the four statuses, the precedence, and why the column stays nullable), `be/skills/architecture-decisions/SKILL.md` (ask which rows a refilling act cannot reach before promising a tightening phase) and `practices/be/drizzle/database-patterns/SKILL.md` (a CHECK may not contain a subquery; the IMMUTABLE-function route and its two limits).
- [x] 8.2 Archive, rewrite the four headings into `### Requirement [ANALYSIS-011]: …` form, and deposit each id with its pinning line and this spec file's path. Verify: `pnpm exec openspec validate --type spec` and `git grep -n "invariant: PAGES-012" -- '*.md'`
      - DONE: archived as `2026-10-04-page-check-status-sections`; the four headings rewritten from the delta form into `### Requirement [ID]: …`; the archiver's placeholder Purpose on the new fe spec replaced. Deposited: ANALYSIS-011 in `PAGE_ANALYSIS_MODULE.md`, PAGES-012 in `PAGES_MODULE.md`, PAGEDETAIL-009 and -010 in `fe/skills/AGENTS.md` — `fe/` keeps skills rather than module documents, so no document was created to hold them. `openspec validate --specs`: 10 passed, 0 failed.
