# Tasks — seo-check-catalogue-correction

Generated from the plan `seo-analysis-accuracy` (`docs/_plans-archive/`), Phase 1. Correct it through the
plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`.

Phase 0 (`readme-and-clean-clone`) must be closed before task 1.1 starts.
  AMENDED during implementation: phase 0 stands at 5 of 6. Its one open task, 2.3, is the
  browser walk of the four screens, which its own note records as "for a person before
  merging" — there is no browser in this environment. The user confirmed phase 0 closed on
  that basis and kept 2.3 for themselves.

## 1. The catalogue and the measurement, in contracts (1a) — ANALYSIS-008

- [x] 1.1 Write `packages/contracts/src/domain/seo/measured-issue-codes.test.ts` first: "the derived set is exactly TITLE_LENGTH, META_DESCRIPTION_LENGTH, THIN_CONTENT, LARGE_PAGE" and "every catalogue entry declaring a min or a max is in the set"; it fails. Verify: `pnpm --filter @app/contracts run test:ci` fails because the module does not exist
- [x] 1.2 New `seo/seo-measurement.interface.ts` (`ISeoMeasurement`) and `seo/measured-issue-codes.constant.ts` (`TMeasuredIssueCode` from the catalogue's shape, `MEASURED_ISSUE_CODES` filtered from `SEO_ISSUE_CODES` — no second list). Verify: `pnpm --filter @app/contracts run test:ci`
- [x] 1.3 Catalogue edits in `seo/seo-issue-catalogue.constant.ts`: `TITLE_LENGTH.severity` → `notice` (bounds unchanged); remove `SLOW_RESPONSE` and `KEYWORD_NOT_IN_TITLE`; add `STRUCTURED_DATA_MISSING` (notice) whose hint speaks about rich-result eligibility and never about a violation. Verify: `pnpm --filter @app/contracts run test:ci` and `node -e "import('@app/contracts').then(m=>console.log(m.SEO_ISSUE_CODES.length))"` prints 18 after a build
- [x] 1.4 Rewrite `seo/seo-issue.interface.ts`: `TIssueDetails<TCode>` conditional on `TMeasuredIssueCode`, and `ISeoIssue` → `TSeoIssue` as a union over the code (`practices/naming/SKILL.md`: a type alias takes `T`). Update the barrel. Verify: `pnpm --filter @app/contracts run build` succeeds and `pnpm typecheck` now fails in `be` and `fe` with the missing and excess catalogue keys — that failure is this sub-phase's deliverable
- [x] 1.5 Commits: `feat(contracts): a typed measurement for threshold findings`; `feat(contracts): retire SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE, add STRUCTURED_DATA_MISSING`; `refactor(contracts): ISeoIssue is a union, so it is TSeoIssue`

## 2. The rules (1b) — ANALYSIS-008

- [x] 2.1 Write `services/seo-rules/rules/structured-data-rules/structured-data-rules.spec.ts` first: `Article` passes, `BlogPosting` passes, `Organization` alone fails, no JSON-LD fails; it fails. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules/rules/structured-data-rules` fails because the module does not exist
- [x] 2.2 Rewrite the threshold cases of `title-rules.spec.ts`, `meta-rules.spec.ts`, `content-rules.spec.ts`, `transport-rules.spec.ts` to assert the measurement shape — "a 61-character title fails with `{ value: 61, min: 30, max: 60 }`"; they fail on the old `{ length: … }` / `{ words: … }` / `{ bytes: … }`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules` fails
- [x] 2.3 `seo-rule.interface.ts`: a rule's return type is conditional on its code (`TSeoRuleGroup` becomes a mapped type `{ [K in TCode]: TSeoRule<K> }`); drop `topKeyword` and `responseMs` from `ISeoRuleInput` — nothing reads them once the two rules are gone, and an input nobody reads invites a rule that silently depends on keyword ordering. Verify: `pnpm typecheck`
- [x] 2.4 Implement `STRUCTURED_DATA_MISSING` with a named `ARTICLE_TYPES` set; delete `rules/keyword-rules/` and its spec; drop `SLOW_RESPONSE` from `transport-rules`; update the four threshold rules to return measurements; update `_testing/make-rule-input.ts`, `page-analysis.service.ts` and its spec, and the `ISeoIssue` → `TSeoIssue` references in `crawl-results.service.ts` and `seo-issues.repository.ts`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis && pnpm typecheck`
  AMENDED during implementation: two further renames the task did not name were forced by the
  union. `INewSeoIssue` became `TNewSeoIssue = TSeoIssue & { pageId: number }` and
  `IIssueRecord` became `TIssueRecord = TSeoIssue`, so a finding is typed by the catalogue on
  the way into the database and on the way out. `seo_issues.details_json` is typed
  `TSeoIssue['details']` for the same reason; the one cast left is in `issuesForPage`, where
  the database's jsonb becomes a typed value, and it is commented as the trust boundary.
