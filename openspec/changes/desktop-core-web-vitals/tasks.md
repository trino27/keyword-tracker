# Tasks — desktop-core-web-vitals

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 4. Correct this file through
the plan, not beside it. A task that turns out wrong gets an `AMENDED during implementation:`
line; one that was already satisfied is closed as `VERIFIED, NOT BUILT`. A test named "first" is
run and seen failing for the stated reason, then lands in the same commit as the code that turns
it green.

This change depends on no other change of the plan. `image-delivery-finding` depends on it.

## 1. The catalogue knows two strategies (4a) — SPEED-007

- [ ] 1.1 Write first in `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts`:
  - "splits the speed codes by strategy: six CWV codes each";
  - "each desktop CWV code's max is its metric's threshold for its band";
  - "gives a desktop code its mobile twin's severity".

  They fail: no `PAGE_SPEED_CODES_BY_STRATEGY`. Verify: `pnpm --filter @app/contracts test:ci`
  fails on those.
- [ ] 1.2 Contracts:
  - `page-speed/psi-strategy.enum.ts` (new);
  - `ISeoIssueDefinition` as a union: `owner: 'crawl'` with `strategy?: never`, `owner:
    'pageSpeed'` with a required `strategy: TPsiStrategy` (plan §5, I19);
  - `strategy: 'mobile'` on the six CWV entries, and six `CWV_*_DESKTOP` entries (plain copy
    saying "on computers", sources as their mobile twins);
  - `PAGE_SPEED_CODES_BY_STRATEGY` and `TCwvIssueCode`;
  - `cwv-issue-codes.constant.ts` keyed by strategy;
  - `src/index.ts`.

  The existing "gives the PageSpeed worker exactly the six Core Web Vitals codes" now lists twelve
  and is renamed to say so. Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
- [ ] 1.3 Write first in `be/src/modules/page-speed/services/cwv-issues/cwv-issues-of.spec.ts`:
  "a desktop metric outside the good band yields its desktop code". It fails: no strategy
  parameter. Then `cwvIssuesOf(strategy, measurement)`, with today's caller passing `'mobile'`.
  Verify: `pnpm --filter be test:ci -- src/modules/page-speed`.
- [ ] 1.4 Write first in `fe/src/Core/Helpers/DescribeIssue/describeIssue.test.ts`: "says 'on
  desktop' for a desktop code". Then the six sentences and the `PageSchemas.ts` speed variants
  over every CWV code. Verify: `pnpm --filter fe test:ci -- describeIssue PageSchemas issueTypeOf
  && pnpm --filter fe typecheck`.
- [ ] 1.5 Commit: `feat(contracts): two PageSpeed strategies, and the six desktop Core Web Vitals
  codes`. Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## 2. One row per page and strategy (4b) — SPEED-014, SPEED-001, SPEED-002, SEED-006, PAGES-014

- [ ] 2.1 Write first:
  - in `be/src/modules/pages/repositories/page-speed/page-speed.repository.int-spec.ts`:
    - "holds one row per page and strategy";
    - "deleting a page deletes both rows";
    - "refuses a row without a strategy";
    - "enqueue queues both strategies of a new page";
    - "re-queues a strategy measured exactly 24 h ago and leaves the other";
    - "claims a desktop row with its strategy";
    - the existing fence, SKIP LOCKED and current-run cases with a strategy;
  - in `seo-issues.repository.int-spec.ts`: "a desktop replace leaves the page's mobile and crawl
    findings", "a mobile replace leaves its desktop findings";
  - in `page-list.repository.int-spec.ts`: "lists a page once when both strategies are stored";
  - in `issue-report.repository.int-spec.ts`: "returns each finding once when both strategies are
    stored";
  - in `be/src/seed/seed-runner/seed-runner.int-spec.ts`: "queues each current page once per
    strategy, and a second run queues none".

  They fail: no column. Verify: `pnpm --filter be test:db -- page-speed seo-issues page-list
  issue-report seed-runner` fails on those.
