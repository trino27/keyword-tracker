# A finding shared across a client's pages reads as one finding

## Why

In the field study, `H1_MULTIPLE` and `HEADING_SKIP` fired on five of five Moz pages. That is one
template emitting two `h1`s and an irregular outline — one problem, in one layout file. Reported
per page it reads as ten separate tasks, and a user who fixes them one page at a time is doing
the wrong work five times.

The data already answers the question: how many of this client's current pages carry this code.
Nothing needs to be stored. This follows the precedent the pages module already set, where
`bestPosition` and `lastCapturedAt` are computed at read time rather than denormalised.

The one way to get this wrong is to compute the spread over the filtered slice instead of over
the client's current pages. With a search matching one page, a code affecting five would report
one — and "on 1 page" looks plausible enough that nobody would question it.

## What Changes

- `be/src/modules/pages`: a fifth statement in the list repository returning, per client and
  code, how many of that client's current pages carry it — built from the current-pages set
  **without** the search filter. `issuesForPage` returns the same number per code.
- `@app/contracts`: `IPageIssueCounts` gains `siteWide` — how many of this page's findings also
  appear on at least one other current page of the same client; the detail's issues gain
  `pagesAffected`.
- `fe`: the list row's issue cell gains a dimmed `· N site-wide`; each line of the detail's
  issues section gains `· on 5 of 15 pages` when the code affects more than one page.

No schema change, no new endpoint.

## Capabilities

- `be/src/modules/pages` — PAGES-011 (new).
- `fe/src/Modules/Pages` — PAGELIST-007 (new).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-008 (new).

## Impact

`be/src/modules/pages/repositories/{page-list,page-detail}/**`,
`be/src/modules/pages/services/page-read/**`,
`packages/contracts/src/domain/pages/{page-list-item,page-detail}.interface.ts`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`,
`fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/**`,
`fe/src/Modules/{Pages/PagesTable,PageDetail/IssuesSection}/**`.

Depends on `seo-check-catalogue-correction` (the code set must be final before counting how many
pages share one) and is sequenced after `page-health-score` only because both patch the same
`ORDER BY` and the same two screens.

Plan: `docs/_plans/seo-analysis-accuracy.md`, phase 3.
