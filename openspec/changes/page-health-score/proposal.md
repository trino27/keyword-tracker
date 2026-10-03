# A page health score, with the denominator it was computed from

## Why

A user looking at fifteen pages with seven findings each has no way to decide which to open
first. A score gives them one, but only if the number is honest about what it counted.

A fixed denominator is not honest. `META_DESCRIPTION_LENGTH` cannot be judged on a page with no
description; `IMAGES_MISSING_ALT` cannot be judged on a page with no images; `CANONICAL_MISMATCH`
cannot be judged on a page with no canonical. Counting them as passes rewards a page for being
emptier, and counting them as failures punishes it twice for one gap. The only place that knows
which checks applied is the analysis, while the parsed page is still in hand — the `pages` row
holds no canonical, no Open Graph and no JSON-LD, so applicability cannot be recovered at read
time.

The share of applicable checks that passed invents no weights, which is the strongest claim
available from HTML alone: *this page has no obvious technical defects*. Lighthouse's SEO category
works the same way and publishes its model, so the precedent is checkable rather than asserted
(`practices/search-engines/references/ranking-signals.md`).

Sorting worst-first is the reason to have a score at all — and it is also where this gets
dangerous. The list is paginated, and an order whose key is not unique lets rows repeat and
vanish between pages.

## What Changes

- `be/src/modules/page-analysis`: a rule answers `pass`, `notApplicable` or a finding;
  `evaluateSeoRules` returns the issues together with how many checks applied and how many
  failed, from one pass.
- `pages` gains `checks_applicable` and `checks_failed`, both `smallint NOT NULL` with no
  default, under `CHECK (checks_applicable > 0)` and
  `CHECK (checks_failed >= 0 AND checks_failed <= checks_applicable)` — so the division cannot be
  by zero and the score cannot leave 0–100. Written in the same transaction as the page's issues.
- `@app/contracts`: `IPageScore`, `pageScoreOf`, `SCORE_BANDS`; `IPageListItem` and `IPageDetail`
  gain `score`.
- The pages list is ordered worst first, with a total order ending in the page id so pagination
  stays stable.
- `fe`: a score badge with its band, a **Score** column leading the list, a **Health score** KPI
  card on the detail.

No stale-analysis mechanism: nothing has been deployed, so there is no pre-existing data to carry
and no "no score yet" state on any screen. The migration therefore adds two NOT NULL columns
without a default, which is correct for a clean clone and is a developer-only inconvenience
locally — the plan states the recovery, and it never touches a docker volume.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-010 (new).
- `be/src/modules/pages` — PAGES-009, PAGES-010 (new).
- `fe/src/Modules/Pages` — PAGELIST-006 (new).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-007 (new).

ANALYSIS-007 is amended in place in the unarchived `page-analysis` change: a re-crawl now
refreshes the two counters with the issues.

## Impact

`be/src/persistence/schema/tables/pages/pages.schema.ts` + one generated migration,
`be/src/modules/page-analysis/services/seo-rules/**`,
`be/src/modules/crawl/services/crawl-run-executor/**`,
`be/src/modules/pages/{repositories/{pages,page-list,page-detail},services/{crawl-results,page-read}}/**`,
`packages/contracts/src/domain/{pages,seo}/**`, `fe/src/Gateways/PageGateway/Validation/**`,
`fe/src/Modules/{_Shared/ScoreBadge,Pages/PagesTable,PageDetail/KpiCards}/**`, `README.md`.

Depends on `seo-check-catalogue-correction`: scoring a check that is about to be retired would
bake it into a number.

Plan: `docs/_plans-archive/seo-analysis-accuracy.md`, phase 2.
