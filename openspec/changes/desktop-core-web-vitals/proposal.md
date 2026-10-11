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

## What Changes

- `@app/contracts`:
  - `PSI_STRATEGIES` (new);
  - `ISeoIssueDefinition` becomes a union, so every pageSpeed code declares `strategy` and no
    crawl code can;
  - the six CWV codes get `strategy: 'mobile'`;
  - six `CWV_*_DESKTOP` codes with the mobile severities;
  - `CWV_ISSUE_CODES` per strategy and `PAGE_SPEED_CODES_BY_STRATEGY`;
  - `IPageDetail.pageSpeed` becomes `pageSpeedByStrategy` (plan D21).
- Database:
  - `psi_strategy_enum`;
  - `page_speed.strategy` NOT NULL, primary key `(page_id, strategy)`;
  - migration `0016` fills existing rows with `mobile`, and `0017` drops the default (plan D22).
  Both are generated. There is no queue backfill (D13).
- `be/src/modules/pages`:
  - enqueue, claim, complete and replace per strategy;
  - the list joins mobile only, the detail reads both, the seed backfills per strategy (plan
    D20).
- `be/src/modules/issue-report`: the speed join names the strategy of each code.
- `be/src/modules/page-speed`: the PSI request carries the claimed strategy, and findings are
  written per strategy.
- `fe`:
  - the Speed block gets a Mobile | Desktop switch;
  - six `DESCRIBE` sentences and the schema variants;
  - the report's PageSpeed line names both devices.
- Fixtures: one desktop answer, recorded live.

## Capabilities

- `be/src/modules/page-speed`:
  - SPEED-014 (new);
  - SPEED-001, SPEED-002, SPEED-005, SPEED-007 (modified).
- `be/src/modules/pages` — PAGES-014 (modified).
- `be/src/seed` — SEED-006 (modified).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-011 (modified).

The MODIFIED blocks restate each requirement whole. At archive they replace the requirement of
the same id in `specs/` by hand. VERIFY: `pnpm exec openspec validate desktop-core-web-vitals`
accepts them against the `[ID]`-form base.

## Impact

Paths affected:

- `packages/contracts/src/domain/{page-speed,seo,pages}/**`;
- `be/src/persistence/schema/tables/page-speed/**` and `be/drizzle/0016_*`, `0017_*`;
- `be/src/modules/{pages,page-speed,issue-report}/**`;
- `be/src/seed/**`;
- `be/test/{e2e,fixtures}/**`;
- `fe/src/{Gateways,ViewModels,Modules,Core}/**`;
- `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`.

PSI quota use per crawl doubles.

It depends on no other change of the plan. `image-delivery-finding` depends on it.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 4.
