# Core Web Vitals per URL, readable at a glance

## Why

The brief asks for LCP, INP and CLS per URL from the collected PageSpeed data, readable at a
glance in good / needs-improvement / poor bands, and for a failing metric to be an issue. After
`page-speed-measurement` the measurements are stored and the failing metrics are already issues;
nothing yet SHOWS the three values. The pages list is where a marketer triages, so the values sit
beside the score there, and the page itself gets a block that says what each number is, where it
came from and how old it is.

The SEO score must not move (plan D7) — Lighthouse keeps SEO and Performance apart, Search Console
keeps Core Web Vitals in its own report — so the score's explainer says so in words.

## What Changes

- `@app/contracts`: `ICwvReading`, `IPageSpeedMeasurement`, `IPageSpeedSummary`;
  `IPageListItem.pageSpeed`, `IPageListResponse.pageSpeedAvailability`, `IPageDetail.pageSpeed`
  and `.pageSpeedAvailability` (`IPageSpeedAvailability { state }` comes from
  `page-speed-measurement`, plan D27).
- `be/src/modules/pages`: the list's slice and the detail read the page's `page_speed` row (the
  list stays five statements); bands are derived at read time with `cwvBandOf`; `lastError` is
  sent only for a failed row; the state comes from `pageSpeedAvailabilityOf`.
- `fe`: a Core Web Vitals column of three badges beside Score, with every state named in the plan
  (including "PageSpeed key rejected" and "Paused") and a legend; a Speed block on the page
  detail; a fifth score-explainer paragraph; the three states' words in one `Record`
  (`Core/Constants/pageSpeedAvailabilityCopy.ts`).

## Capabilities

- `be/src/modules/pages` — PAGES-014 (new).
- `fe/src/Modules/Pages` — PAGELIST-008 (new).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-011, PAGEDETAIL-012 (new).

## Impact

`packages/contracts/src/domain/{page-speed,pages}/**`,
`be/src/modules/pages/{repositories/page-list,repositories/page-detail,services/page-read}/**`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`, `fe/src/Core/{Helpers/DescribeCwv,Constants}/**`,
`fe/src/Modules/{Pages/PagesTable,PageDetail}/**`, `fe/src/ViewModels/{PagesViewModel,PageDetailViewModel}/**`,
`README.md`.

Depends on `page-speed-measurement`. Independent of `client-issue-report`.

Plan: `docs/_plans/issue-report-and-pagespeed.md`, phase 3.
