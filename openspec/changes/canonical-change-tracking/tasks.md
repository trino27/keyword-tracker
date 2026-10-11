# Tasks — canonical-change-tracking

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 2. Correct this file through
the plan, not beside it. A task that turns out wrong gets an `AMENDED during implementation:`
line; one that was already satisfied is closed as `VERIFIED, NOT BUILT`. A test named "first" is
run and seen failing for the stated reason, then lands in the same commit as the code that turns
it green.

This change depends on no other change of the plan.

## 1. The canonical, stored with whether it was recorded (2a) — PAGES-015, ANALYSIS-010

- [ ] 1.1 Write first in `be/src/modules/pages/repositories/pages/pages.repository.int-spec.ts`:
  - "writes the declared canonical and marks it recorded";
  - "writes a page declaring none as recorded with no canonical";
  - "refuses a canonical url on a row that did not record it";
  - "a row written before the migration reads back as not recorded";
  - "a canonical longer than 2048 is stored as not recorded".

  They fail: no columns. Verify: `pnpm --filter be test:db -- pages.repository` fails on those.
- [ ] 1.2 Edit `be/src/persistence/schema/tables/pages/pages.schema.ts` exactly as plan §3.1:
  `canonicalUrl`, `canonicalRecorded`, and CHECK `pages_canonical_only_when_recorded`. Correct the
  comment at `:52-55`. Then run `pnpm db:generate` and READ `be/drizzle/0015_*.sql`: two
  `ADD COLUMN` and one `CHECK`, nothing else. Never edit it. Then `pnpm db:migrate`. Verify:
  `pnpm db:generate` prints the new file and `pnpm db:migrate` exits 0.
- [ ] 1.3 Make the int-spec pass:
  - `pages.repository.ts` `upsertManyForWorker` writes `canonical_url` and `canonical_recorded`
    (false over 2 048 characters, plan D27);
  - `findPreviousCrawlsForWorker` selects both;
  - `crawl-results.service.ts` adds `IRunPage.canonicalUrl` and shapes
    `IPreviousCrawl.canonical`;
  - `check.interface.ts` gets `IPreviousCrawl.canonical: { recorded: false } | { recorded: true;
    url: string | null }`;
  - `make-check-input.ts` and `crawl-run-executor.service.ts` `toRunPage` (the first of
    `declaredCanonicals`).

  Verify: `pnpm --filter be test:db -- pages crawl && pnpm --filter be test:ci -- src/modules/pages
  src/modules/crawl`.
- [ ] 1.4 The migration applies over the seeded volume. Verify: `docker compose up -d --build`,
  then `docker compose exec postgres psql -U tracker -d seo_tracker -c "select
  canonical_recorded, count(*) from pages group by 1"` shows only `f` before any new crawl.
- [ ] 1.5 Commit: `feat(db): a page remembers the canonical it declared, and whether that is
  known`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 2. `CANONICAL_CHANGED` (2b) — ANALYSIS-022

- [ ] 2.1 Write first `be/src/modules/page-analysis/services/checks/canonical-changed/canonical-changed.check.spec.ts`
  with plan §10.9's cases:
  - "is not applicable for a page crawled before canonicals were recorded";
  - "is not applicable for a first crawl";
  - "fails url → another url, quoting both and the day";
  - "fails none → url";
  - "fails url → none";
  - "passes a trailing-slash difference".

  They fail: no module. Verify: `pnpm --filter be test:ci -- canonical-changed` fails.
- [ ] 2.2 Add the check, registered in `checks.registry.ts`; the catalogue entry (notice, owner
  crawl, Ahrefs source — VERIFY the URL as cited — `plain`, `skipReason`); and the `DESCRIBE`
  sentence with its `describeIssue.test.ts` case. Verify: `pnpm --filter be test:ci --
  canonical-changed && pnpm --filter @app/contracts test:ci && pnpm --filter fe test:ci --
  describeIssue && pnpm typecheck`.
- [ ] 2.3 Write first in `be/test/e2e/crawl.e2e-spec.ts`: "a second crawl after the canonical
  changed stores CANONICAL_CHANGED, a third does not". Use `FixtureHttpTransport.override` between
  crawls. It fails before 2.2 lands, and passes after. Verify: `pnpm --filter be test:db -- crawl`.
- [ ] 2.4 Make sure `DATE_BUMPED_WITHOUT_CHANGES`, which reads the same `previous`, is unchanged.
  Verify: `pnpm --filter be test:ci -- date-bumped`.
- [ ] 2.5 Commit: `feat(page-analysis): a canonical that changed since the last crawl`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 3. The sitemap's canonical contradiction, pinned (2c) — ANALYSIS-023

- [ ] 3.1 The behaviour is already built: `sitemap-checks.ts:45-47` reads `CANONICAL_MISMATCH`,
  and the catalogue explanation already names it (plan D15). Add
  `site-checks.registry.spec.ts` → "names an entry whose page names another URL as canonical".
  It passes on its first run. Delete the branch at `sitemap-checks.ts:45-47` locally once, watch
  the test fail, then restore the branch. Close this task as `VERIFIED, NOT BUILT`, naming the
  test. Verify: `pnpm --filter be test:ci -- site-checks`.
- [ ] 3.2 Commit: `test(site-checks): the sitemap's canonical contradiction is pinned`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test`.

## 4. Field audit of `CANONICAL_CHANGED` (2d) — plan D12

- [ ] 4.1 Run the plan §14 field-audit protocol over two crawls of each audit site, the second at
  least a day after the first. Read every `CANONICAL_CHANGED` firing against both live states,
  using the evidence's quoted URLs and the page now. If it fires nowhere, the tally says "proven
  by the specs alone". Verify: the §14 query for the code prints every firing, and each is
  judged.
- [ ] 4.2 Write a wrong firing as a failing spec from that site, then the fix, or retire the code
  with `enabled: false`. Verify: `pnpm --filter be test:ci -- canonical-changed`.
- [ ] 4.3 Add the tally line under "Field audit of the Ahrefs-gap checks" in
  `PAGE_ANALYSIS_MODULE.md`. Commit: `docs(page-analysis): CANONICAL_CHANGED, audited over two
  crawls`. Verify: `git grep -n "CANONICAL_CHANGED" be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`.

## 5. Change acceptance

- [ ] 5.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 5.2 Archive and deposit belong to plan phase 6. Harvest `canonical_url`/`canonical_recorded`
  into `PAGES_MODULE.md` first. Then archive, fold the ANALYSIS-010 MODIFIED block by hand,
  rewrite the headings, and deposit PAGES-015 into `PAGES_MODULE.md` and ANALYSIS-022/023 into
  `PAGE_ANALYSIS_MODULE.md`. Verify: `pnpm exec openspec validate --specs && git grep -n -E
  "invariant: (PAGES-015|ANALYSIS-02[23])" -- '*.md'`.
