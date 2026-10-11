# Findings read from one page's markup, to close the gap to Ahrefs without losing precision

## Why

Ahrefs' blog tells site owners about several problems our catalogue does not report. Six of them
can be answered from the HTML the crawl already reads, with no new request:

- a canonical pointing to plain HTTP;
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
  - `ICheckInput.timeZone`;
  - the site check `contentNeedsJavascript` reading `IFetchedEntry.clientRendered`.
- `be/src/modules/crawl`:
  - `ISelectedItem.clientRendered`, set where a post is skipped as client-rendered. The skip and
    its reason text are unchanged;
  - the executor passes the flag and the owner's zone.
- `be/src/modules/clients`: `IRunTarget.timeZone` from the owner's `users.time_zone`.
- `fe`: one `DESCRIBE` sentence per new code.
- Docs: `PAGE_ANALYSIS_MODULE.md` gains the field-audit tally, D2's rejected list with its
  reasons, and two stale sentences corrected.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-014 … ANALYSIS-021 (new).

## Impact

Paths affected:

- `packages/contracts/src/domain/{seo,site}/**`;
- `be/src/modules/{page-analysis,crawl,clients}/**`;
- `fe/src/Core/Helpers/DescribeIssue/**`;
- `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`.

No migration and no new request.

The phase depends on nothing. `crawl-outbound-checks` depends on it, because both edit
`hreflang-invalid.check.ts` and that change reads `ICheckInput`'s new fields.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 1.