- [x] 2.5 No trace of the retired codes remains. Verify: `git grep -n "SLOW_RESPONSE\|KEYWORD_NOT_IN_TITLE" -- be packages fe` prints nothing
  AMENDED during implementation: `be packages` is clean at this point; `fe` still names both
  codes in `groupIssues.ts` and is cleared by task 4.4, which is the sub-phase that owns the
  screens. Four further references were cleared here that the task did not name: a comment on
  `IHttpResponse.ttfbMs`, a comment on `pages.response_ms`, and the e2e case
  `crawl.e2e-spec.ts` "flags KEYWORD_NOT_IN_TITLE…", rewritten to pin STRUCTURED_DATA_MISSING
  over the same crawl path.
- [x] 2.6 `seo-rules.registry.spec.ts`'s "reports catalogue severity and order" still passes with 18 codes. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules`
- [x] 2.7 Commits: `feat(be): a structured-data check for Article and BlogPosting`; `refactor(be): a threshold rule returns its measurement, not loose details`; `refactor(be): drop the timing and top-keyword rules and the inputs they needed`

## 3. The extractor (1c) — ANALYSIS-009

- [x] 3.1 Write the two cases in `services/html-extraction/extract-page.spec.ts` first, from the real markup shape: "a copy-link control inside an h2 is not part of the heading (vercel.com, field study finding 7)" asserting the heading is exactly `Agentic infrastructure`, and "an `aria-hidden` element contributes no text"; they fail returning `Copy link to headingAgentic infrastructure`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction` fails
- [x] 3.2 In `extract-page.ts`: move the separator pass above the heading and block collection and extend it with `button, label, a`; add a `HIDDEN_TEXT` selector (`[aria-hidden="true"], [hidden], .sr-only, .visually-hidden, .visuallyhidden, .screen-reader-text, .screen-reader-only, .a11y-hidden`) to the clone's removal; drop `button, [role="button"]` from inside headings only. The comment names field study finding 7 as the defect that produced the rule. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction`
- [x] 3.3 The golden fixture test over the 15 recorded Yoast posts still holds. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction`. If a property assertion fails, record it here as an `AMENDED during implementation:` line with the before and after — never loosen the bound
  VERIFIED: 34 tests, all green. No property assertion moved.
- [x] 3.4 Record the top three keywords of `/how-to-remove-www-from-your-url/` before and after in the commit body, so a reviewer who was not there can see what moved. Commit: `fix(be): a control inside a heading is not part of the heading`
  VERIFIED: `www | remove www | url` before AND after — and the same for all 22 recorded
  Yoast posts, not just this one. Yoast's markup carries no accessibility-only label inside
  a heading, so the fixture suite could never have caught the defect and does not move now
  that it is fixed. The vercel.com case is pinned instead by `extract-page.spec.ts`.

## 4. The screens (1d) — PAGEDETAIL-006, ANALYSIS-008

- [x] 4.1 Write `fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.test.ts` cases first: "a TITLE_LENGTH issue reads 'The title is 72 characters; aim for 30–60.' from value/min/max" and "STRUCTURED_DATA_MISSING has a sentence"; they fail. Verify: `pnpm --filter fe test:ci -- groupIssues` fails
- [x] 4.2 Write `fe/src/Gateways/PageGateway/Validation/PageSchemas.test.ts` cases first: "an issue with an unknown code fails to parse" and "a TITLE_LENGTH issue without `value` fails to parse"; the second fails. Verify: `pnpm --filter fe test:ci -- PageSchemas` fails
- [x] 4.3 `IPageDetail.page` gains `responseMs`; `page-detail.repository.ts` selects `response_ms`; `page-read.service.ts` maps it. Verify: `pnpm --filter be test:db -- pages`
  VERIFIED: 42 database tests green.
- [x] 4.4 `PageSchemas.ts`: a per-code details union, measured codes parsed as a measurement; `pageDetailSchema.page` gains `responseMs`. `groupIssues.ts`: the two retired entries removed, `STRUCTURED_DATA_MISSING` added, the four measured sentences read `value`/`min`/`max`. `PageDetailHeader.tsx`: `· 234 ms to first byte` in the facts line, with the tooltip saying it is one fetch from our crawler and not a field measurement. Verify: `pnpm --filter fe test:ci && pnpm typecheck`
- [x] 4.5 Before the browser walk, confirm no retired code is stored — `seoIssueSchema`'s `z.enum(SEO_ISSUE_CODES)` turns one into a parse error that blanks the detail screen. Verify: `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select distinct code from seo_issues"` lists only catalogue codes; if not, follow the plan's OQ2 recovery (never `docker compose down -v`)
  AMENDED during implementation: run twice, with opposite results, and both matter.
  Against the SHARED developer database (`seo-keyword-tracker-postgres-1`) it FAILED exactly as
  the plan's regression guard predicted: that database holds KEYWORD_NOT_IN_TITLE and
  SLOW_RESPONSE from a crawl made before this change, and `seoIssueSchema` now rejects both, so
  the detail screen would blank — I10 working as designed. OQ2's recovery was NOT run there: that
  database belongs to the stack another session is working in, and deleting its crawl runs is not
  this change's call. Whoever owns it runs OQ2's three commands before opening a detail page;
  never `docker compose down -v`.
  VERIFIED on a clean stack (compose project `skt-accuracy`, port 8081, built and seeded from
  this worktree): `select code, count(*) from seo_issues group by code` returns only
  META_DESCRIPTION_LENGTH (4), TITLE_LENGTH (3) and STRUCTURED_DATA_MISSING (1) — catalogue codes
  only, and the new check firing on a real page. This is the reviewer's path, and on it the
  problem cannot arise.
