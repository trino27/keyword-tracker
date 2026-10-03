# Tasks — page-analysis

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 4. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Catalogue and schema (4a) — ANALYSIS-001, ANALYSIS-005

- [x] 1.1 Contracts `seo/seo-issue-severity.enum.ts`, `seo/seo-issue-catalogue.constant.ts` (all D16 codes with severities, labels, thresholds), `seo/seo-issue.interface.ts`; barrel. Verify: `pnpm typecheck`
  AMENDED during implementation: each entry also carries a one-sentence `hint` for the page detail screen, and `SEO_ISSUE_CODES` lists the keys in catalogue order — the order issues are reported in.
- [x] 1.2 Write int-specs for `keywords`, `page-keywords`, `seo-issues` repositories (seo_issues_page_id_code_uq, page_keywords_relevance_range, upsert by term returns the existing id, page delete cascades pairs and issues but not keywords); they fail. Verify: `pnpm --filter be test:db -- keywords page-keywords seo-issues` fails
  AMENDED during implementation: the three repositories share one int-spec, `page-keywords.repository.int-spec.ts`, because every case needs the same page and runs; filter it with `pnpm --filter be test:db page-keywords`.
- [x] 1.3 Schemas (exporting `seoIssueSeverityEnum`), register, generate, read the SQL, migrate; repositories. Verify: `pnpm db:generate && pnpm db:migrate && pnpm --filter be test:db -- keywords page-keywords seo-issues`

## 2. Extraction (4b) — ANALYSIS-003

- [x] 2.1 Write `extract-page.spec.ts` against fixtures (semrush head title vs SVG title, yoast JSON-LD keywords and Article, main-content stripping, word count, lang); it fails. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction` fails
- [x] 2.2 Implement `extractPage`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction`
  AMENDED during implementation: built during phase 3g, ahead of 4a — post selection needs the JSON-LD types to recognise a listing and the pages row needs the extracted fields. `IParsedPage` lives in `modules/page-analysis/interfaces/`; text blocks are separated before words are counted, so adjacent elements never fuse into one word.

## 3. SEO rules (4c) — ANALYSIS-001, ANALYSIS-002

- [x] 3.1 Write one table-driven spec per rule group with every threshold at, below and above its boundary and `details` asserted, and `seo-rules.registry.spec.ts` ("emits only catalogued codes over every fixture page"); they fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules` fails
- [x] 3.2 Implement the rule groups and `SEO_RULES: Record<TSeoIssueCode, ISeoRule>`. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules && pnpm typecheck`
  AMENDED during implementation: a rule is a function, `TSeoRule = (input) => details | null`, not an object — severity comes from the catalogue, so a rule has nothing else to declare. `normalizeText` (`services/text/normalize-text/`) is shared by the keyword rule and the keyword extractor, so a title and a keyword are compared in the form keywords are stored in.
- [x] 3.3 Prove the compile-time completeness once: comment out one registry entry, `pnpm typecheck` fails, restore. Verify: `pnpm typecheck`
  VERIFIED: with `...KEYWORD_RULES` commented out, tsc reported TS2741 "Property 'KEYWORD_NOT_IN_TITLE' is missing"; restored.

## 4. Keyword extraction (4d) — ANALYSIS-004…ANALYSIS-006

- [x] 4.1 Write specs for tokenize, stop words, collect-candidates (no stop-word edges, no heading crossing, brand suffix removed), score-candidates (IDF factor 1 at N=1 and < 0.3 for a term on all of 15 pages), select-keywords (5–8, top relevance 1, subsumption), and a golden fixture test (yoast slug phrase in the top 3, "yoast" in no top 3); they fail. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction` fails
  AMENDED during implementation: "yoast" is matched as a whole word — "yoastcon", the subject of a post about the event, is a legitimate keyword. The golden test also requires a slug phrase in the top 3 of at least 12 of the 15 posts.
- [x] 4.2 Implement with `constants/keyword-scoring.constant.ts` and the `stopword` lists (Q7). Verify: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction`
  AMENDED during implementation: the `stopword` English list lacks common web words (why, will, its, …); `EXTRA_ENGLISH_STOP_WORDS` supplements English only. `•` joins the title separators — yoast titles end in " • Yoast". A subsumed candidate is one contained in ANY longer candidate scoring at least 0.8 of it; requiring the longer one to rank higher would make the ratio meaningless.

## 5. Analysis in the crawl (4e) — ANALYSIS-007

- [x] 5.1 Extend `crawl-results.service.spec.ts` (issues replaced, surviving pair relevance and run id updated, no pair deleted) and `crawl.e2e-spec.ts` (every page 5–8 pairs and its issues; KEYWORD_NOT_IN_TITLE on the synthetic page); they fail. Verify: `pnpm --filter be test:db -- crawl` fails
- [x] 5.2 `PageAnalysisModule` + `PageAnalysisService.analyseRun`; executor calls it after fetching, outside the transaction; `CrawlResultsService` writes keywords, pairs and issues in finalize. Verify: `pnpm --filter be test:ci && pnpm --filter be test:db -- crawl`
  VERIFIED beyond the task: a live re-crawl of both clients in docker stored 5–8 keywords per post ("seo specialist", "keyword bidding", "keyword research tools", …) and moved every pair to the new run.
- [x] 5.3 Verify nothing deletes pages or pairs: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src` prints nothing
  AMENDED during implementation: the int-spec deletes a page on purpose, to prove the cascade; the guard is `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src ':!*spec.ts'`, which prints nothing.
