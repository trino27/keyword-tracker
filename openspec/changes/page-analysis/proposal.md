# Page analysis — keywords and SEO issues

## Why

Each crawled page must show its likely keywords and its SEO issues, computed by the same logic for
the seed and for a UI-added client. Keywords must be explainable (no external API) and must not be
dominated by the site's own name; issues must come from one catalogue both sides read, so the
frontend can word them and a new rule cannot appear without a definition.

## What Changes

- `@app/contracts`: `SEO_ISSUE_SEVERITIES`, `SEO_ISSUE_CATALOGUE` (codes, severities, labels,
  thresholds), `ISeoIssue`.
- Tables `keywords` (global dictionary), `page_keywords` (relevance, `last_seen_run_id`),
  `seo_issues` (one per page and code).
- `be/src/modules/page-analysis/`: page extraction, the 19 SEO rules of D16 in a
  `Record<TSeoIssueCode, ISeoRule>` registry, field-weighted keyword extraction with a run-corpus
  IDF penalty.
- The crawl's finalize writes keywords, pairs and issues; a re-crawl replaces a page's issues and
  upserts its pairs without deleting any.

## Capabilities

- `be/src/modules/page-analysis` — ANALYSIS-001…ANALYSIS-007 (new).

## Impact

- New module `page-analysis`; `pages` module gains `KeywordsRepository`,
  `PageKeywordsRepository`, `SeoIssuesRepository`; `CrawlRunExecutor` and `CrawlResultsService`
  extended; dep `stopword`.
