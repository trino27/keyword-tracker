# Every crawled page is measured on mobile and on desktop

## Why

The tracker measures mobile only. That was a choice of the previous plan (its D2), made to halve
the calls. Ahrefs reports desktop Core Web Vitals as well, and the interview reversed the choice
for this work (plan D9): two independent measurements per page, with quota use doubled, which
was accepted.

The row stays one answer to one question. `page_speed`'s key becomes `(page_id, strategy)`.
Desktop findings get six codes of their own, because `seo_issues` holds one row per page and
code. Putting desktop columns in the same row was rejected: it would break the "measurement whole
or absent" CHECK and the shared attempt counter.

Since the plan was first written, `lighthouse-checks` was merged into the branch. It added
Lighthouse's verdicts, field TTFB, visit shares and the LCP breakdown to `page_speed`
(migration `0015`), made Lighthouse part of the score, and decided that Lighthouse speaks for
mobile only (its design D16). The fair claim (`1e1fe1d`) took the id SPEED-014. This change is
re-derived on that tree (plan D39–D49).

## What Changes

- `@app/contracts`:
  - `PSI_STRATEGIES` (new);
  - `IPageSpeedIssueDefinition` declares a required `strategy` (plan D39). Crawl and Lighthouse
    definitions have none, so a strategy on their entries does not compile;
  - the six CWV entries get `strategy: 'mobile'`, and their labels end "on mobile" (plan D48);
  - six `CWV_*_DESKTOP` entries in the page-speed catalogue, with the mobile severities and
    bounds and labels ending "on desktop";
  - `PAGE_SPEED_CODES_BY_STRATEGY`, `TPageSpeedIssueCodeOf<S>`, `CWV_ISSUE_CODES` per strategy,
    `TCwvIssueCode`, `TCwvSeoIssue`;
  - `IPageDetail.pageSpeed` becomes `pageSpeedByStrategy` (plan D21).
- Database:
  - `psi_strategy_enum`;
  - `page_speed.strategy` NOT NULL, primary key `(page_id, strategy)`;
  - the CHECK `page_speed_lighthouse_mobile_only`: a desktop row holds no Lighthouse list and
    no category score (plan D42);
  - the first of two generated migrations fills existing rows with `mobile`, and the second
    drops the default (plan D22). They are `0016` and `0017` as the tree stands, after
    `lighthouse-checks`' `0015` (plan D41).

  Both are generated. There is no queue backfill (D13).
- `be/src/modules/pages`:
  - enqueue, claim, fence, complete and replace per strategy;
  - the claim keeps SPEED-014's turns across users and clients; within a client, mobile goes
    first (plan D44);
  - a desktop completion carries no Lighthouse record and never replaces Lighthouse's findings
    (plan D42);
  - the list, the score and the detail's Lighthouse lists join the mobile row; the detail also
    reads the desktop row (plan D43);
  - the seed backfills per strategy (plan D20).
- `be/src/modules/issue-report`: the speed join names the strategy of each code. REPORT-003
  holds per strategy as written.
- `be/src/modules/page-speed`: the PSI request carries the claimed strategy. Desktop asks for
  `category=performance` only, which makes `lighthouse-checks`' SPEED-016 desktop scenario true.
- `fe`:
  - the Speed block gets a Mobile | Desktop switch;
  - six `DESCRIBE` sentences with the device word;
  - the Issues screen's PageSpeed line names both devices.
- Fixtures: one desktop answer, recorded live.

Until sub-phase 4c no desktop row is queued (plan D45). The storage, the fence and the reads
are per strategy first, and Google is asked for desktop only once all of them are.

## Capabilities

- `be/src/modules/page-speed`:
  - SPEED-020 (new). SPEED-014 is the fair claim; this change's earlier draft allocated it, and
    it is not reused (plan D40);
  - SPEED-001, SPEED-002, SPEED-005, SPEED-007, SPEED-014 (modified).
- `be/src/modules/pages` — PAGES-014 (modified).
- `be/src/seed` — SEED-006 (modified).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-011 (modified).

The MODIFIED blocks restate each requirement whole. At archive they replace the requirement of
the same id in `specs/` by hand. `lighthouse-checks` modifies none of these ids, so the two
changes fold in either order. VERIFY: `pnpm exec openspec validate desktop-core-web-vitals`
accepts the MODIFIED blocks against the `[ID]`-form base.

## Impact

Paths affected:

- `packages/contracts/src/domain/{page-speed,seo/catalogue,seo,pages}/**`;
- `be/src/persistence/schema/tables/page-speed/**` and the generated `be/drizzle/0016_*`,
  `0017_*`;
- `be/src/shared/page-speed-queue/page-speed-queue.constant.ts`;
- `be/src/modules/{pages,page-speed,issue-report}/**`;
- `be/src/seed/**`;
- `be/test/{e2e,fixtures,explain}/**`;
- `fe/src/{Gateways,ViewModels,Modules,Core}/**`;
- `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`.

PSI quota use per crawl doubles.

It depends on no other change of the plan. It builds on the merged `lighthouse-checks`.
`image-delivery-finding` depends on it.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 4.
