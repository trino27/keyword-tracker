# Tasks — page-analysis

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 4. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Catalogue and schema (4a) — ANALYSIS-001, ANALYSIS-005

- [ ] 1.1 Contracts `seo/seo-issue-severity.enum.ts`, `seo/seo-issue-catalogue.constant.ts` (all D16 codes with severities, labels, thresholds), `seo/seo-issue.interface.ts`; barrel. Verify: `pnpm typecheck`
- [ ] 1.2 Write int-specs for `keywords`, `page-keywords`, `seo-issues` repositories (seo_issues_page_id_code_uq, page_keywords_relevance_range, upsert by term returns the existing id, page delete cascades pairs and issues but not keywords); they fail. Verify: `pnpm --filter be test:db -- keywords page-keywords seo-issues` fails
- [ ] 1.3 Schemas (exporting `seoIssueSeverityEnum`), register, generate, read the SQL, migrate; repositories. Verify: `pnpm db:generate && pnpm db:migrate && pnpm --filter be test:db -- keywords page-keywords seo-issues`

## 2. Extraction (4b) — ANALYSIS-003

- [ ] 2.1 Write `extract-page.spec.ts` against fixtures (semrush head title vs SVG title, yoast JSON-LD keywords and Article, main-content stripping, word count, lang); it fails. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction` fails
- [ ] 2.2 Implement `extractPage`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction`

## 3. SEO rules (4c) — ANALYSIS-001, ANALYSIS-002

- [ ] 3.1 Write one table-driven spec per rule group with every threshold at, below and above its boundary and `details` asserted, and `seo-rules.registry.spec.ts` ("emits only catalogued codes over every fixture page"); they fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules` fails
- [ ] 3.2 Implement the rule groups and `SEO_RULES: Record<TSeoIssueCode, ISeoRule>`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules && pnpm typecheck`
- [ ] 3.3 Prove the compile-time completeness once: comment out one registry entry, `pnpm typecheck` fails, restore. Verify: `pnpm typecheck`

## 4. Keyword extraction (4d) — ANALYSIS-004…ANALYSIS-006

- [ ] 4.1 Write specs for tokenize, stop words, collect-candidates (no stop-word edges, no heading crossing, brand suffix removed), score-candidates (IDF factor 1 at N=1 and < 0.3 for a term on all of 15 pages), select-keywords (5–8, top relevance 1, subsumption), and a golden fixture test (yoast slug phrase in the top 3, "yoast" in no top 3); they fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction` fails
- [ ] 4.2 Implement with `constants/keyword-scoring.constant.ts` and the `stopword` lists (Q7). Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction`

## 5. Analysis in the crawl (4e) — ANALYSIS-007

- [ ] 5.1 Extend `crawl-results.service.spec.ts` (issues replaced, surviving pair relevance and run id updated, no pair deleted) and `crawl.e2e-spec.ts` (every page 5–8 pairs and its issues; KEYWORD_NOT_IN_TITLE on the synthetic page); they fail. Verify: `pnpm --filter be test:db -- crawl` fails
- [ ] 5.2 `PageAnalysisModule` + `PageAnalysisService.analyseRun`; executor calls it after fetching, outside the transaction; `CrawlResultsService` writes keywords, pairs and issues in finalize. Verify: `pnpm --filter be test:ci && pnpm --filter be test:db -- crawl`
- [ ] 5.3 Verify nothing deletes pages or pairs: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src` prints nothing
