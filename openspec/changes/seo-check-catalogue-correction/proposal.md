# The catalogue says only what it can judge

## Why

The field study of 2026-10-03 (`practices/search-engines/references/field-study-2026-10.md`) ran
this repository's own `extractPage`, `extractKeywords` and `evaluateSeoRules` against fifteen
live blog pages. Three things came back that the catalogue should act on:

- `KEYWORD_NOT_IN_TITLE` fired 0 of 15 and cannot fire by construction — title presence is the
  largest field weight in keyword scoring, so the top keyword is nearly always a title term. A
  check that cannot fail reports success forever.
- `SLOW_RESPONSE` measures the crawler's network position, not the page: the same site answered
  in 41 ms and 1728 ms minutes apart. Core Web Vitals are 75th-percentile field metrics that a
  single server-side fetch cannot approximate.
- Structured data is the one uncovered signal that actually varied on real data — Moz emits
  `Article` + `Organization` + `BreadcrumbList`, Cloudflare `BlogPosting`, Vercel none — and
  `jsonLd.types` is already extracted and then discarded.

Separately, a threshold finding stores `{ length, min, max }` in a `Record<string, unknown>`
beside a rigorously typed catalogue, and reads its bounds from the catalogue at display time. Move
a threshold and every old verdict silently re-explains itself against a bound that was not used
to reach it.

And the extractor has a confirmed defect, visible only on real HTML: it joins adjacent text nodes
without a separator and filters no accessibility-only labels, so a copy-link control inside a
`<h2>` on vercel.com produced the heading `Copy link to headingAgentic infrastructure` and the
keywords `headingagentic infrastructure` and `headingthe future`.

## What Changes

- `@app/contracts`: `TITLE_LENGTH` moves from warning to notice (its 30–60 bounds are unchanged);
  `SLOW_RESPONSE` and `KEYWORD_NOT_IN_TITLE` are removed; `STRUCTURED_DATA_MISSING` (notice) is
  added — 19 codes become 18. New `ISeoMeasurement` and `MEASURED_ISSUE_CODES`, the latter
  derived from the catalogue so no second list exists. `ISeoIssue` becomes `TSeoIssue`, a union
  over the code, so a measured code's `details` is narrowed to the measurement.
- `be/src/modules/page-analysis`: a rule's return type is conditional on its code; a new
  `structured-data-rules` group; `keyword-rules` deleted; `SLOW_RESPONSE` dropped from
  `transport-rules`; `ISeoRuleInput` loses `topKeyword` and `responseMs`, which nothing reads any
  more. `extractPage` inserts its separator before reading headings and blocks, removes
  accessibility-only text, and drops controls from inside headings.
- `IPageDetail.page` gains `responseMs`, shown on the detail as a fact of the crawl.
- `fe`: the per-code sentence map loses two entries and gains one; measured sentences read
  `value`, `min`, `max` from the row; the response validator parses a measured code's details as a
  measurement.
- `practices/search-engines/SKILL.md`: the status paragraph saying the research binds nothing is
  updated, its own condition having been met.

No schema change.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-008, ANALYSIS-009 (new); ANALYSIS-001 and
  ANALYSIS-002 amended in place in the unarchived `page-analysis` change, because
  `openspec/specs/` holds no base for them to be MODIFIED against.
- `fe/src/Modules/PageDetail` — PAGEDETAIL-006 (new); PAGEDETAIL-005 amended in place in the
  unarchived `tracker-screens` change.

## Impact

`packages/contracts/src/domain/seo/**`, `packages/contracts/src/domain/pages/page-detail.interface.ts`,
`be/src/modules/page-analysis/services/{seo-rules,html-extraction}/**`,
`be/src/modules/pages/{repositories/page-detail,services/page-read,services/crawl-results}/**`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`,
`fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts`,
`fe/src/Modules/PageDetail/PageDetailHeader/PageDetailHeader.tsx`.

Plan: `docs/_plans-archive/seo-analysis-accuracy.md`, phase 1.
