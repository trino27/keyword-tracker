# Findings read from one page's markup, to close the gap to Ahrefs without losing precision

## Why

Ahrefs' blog tells site owners about several problems our catalogue does not report. Six of them
can be answered from the HTML the crawl already reads, with no new request:

- a canonical pointing to the page's own address over plain HTTP;
- og:url naming another URL;
- an hreflang set that leaves out its own page;
- a title still selling last year;
- a description that only repeats the title;
- a post with no breadcrumb markup;
- posts whose text appears only after JavaScript runs (a fact about the site).

The interview fixed an inclusion bar (plan D1). A check backed by a first-party source may take
any severity. An industry-only recommendation is admitted as a notice only, after it passes a
field audit, and only if it does not duplicate or contradict an existing check. Reading the tree
showed that `HREFLANG_INVALID` already reports the missing self-reference. That arm therefore
moves to the new code rather than being reported twice (plan D14).

The user then ruled (2026-10-11, plan D32–D36) that no new check may duplicate an existing one.
Where two meet on one fact, the more specific keeps it and the other steps aside. This change
applies that in three places:

- `CANONICAL_TO_HTTP` fires only on the page's own http:// twin, and `CANONICAL_MISMATCH` steps
  aside in exactly that case (D32). An http canonical naming another address stays
  `CANONICAL_MISMATCH`'s alone.
- `OG_URL_MISMATCH` steps aside when og:url names a development host, which is
  `DEVELOPMENT_HOST_REFERENCES`'s (D36).
- `META_DESCRIPTION_REPEATS_TITLE` and `META_DESCRIPTION_LENGTH` both stay, because length and
  content are two facts (D35).

`CANONICAL_MISMATCH` stepping aside would silently drop those pages from
`SITEMAP_LISTS_NON_INDEXABLE`, which reads its findings today. So the sitemap check also reads
`CANONICAL_TO_HTTP` (plan D37, derived, not yet confirmed by the user). Its existing canonical
branch gets the pinning test it lacked (D15), moved here from the dropped
`canonical-change-tracking` (D33).

## What Changes

- `@app/contracts`:
  - `INDUSTRY_SOURCE_HOSTS` and `inclusionBarViolations` (new), tested over both catalogues;
  - six crawl entries: `CANONICAL_TO_HTTP` (warning), `OG_URL_MISMATCH`,
    `HREFLANG_NO_SELF_REFERENCE`, `TITLE_YEAR_OUTDATED`, `META_DESCRIPTION_REPEATS_TITLE`,
    `BREADCRUMB_MISSING` (notices; names per plan D16);
  - `HREFLANG_INVALID`'s copy without the self-reference clause;
  - the site entry `CONTENT_NEEDS_JAVASCRIPT` (notice).
- `be/src/modules/page-analysis`:
  - six checks;
  - `HREFLANG_INVALID` loses its self-reference arm;
  - `_shared/http-twin.ts` (`isHttpTwin`); `CANONICAL_MISMATCH` steps aside for the http twin,
    and its `skipReason` says so;
  - `OG_URL_MISMATCH` steps aside for a development host (`isDevelopmentHost`);
  - `sitemap-checks.ts` reads `CANONICAL_TO_HTTP` findings, and both canonical branches are
    pinned by tests;
  - `ICheckInput.timeZone`;
  - the site check `contentNeedsJavascript` reading `IFetchedEntry.clientRendered`.
- `be/src/modules/crawl`:
  - `ISelectedItem.clientRendered`, set where a post is skipped as client-rendered. The skip and
    its reason text are unchanged;
  - the executor passes the flag and the owner's zone.
- `be/src/modules/clients`: `IRunTarget.timeZone` from the owner's `users.time_zone`.
- `fe`: one `DESCRIBE` sentence per new code.
- Docs: `PAGE_ANALYSIS_MODULE.md` gains:
  - the field-audit tally;
  - D2's rejected list with its reasons, and `CANONICAL_CHANGED` with D33's reason;
  - the step-asides and the pairs checked and found not to duplicate;
  - two stale sentences corrected.

## Capabilities

- `be/src/modules/page-analysis`:
  - ANALYSIS-014 … ANALYSIS-021 (new);
  - ANALYSIS-023 (new), moved here from the dropped `canonical-change-tracking`. ANALYSIS-022 was
    allocated there to the dropped `CANONICAL_CHANGED` and is not reused.

## Impact

Paths affected:

- `packages/contracts/src/domain/{seo,site}/**`;
- `be/src/modules/{page-analysis,crawl,clients}/**`;
- `fe/src/Core/Helpers/DescribeIssue/**`;
- `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`.

No migration and no new request.

The phase depends on nothing. `crawl-outbound-checks` depends on it, for three reasons:

- both edit `hreflang-invalid.check.ts`;
- that change reads `ICheckInput`'s new fields;
- its `CANONICAL_TARGET_BROKEN` defers to the `isHttpTwin` built here.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 1.
