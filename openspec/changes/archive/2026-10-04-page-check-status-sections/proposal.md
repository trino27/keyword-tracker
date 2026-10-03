# The page says what every check concluded, and what its score may claim

## Why

The page detail asserts one number about the catalogue — "16 of 18 checks passed" — and nothing
else. It does not say which 16, why the other two were left out, or what the number is allowed to
mean. Two of those are unanswerable today rather than merely unanswered: the crawl discards the
identity of a skipped check at `seo-rules.registry.ts:58`, keeping only its effect on a counter.

The gap matters because the third verdict exists precisely to stop the screen lying. A rule
answers `pass`, `notApplicable` or `fails`, and the reason `notApplicable` was introduced is that
a page with no title was being rewarded for passing a check that never ran. A section that renders
"passed" for a check that never ran reintroduces the same false statement one layer higher.

The same is true as the catalogue grows. A page crawled under 18 checks and read under 20 cannot
say what the two new checks concluded, and any answer it gives — passed, failed, or silence — is
invented.

## What Changes

- **`be/src/modules/page-analysis`:** `evaluateSeoRules` keeps the code it was discarding.
  `ISeoEvaluation` gains `checksJudged` and `checksNotApplicable`, two disjoint lists in catalogue
  order whose union is the catalogue that ran.
- **`be/src/persistence/schema/tables/pages`:** two `varchar(64)[]` columns, `checks_judged` and
  `checks_not_applicable`, written by the same upsert as the counters. Five CHECK constraints:
  both arrays or neither, `checks_applicable = cardinality(checks_judged)`, disjointness, and
  element cleanliness on each (distinct, non-null, non-empty) through an IMMUTABLE
  `array_is_clean` function, because a CHECK may not contain the subquery that `unnest` needs.
  The columns arrive nullable; `page-checks-required` tightens them.
- **`be/src/modules/pages`:** a pure `composePageChecks` answers every catalogue code with one of
  four statuses from the stored arrays and the stored findings; `getPage` returns it. No new
  query — the arrays come from the row `findCurrentPage` already reads by primary key.
- **`@app/contracts`:** `IPageCheck` and `PAGE_CHECK_STATUSES` (`passed`, `failed`,
  `notApplicable`, `notYetChecked`); `ISeoIssueDefinition` gains `skipReason`, with
  `CONDITIONAL_ISSUE_CODES` derived from its presence so no second list of conditional codes can
  exist; `IPageDetail` gains `checks: IPageCheck[] | null`.
- **`fe/src/Modules/PageDetail`:** a **Checks** section listing every catalogue check with its
  status, naming the reason for each not-applicable one, and pointing at SEO issues for the
  details of the failures; and a **How this score is calculated** section showing the arithmetic on
  this page's own numbers, the equal weighting, the denominator and the Lighthouse bands, and what
  the score is not allowed to claim. `IssuesSection` and its severity ordering are not touched.

The pages list, its columns and its `order by` are deliberately unchanged: applicability cannot be
re-derived from today's catalogue, so the stored counters stay stored.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-011 (new)
- `be/src/modules/pages` — PAGES-012 (new)
- `fe/src/Modules/PageDetail` — PAGEDETAIL-009, PAGEDETAIL-010 (new)

## Impact

`packages/contracts/src/domain/seo/{seo-issue-catalogue.constant.ts,conditional-issue-codes.constant.ts}`,
`packages/contracts/src/domain/pages/{page-check.interface.ts,page-detail.interface.ts}`,
`be/src/persistence/schema/tables/pages/pages.schema.ts`, `be/drizzle/0008_*`, `be/drizzle/0009_*`,
`be/src/modules/page-analysis/services/{seo-rules,page-analysis}/**`,
`be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.ts`,
`be/src/modules/pages/{repositories/{pages,page-detail},services/{crawl-results,page-read,page-checks}}/**`,
`be/test/e2e/pages.e2e-spec.ts`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`,
`fe/src/ViewModels/PageDetailViewModel/Services/{SummariseChecks,ExplainScore}/**`,
`fe/src/Modules/PageDetail/{ChecksSection,ScoreExplainer,PageDetailScreen.tsx}`.

Plan: `docs/_plans/page-check-status-sections.md`, phase 1.
