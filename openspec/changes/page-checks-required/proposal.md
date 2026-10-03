# Every page records its checks, so the columns stop being optional

## Why

`page-check-status-sections` added `checks_judged` and `checks_not_applicable` to `pages` as
nullable columns, because the alternative was to reconstruct them in the migration — the one
option that manufactures a fact that was never observed. Of the five conditional checks, a stored
row can honestly answer only two: TITLE_LENGTH is skipped exactly when `title is null`,
META_DESCRIPTION_LENGTH when `meta_description is null`. CANONICAL_MISMATCH, IMAGES_MISSING_ALT
and HEADING_SKIP are unknowable from the row, which holds no canonical, no images and no headings.

So null means "this crawl predates the recording", and it stops being a possible state the moment
every client has been re-crawled. Keeping it after that costs a branch in the repository, a `|
null` on the wire, a `.nullable()` in the gateway and a dead branch in the component — four places
describing a row that cannot exist.

## What Changes

- `be/src/persistence/schema/tables/pages/pages.schema.ts`: both columns become `.notNull()`, and
  the four CHECK constraints lose their `is null or` arms.
- A generated migration applies the NOT NULL and replaces the loosened constraints.
- `ICurrentPageRecord`, `composePageChecks`, `IPageDetail.checks`, `pageDetailSchema` and
  `ChecksSection` all lose the null case. Removing `| null` from the contract is what forces the
  component's branch to be deleted rather than left dead — typecheck does the finding.
- The "Re-crawl this page to see each check." copy is deleted, and the tests that covered that
  state go with it. `page-list.repository.int-spec.ts` fixtures gain arrays, because an insert
  without them now fails with `23502`.

No capability's state changes: PAGES-012 already requires that a page whose crawl predates the
recording says so, and this change only makes that branch unreachable. Hence `skip_specs: true`.

## Impact

`be/src/persistence/schema/tables/pages/pages.schema.ts`, `be/drizzle/0010_*`,
`be/src/modules/pages/repositories/{page-detail,page-list}/**`,
`be/src/modules/pages/services/{page-checks,page-read}/**`,
`packages/contracts/src/domain/pages/page-detail.interface.ts`,
`fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`,
`fe/src/Modules/PageDetail/ChecksSection/**`.

Plan: `docs/_plans/page-check-status-sections.md`, phase 2. **Blocked** until the plan's O1 query
returns zero.
