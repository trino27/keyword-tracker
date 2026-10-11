# The crawl remembers each page's canonical, and says when it changed

## Why

A canonical that silently moves is a classic cause of a page dropping out of search, for example
after a plugin update or a template change. Ahrefs reports it, and our catalogue cannot, because
the page row stores no canonical (`pages.schema.ts:52-55`). The interview chose two columns
(plan D7):

- the declared canonical;
- a flag saying whether it was recorded at all.

Without the flag, a row crawled before the migration cannot be told apart from a page that
declares none. Every page would then report a change on its first crawl after the migration.

The interview also asked for `SITEMAP_LISTS_NON_INDEXABLE` to name sitemap entries whose page
declares another canonical. Reading the tree showed it already does (`sitemap-checks.ts:45-47`),
and its catalogue explanation already says so. Nothing pins that branch, so this change adds
the test and builds nothing (plan D15).

## What Changes

- Database: `pages.canonical_url varchar(2048) NULL`, `pages.canonical_recorded boolean NOT NULL
  DEFAULT false`, and CHECK `pages_canonical_only_when_recorded`. Migration `0015` is generated.
  No backfill.
- `be/src/modules/pages`: the upsert writes both columns, and `findPreviousCrawlsForWorker`
  reads them. `IRunPage.canonicalUrl`. A canonical longer than 2 048 characters is stored as not
  recorded (plan D27).
- `be/src/modules/page-analysis`:
  - `IPreviousCrawl.canonical: { recorded: false } | { recorded: true; url: string | null }`;
  - the check `CANONICAL_CHANGED` (notice; Ahrefs source);
  - a pinning test for the sitemap's canonical branch.
- `be/src/modules/crawl`: `toRunPage` carries the canonical.
- `fe`: the `DESCRIBE` sentence for `CANONICAL_CHANGED`.

## Capabilities

- `be/src/modules/pages`: PAGES-015 (new).
- `be/src/modules/page-analysis`:
  - ANALYSIS-022 and ANALYSIS-023 (new);
  - ANALYSIS-010 (modified), whose reasoning names a row that holds no canonical.

The MODIFIED block restates the requirement whole. At archive it replaces the requirement of the
same id in `specs/` by hand. VERIFY: `pnpm exec openspec validate canonical-change-tracking`
accepts it against the `[ID]`-form base.

## Impact

Paths affected:

- `be/src/persistence/schema/tables/pages/**`;
- `be/drizzle/0015_*`;
- `be/src/modules/{pages,page-analysis,crawl}/**`;
- `packages/contracts/src/domain/seo/**`;
- `fe/src/Core/Helpers/DescribeIssue/**`.

It depends on no other change of the plan.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 2.
