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
- `be/src/modules/page-analysis` — ANALYSIS-024 … ANALYSIS-027 (new).

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

It depends on `markup-gap-checks`: both edit `hreflang-invalid.check.ts`, and this change
extends the `ICheckInput` that change widens.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 3.