- [ ] 2.2 Edit `be/src/persistence/schema/tables/page-speed/page-speed.schema.ts` per plan §3.2,
  with `.default('mobile')` on `strategy` and the comment naming the strategy. Run
  `pnpm db:generate` and READ the new file (`be/drizzle/0015_*.sql` while `0014` is the latest):
  `CREATE TYPE psi_strategy_enum`, `ADD COLUMN "strategy" … NOT NULL DEFAULT 'mobile'`, the
  primary-key swap, nothing else. Then drop `.default('mobile')`, run `pnpm db:generate`, and
  READ the next file (`0016_*.sql`): `ALTER COLUMN "strategy"
  DROP DEFAULT` only. Then `pnpm db:migrate`. Never edit either file. VERIFY: drizzle-kit
  generates the composite key without a prompt; if it prompts, answer for the honest change and
  record it here with `AMENDED during implementation:`. Verify: both files read as stated, and
  `pnpm db:migrate` exits 0.
- [ ] 2.3 Make the int-specs pass:
  - `page-speed.repository.ts`: every method carries `strategy`, `enqueueForWorker` upserts both
    on `(page_id, strategy)`, and the backfill works per strategy;
  - `seo-issues.repository.ts`: `replacePageSpeedFindingsForWorker(tx, pageId, strategy, rows)`
    deletes `PAGE_SPEED_CODES_BY_STRATEGY[strategy]`;
  - `page-speed-queue.service.ts` and `page-speed-results.service.ts`;
  - `page-list.repository.ts:123` (`and ps.strategy = 'mobile'`);
  - `page-detail.repository.ts:114` and `page-speed-read.ts` (both rows);
  - `issue-report.repository.ts:124` (the strategy of `i.code`);
  - `seed-runner.service.ts` and `seed.ts` (`pagespeed  N measurements queued`).

  Verify: `pnpm --filter be test:db -- page-speed seo-issues page-list issue-report seed-runner`.
- [ ] 2.4 Check that no join to `page_speed` is left without its strategy. Verify: `git grep -n
  "join page_speed" be/src`; every line names `strategy`.
- [ ] 2.5 Check on the seeded stack. Verify: `docker compose up -d --build`, then `docker compose
  exec postgres psql -U tracker -d seo_tracker -c "select strategy, status, count(*) from
  page_speed group by 1, 2"` shows only `mobile` rows (D13). Then `docker compose exec -T postgres
  psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql`, and read the plan: the
  `page_speed` access is a PK probe or a hash with `strategy` in the condition.
- [ ] 2.6 Commits:
  - `feat(db): a page_speed row per page and strategy`
  - `feat(pages): enqueue, claim and replace per strategy; reads name the strategy they want`
  - `feat(seed): queue each current page once per strategy`

  Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 3. Google is asked for desktop (4c) — SPEED-005, SPEED-007

- [ ] 3.1 Record a desktop answer. `be/test/fixtures/record-pagespeed-fixtures.ts` takes a strategy
  argument. Record `be/test/fixtures/pagespeed/url-field.desktop.json` with the local key; the
  recorder refuses a file echoing it. VERIFY: a key is in `.env`; the user confirms, and the
  session never reads `.env` aloud. Verify: `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed`
  prints nothing.
- [ ] 3.2 Write first:
  - `psi-client.spec.ts` → "asks for desktop with strategy=desktop, in the fixed parameter
    order";
  - `page-speed-executor.service.spec.ts` → "completes the claimed strategy and replaces only its
    findings".

  They fail: no parameter. Then `PsiClient.requestUrl(pageUrl, strategy)` and the executor and
  results service carrying `strategy`. Verify: `pnpm --filter be test:ci -- src/modules/page-speed`.
- [ ] 3.3 Write first in `be/test/e2e/page-speed.e2e-spec.ts`:
  - "a crawl queues both strategies; each measured row has its findings";
  - "every non-good badge of each strategy has its finding, and no good one does".

  They fail before 3.2 lands. Verify: `pnpm --filter be test:db -- page-speed`.