- [ ] 4.6 Browser walk. Verify: `docker compose up -d --build`, then `/pages/<id>` shows the response time in the facts line and no timing issue, with no console error
  NOT DONE HERE: no browser in this environment. The stack is LEFT RUNNING at
  http://localhost:8081 (compose project `skt-accuracy`, seeded, both demo users) so the walk is
  one tab away — it was built under a separate project name because the default
  `seo-keyword-tracker` belongs to another session's containers.
  VERIFIED without a browser, against that stack: the detail of
  /blog/seo-split-test-result-does-bolded-text-help-your-seo/ answers with
  `page.responseMs: 530` and NO timing issue, while a Yoast page answers with
  `responseMs: 1432` and also no timing issue — the same catalogue, two response times four
  times apart, which is the measurement that retired SLOW_RESPONSE in the first place.
- [x] 4.7 Commits: `feat(fe): read a threshold finding from its own measurement`; `feat(fe): response time as a fact of the crawl, not a verdict`

## 5. The requirements that already existed (1a–1d) — ANALYSIS-001, ANALYSIS-002, PAGEDETAIL-005

These are amended IN PLACE in the changes that own them, because `openspec/specs/` holds only
`.gitkeep` and a `## MODIFIED Requirements` block would name a base requirement that does not
exist (plan §20 OQ4). Each amendment carries its `AMENDED during implementation:` line.

- [x] 5.1 `openspec/changes/page-analysis/specs/be/src/modules/page-analysis/spec.md` — ANALYSIS-001: the rule's outcome is no longer "details or null"; a measured code's finding is a measurement. ANALYSIS-002: the code list drops SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE, adds STRUCTURED_DATA_MISSING, moves TITLE_LENGTH to notice, and its 61-character scenario asserts `{ value: 61, min: 30, max: 60 }`. Verify: `pnpm exec openspec validate --type spec` accepts both files and `git grep -n "AMENDED during implementation" openspec/changes/page-analysis` shows the trail
- [x] 5.2 `openspec/changes/tracker-screens/specs/fe/src/Modules/PageDetail/spec.md` — PAGEDETAIL-005: an issue's sentence is rendered from the stored measurement where the code has one. Verify: `pnpm exec openspec validate --type spec`
- [x] 5.3 Commit: `docs(openspec): amend the analysis requirements the corrected catalogue falsifies`

## 6. The research stops saying it binds nothing (1e)

- [x] 6.1 `practices/search-engines/SKILL.md` — the "Status: background, binding nothing" paragraph names this change and the plan, its own condition ("work that starts after the current screens change ships") having been met. The references are untouched: a field study is a record of a day and is never rewritten. Verify: `git diff --stat practices/search-engines/` lists only `SKILL.md`
- [x] 6.2 Commit: `docs(practices): the search-engines study has been acted on`

## 7. Phase acceptance

- [x] 7.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
  VERIFIED: lint, typecheck, 61 contracts + 347 backend + 156 frontend unit tests, 121 database
  tests, all green, after all three phases.
- [x] 7.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
  VERIFIED on the isolated stack: `docker compose -p skt-accuracy up -d --build` then
  `curl -fsS http://localhost:8081/api/health` → `{"status":"ok","database":"up"}`.
