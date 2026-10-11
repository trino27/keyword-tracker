# Links, canonical targets and hreflang answers, checked inside the crawl

## Why

Some checks depend on what another URL answers:

- broken links in the text;
- internal links that redirect;
- a canonical whose target redirects, errors, is noindexed or is canonicalised again;
- hreflang alternates that do not link back.

Ahrefs reports all four, and our crawl never asks. The interview placed the requests inside the
crawl: after post selection, before analysis, and before the one transaction (plan D4). They run
under a budget, honour robots.txt per host, and never let an unchecked URL read as fine (D6,
D11). External links are broken only on 404, 410 or a nonexistent domain, because anti-bot
answers would otherwise flood the report (D3). A separate queue like PageSpeed's was rejected. It
would bring a new owner, a pending UI, findings that change after the crawl, and a race with the
next crawl, all for requests that have neither Google's quota nor minute-long answers.

No new check may report a fact an existing check already reports (the user, 2026-10-11, plan
D32–D36). Where two meet on one fact, the more specific keeps it and the other steps aside:

- `CANONICAL_MISMATCH` steps aside when the canonical's target is broken, which is
  `CANONICAL_TARGET_BROKEN`'s (D34). Both read one shared predicate over the same outbound
  facts.
- `CANONICAL_TARGET_BROKEN` steps aside for the page's http:// twin (`CANONICAL_TO_HTTP`'s) and
  for a development-host target (D36).
- The link checks skip links to this site's development host (`DEVELOPMENT_HOST_REFERENCES`'s).
  `LINKS_TO_REDIRECTS` also skips link variants (`INTERNAL_LINK_VARIANTS`'s, D29).
- `HREFLANG_NOT_RECIPROCAL` skips alternates with an invalid code or a development host. It
  steps aside entirely when the page's canonical names another URL (`HREFLANG_INVALID`'s, D36).

Because `SITEMAP_LISTS_NON_INDEXABLE` reads `CANONICAL_MISMATCH` findings, it also reads
`CANONICAL_TARGET_BROKEN`'s. Otherwise D34 would silently drop those entries (plan D37, derived,
not yet confirmed by the user).

## What Changes

- `be/src/infrastructure/remote-api`: `remoteFailureKindOf` (new), which names a nonexistent
  domain (`ENOTFOUND`) apart from a temporary DNS failure.
- `be/src/modules/crawl`:
  - `SiteHttpClient.checkLink` (status only, zero-byte cap, no retry, 5 s) and `readDocument`
    (HTML under the existing cap, no retry, 5 s);
  - `OutboundChecksService` and `HostRobotsCache` (new);
  - `OUTBOUND_CHECK_LIMITS` (300 links, 30 documents, concurrency 8, 2 per host, 5 s, 60 s
    deadline);
  - a pipeline stage `outbound` between `fetch` and `analysis` (plan D26).
- `be/src/modules/page-analysis`:
  - `IOutboundFacts` and `ICheckInput.linkStatuses`;
  - `_shared/link-verdict.ts` with `EXTERNAL_BROKEN_STATUSES`, `_shared/link-variants.ts` (moved),
    and `_shared/document-facts.ts`;
  - four page-scoped checks: `BROKEN_LINKS`, `LINKS_TO_REDIRECTS` (notices), and
    `CANONICAL_TARGET_BROKEN`, `HREFLANG_NOT_RECIPROCAL` (warnings);
  - `_shared/canonical-target.ts` (`canonicalTargetProblemOf`), read by `CANONICAL_TARGET_BROKEN`
    and by `CANONICAL_MISMATCH`, which now reads `linkStatuses` and steps aside for a broken
    target;
  - `_shared/hreflang-code.ts`: `HREFLANG_INVALID`'s code validator, moved unchanged so the
    reciprocity check skips exactly what it reports;
  - the step-asides of plan §10.13 (D36), each with a spec case named for the older check;
  - `sitemap-checks.ts` reads `CANONICAL_TARGET_BROKEN` findings (D37);
  - `HREFLANG_INVALID`'s comment now points at the reciprocity check.
- `be/eslint.config.mjs`: checks and site checks cannot import the HTTP client or the crawl
  module (plan D28).
- `FixtureHttpTransport`: an unrecorded status-only request answers 200, so recorded posts'
  external links do not all read as broken. It still never makes a network call.
- `@app/contracts`: four catalogue entries. `BROKEN_LINKS`'s explanation states D3's rule.
- `fe`: four `DESCRIBE` sentences.
- Docs: `CRAWL_MODULE.md` gains the stage, the budgets and the measured added duration.

## Capabilities

- `be/src/modules/crawl` — CRAWL-011, CRAWL-012, CRAWL-013 (new).
- `be/src/infrastructure/remote-api` — REMOTE-005 (new).
- `be/src/modules/page-analysis` — ANALYSIS-024 … ANALYSIS-027 (new). ANALYSIS-026 also carries
  `CANONICAL_MISMATCH`'s step-aside and the sitemap's `CANONICAL_TARGET_BROKEN` branch. A
  MODIFIED block of ANALYSIS-023 is not used, because that requirement is still in flight in
  `markup-gap-checks`.

## Impact

Paths affected:

- `be/src/infrastructure/remote-api/**`;
- `be/src/modules/{crawl,page-analysis}/**`;
- `be/eslint.config.mjs`;
- `be/test/{e2e,fixtures}/**`;
- `packages/contracts/src/domain/seo/**`;
- `fe/src/Core/Helpers/DescribeIssue/**`;
- `be/src/modules/crawl/CRAWL_MODULE.md`.

No migration. A crawl makes at most 330 more requests, plus robots.txt per external host,
bounded by a 60 s stage deadline.

It depends on `markup-gap-checks`, for four reasons:

- both edit `hreflang-invalid.check.ts`;
- this change extends the `ICheckInput` that change widens;
- `CANONICAL_TARGET_BROKEN` defers to that change's `isHttpTwin`;
- the sitemap requirement ANALYSIS-023 is added there.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 3.