- [ ] 3.4 Check the worker and its neighbours. Verify: `pnpm --filter be test:ci --
  classify-psi-response page-speed-rate-limiter page-speed-worker`. VERIFY: the worker's API is
  unchanged.
- [ ] 3.5 Commits: `test(fixtures): a desktop PageSpeed answer, recorded` · `feat(page-speed):
  measure each strategy as its own row`. Verify: `pnpm lint && pnpm typecheck && pnpm test &&
  pnpm test:db`.

## 4. The page shows both devices (4d) — PAGES-014, PAGEDETAIL-011

- [ ] 4.1 Write first:
  - `page-read.service.spec.ts` → "the detail carries a summary per strategy, null where never
    queued";
  - `be/test/e2e/pages.e2e-spec.ts` → "the detail carries pageSpeedByStrategy".

  They fail: no field. Then `page-detail.interface.ts` (`pageSpeedByStrategy` replaces
  `pageSpeed`) and `page-read.service.ts`. In the SAME commit, `PageSchemas.ts`
  (`pageSpeedByStrategy`, `satisfies z.ZodType<…>`). Verify: `pnpm --filter be test:ci --
  src/modules/pages && pnpm --filter be test:db -- pages && pnpm --filter fe test:ci --
  PageSchemas`.
- [ ] 4.2 Write first `fe/src/Modules/PageDetail/SpeedSection/SpeedSection.test.tsx`:
  - "opens on Mobile";
  - "Desktop shows the desktop cards";
  - "Desktop reads 'Not measured' for a page never queued on desktop";
  - "the key-rejected notice stands above both".

  It fails: no switch. Then `SpeedSection.tsx` (a `SegmentedControl` in local `useState`, title
  "Speed (Core Web Vitals)"), `PageDetailViewModel.ts` and `PageDetailScreen.tsx`. Verify:
  `pnpm --filter fe test:ci -- SpeedSection PageDetail`.
- [ ] 4.3 `fe/src/Modules/Issues/IssuesScreen.tsx:136`: the `active` sentence names mobile and
  desktop, with its `IssuesScreen.test.tsx` case updated. Verify: `pnpm --filter fe test:ci --
  IssuesScreen`.
- [ ] 4.4 In a browser: `docker compose up -d --build`, open a page detail, switch devices; no
  console error. Verify: the walk is done and the result written here.
- [ ] 4.5 Commit: `feat(fe): the Speed block switches between mobile and desktop`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 5. Live: both devices drain and agree with Google (4e)

- [ ] 5.1 With a key, re-crawl a seed client. Verify: `docker compose exec postgres psql -U tracker
  -d seo_tracker -c "select strategy, status, count(*), count(measured_at) from page_speed group by
  1, 2"` shows `done` desktop rows.
- [ ] 5.2 Compare one URL's stored desktop LCP, INP and CLS with pagespeed.web.dev's Desktop tab.
  Field values must match for the same CrUX window; lab values only close. Verify: the comparison
  is written here, naming each value's source.
- [ ] 5.3 Check that the key did not leak into the logs. Verify: `docker compose logs be | grep -c
  AIza` prints 0.
- [ ] 5.4 Record in `PAGE_SPEED_MODULE.md`: calls per crawl (two per page), the drain time of the
  backlog with both strategies, the strategy per row, and the two-step migration. Commit:
  `docs(page-speed): desktop measured live — calls and drain time`. Verify: `git grep -n
  "strategy" be/src/modules/page-speed/PAGE_SPEED_MODULE.md`.

## 6. Change acceptance

- [ ] 6.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 6.2 Archive and deposit belong to plan phase 6. Fold the MODIFIED blocks (SPEED-001/002/005/007,
  PAGES-014, SEED-006, PAGEDETAIL-011) by hand. Deposit SPEED-014 into `PAGE_SPEED_MODULE.md`,
  and update the deposit lines of the modified ids where their pinning tests were renamed.
  Verify: `pnpm exec openspec validate --specs && git grep -n "invariant: SPEED-014" -- '*.md'`.
