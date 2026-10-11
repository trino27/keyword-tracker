# Tasks — desktop-core-web-vitals

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 4, as re-derived on
2026-10-11 against `adc8887` (plan D39–D49). Correct this file through the plan, not beside it.
A task that turns out wrong gets an `AMENDED during implementation:` line; one that was already
satisfied is closed as `VERIFIED, NOT BUILT`, naming what pins it. A test named "first" is run
and seen failing for the stated reason, then lands in the same commit as the code that turns it
green.

This change depends on no other change of the plan. It builds on the merged `lighthouse-checks`
(the catalogue registry, migration `0015`, the Lighthouse replace). `image-delivery-finding`
depends on it. Groups 1–5 are the plan's sub-phases 4a–4e, in that order, and each ends green and
runnable.

## 1. The catalogue knows two strategies (4a) — SPEED-007

- [x] 1.1 Write first in `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts`:
  - "splits the speed codes by strategy: six CWV codes each";
  - "each CWV code's max is its metric's threshold for its band, on both strategies" (the
    existing case at `:98-107`, looped over `PSI_STRATEGIES`);
  - "gives a desktop code its mobile twin's severity".

  They fail: there is no `PAGE_SPEED_CODES_BY_STRATEGY`, and `CWV_ISSUE_CODES` has no strategy
  level. Verify: `pnpm --filter @app/contracts test:ci` fails on those.
  Done: they failed on the missing `psi-strategy.enum` module. Two more cases joined them: the
  mobile-only severity case now reads `CWV_ISSUE_CODES.mobile`, and "names the device in every CWV
  label" pins D48.
- [x] 1.2 Contracts (`packages/contracts/src/domain/`):
  - `page-speed/psi-strategy.enum.ts` (new): `PSI_STRATEGIES = ['mobile', 'desktop'] as const`,
    its comment saying the order is the claim's order (plan §3.2, D44);
  - `seo/catalogue/issue-definition.interface.ts`: `IPageSpeedIssueDefinition extends
    ISeoIssueDefinition { strategy: TPsiStrategy }` (plan §5, D39);
  - `seo/catalogue/page-speed/page-speed-catalogue.constant.ts`: `strategy: 'mobile'` on the six
    entries and labels ending "on mobile"; six `CWV_*_DESKTOP` entries with `strategy:
    'desktop'`, the twin's severity and `max`, labels ending "on desktop", `plain` copy about
    computers, the twin's sources (plan D48);
  - `seo/catalogue/issue-catalogues.constant.ts`: `TPageSpeedIssueCodeOf<S>`,
    `PAGE_SPEED_CODES_BY_STRATEGY`, derived from the entries;
  - `page-speed/cwv-issue-codes.constant.ts`: keyed by strategy; `TCwvIssueCode`;
  - `seo/seo-issue.interface.ts`: `TPageSpeedSeoIssueOf<S>`, `TCwvSeoIssue`, `TIssueDetails`
    over `TCwvIssueCode`;
  - `src/index.ts`.

  Rename "gives the PageSpeed worker exactly the six Core Web Vitals codes" (`:83-92`) to "… the
  twelve Core Web Vitals codes, six per strategy" and list twelve. ANALYSIS-012's deposit
  (`PAGE_ANALYSIS_MODULE.md:582`) names the old title; phase 6 corrects it. Seen failing once and
  restored: a `strategy` on one crawl entry and a pageSpeed entry without one each fail
  `pnpm typecheck` (I19). Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
  Done. I19 seen failing both ways: a pageSpeed entry without `strategy` (TS2741 through the
  registry), and `strategy` on a crawl entry (TS2353, excess property). `TCwvIssueCode` lives
  beside `CWV_ISSUE_CODES`.
- [x] 1.3 Write first in `be/src/modules/page-speed/services/cwv-issues/cwv-issues-of.spec.ts`:
  "a desktop metric outside the good band yields its desktop code". It fails: there is no
  strategy parameter. Then `cwvIssuesOf<S>(strategy: S, measurement): TPageSpeedSeoIssueOf<S>[]`,
  with its caller (`page-speed-executor.service.ts:125`) passing `'mobile'`. Verify:
  `pnpm --filter be test:ci -- src/modules/page-speed`.
  Done: the spec failed with every code wrong; 122 page-speed specs green after.
- [x] 1.4 Write first in `fe/src/Core/Helpers/DescribeIssue/describeIssue.test.ts`: "says 'on
  desktop' for a desktop code", "says 'on mobile' for a mobile code". They fail: no desktop code,
  no device word. Then the six sentences and the `speed` helper's device word (`:30-38`). Re-read
  every reader of a CWV label: `git grep -n -E "Contentful Paint (is|needs)|Next Paint
  (is|needs)|Layout Shift (is|needs)" -- fe/src be/src be/test`. Verify: `pnpm --filter fe
  test:ci -- describeIssue PageSchemas issueTypeOf && pnpm --filter fe typecheck`.
  Done. The sentence reads "LCP on mobile is 3.1 s …". No label reader exists outside the
  catalogue. AMENDED during implementation: two more frontend tables are Records over every code
  and needed the six desktop codes: `fe/src/Core/Constants/checkTopics.ts` (topic `speed`) and
  the Info guide's `CheckCriteria` (`DESKTOP_CWV_CRITERIA` in `groups/speedAndSite.ts`, derived
  from the mobile entries with the desktop measurement and "choose Desktop"). One sentence test
  outside `describeIssue`, `IssuesByPage.test.tsx`, gained "on mobile".
- [x] 1.5 Commit: `feat(contracts): two PageSpeed strategies, and the six desktop Core Web Vitals
  codes`. Verify: `pnpm lint && pnpm typecheck && pnpm test && docker compose up -d --build &&
  curl -fsS http://localhost:8080/api/health`.
  Done: lint and typecheck clean; contracts 789, be 1318, fe 434 tests green.

## 2. One row per page and strategy, still measured on mobile only (4b) — SPEED-020, SPEED-002, SPEED-007, SPEED-014, PAGES-014

Until group 3 no desktop row is queued (plan D45, I30). Everything below is per strategy, and the
product behaves as before.

- [x] 2.1 Write first. Each refusal case asserts the constraint's NAME in the error, so it cannot
  pass on another error. The int-specs first fail to compile against the missing column, as
  `lighthouse-checks` task 4.1 recorded.
  - in `be/src/modules/pages/repositories/page-speed/page-speed.repository.int-spec.ts`:
    - "holds one row per page and strategy" (`page_speed_pk`);
    - "deleting a page deletes both rows";
    - "refuses a row without a strategy";
    - "refuses a desktop row with a Lighthouse list or a category score"
      (`page_speed_lighthouse_mobile_only`);
    - "enqueue with both strategies queues both rows of a new page";
    - "re-queues a strategy measured exactly 24 h ago and leaves the other";
    - "claims a desktop row with its strategy";
    - "a stale attempt on the desktop row writes nothing to the mobile row of the same page and
      attempt number";
    - "a claim of a client's desktop row serves the client";
    - "within one client, due mobile rows are claimed before its desktop rows";
    - every existing case rewritten with a strategy; the fair-claim cases (`:471`, `:485`,
      `:499`) assert what they assert today;
  - in `repositories/seo-issues/seo-issues.repository.int-spec.ts`: "a desktop replace leaves the
    page's mobile, Lighthouse and crawl findings", "a mobile replace leaves its desktop findings";
  - in `repositories/page-list/page-list.repository.int-spec.ts`: "lists a page once, with its
    mobile summary and score, when both strategies are stored";
  - in `be/src/modules/issue-report/repositories/issue-report/issue-report.repository.int-spec.ts`:
    "returns each finding once when both strategies are stored, with its own strategy's
    measured_at";
  - in `services/page-speed-results/page-speed-results.service.spec.ts`: "a desktop completion
    writes its speed findings and never calls the Lighthouse replace";
  - in `services/page-speed-queue/page-speed-queue.service.spec.ts`: "queues only the strategies
    PAGE_SPEED_QUEUED_STRATEGIES names";
  - in `be/src/modules/page-speed/services/page-speed-executor/page-speed-executor.service.spec.ts`:
    "a desktop claim completes the desktop arm with no Lighthouse record".

  The list and report cases, run after 2.2 and before 2.3, fail on two rows for one page.
  Verify: `pnpm --filter be test:db -- page-speed seo-issues page-list issue-report` and
  `pnpm --filter be test:ci -- src/modules/pages src/modules/page-speed` fail on those.
  Done. The int-specs first failed to compile against the old repository signatures. After the
  schema change and before the joins named a device, "lists a page once …" failed on two rows
  for one page (a mobile and a desktop summary), which is the defect D43 prevents.
- [x] 2.2 Edit `be/src/persistence/schema/tables/page-speed/page-speed.schema.ts` per plan §3.2:
  `psiStrategyEnum`, `strategy … .notNull().default('mobile')`, `primaryKey({ name:
  'page_speed_pk', columns: [t.pageId, t.strategy] })`, the CHECK
  `page_speed_lighthouse_mobile_only`, and the table comment naming the device. Run
  `pnpm db:generate` and READ the new file (`be/drizzle/0016_*.sql` while `0015_modern_wrecker`
  is the latest). It holds exactly `CREATE TYPE "public"."psi_strategy_enum"`, `ADD COLUMN
  "strategy" … DEFAULT 'mobile' NOT NULL`, the drop of `page_speed_pkey`, `ADD CONSTRAINT
  "page_speed_pk" PRIMARY KEY("page_id","strategy")` and `ADD CONSTRAINT
  "page_speed_lighthouse_mobile_only"`, nothing else. Then drop `.default('mobile')`, run
  `pnpm db:generate`, and READ the next file (`0017_*.sql`): exactly `ALTER COLUMN "strategy"
  DROP DEFAULT`. Then `pnpm db:migrate`. Never edit either file or `drizzle/meta/_journal.json`.
  VERIFY: drizzle-kit 0.31 generates the inline-to-named composite key without a prompt and drops
  the old key under its Postgres name `page_speed_pkey`; if it prompts or names it otherwise,
  answer for the honest change and record what it did here with `AMENDED during
  implementation:`. Verify: both files read as stated, and `pnpm db:migrate` exits 0.
  AMENDED during implementation (the user's decision, 2026-10-11): drizzle-kit 0.31 could not
  generate the key change. In one file it left `DROP CONSTRAINT "<constraint_name>"` commented
  out for the name to be pasted by hand, and put `ADD PRIMARY KEY` before `ADD COLUMN`, so the
  file could not run. The change was generated in three steps instead:
  - `0016_silly_earthquake.sql` adds the enum, the column with its default and the CHECK;
  - `0017_abnormal_thing.sql` swaps the key. Its one hand edit is uncommenting drizzle's own
    `DROP CONSTRAINT` line with the name it asked for, `page_speed_pkey`, read from the database;
  - `0018_true_arachne.sql` drops the default.

  All three were applied by the test database's migrator; the dev database gets them when the
  stack's migrate runs.
- [x] 2.3 Make the specs pass (plan §7, §10.14):
  - `be/src/shared/page-speed-queue/page-speed-queue.constant.ts`:
    `PAGE_SPEED_QUEUED_STRATEGIES = ['mobile']`;
  - `be/src/modules/pages/interfaces/page-speed.interface.ts`: `IClaimedPageSpeed.strategy`,
    `TPageSpeedCompletion`;
  - `page-speed.repository.ts`: `enqueueForWorker(tx, pageIds, strategies, staleBefore)` and
    `backfillCurrentForWorker(strategies)` with `on conflict (page_id, strategy)`; the claim's
    `due`/`next`/`update` per strategy, `served` unchanged, `d.strategy` in the ORDER BY after the
    two served-at keys; `ownedBy(pageId, strategy, attempt)`;
  - `seo-issues.repository.ts`: `replacePageSpeedFindingsForWorker(tx, pageId, strategy, rows)`
    deletes `PAGE_SPEED_CODES_BY_STRATEGY[strategy]`;
  - `page-speed-queue.service.ts` passes `PAGE_SPEED_QUEUED_STRATEGIES`;
  - `page-speed-results.service.ts`: `completeForWorker(claim, completion)`, the Lighthouse
    replace in the mobile arm only;
  - `page-speed-executor.service.ts`: the completion arm of `claim.strategy`, the desktop arm
    with five null Lighthouse fields and no Lighthouse findings;
  - `page-list.repository.ts:141` and `page-detail.repository.ts:142`: `and ps.strategy =
    'mobile'`;
  - `issue-report.repository.ts:124`: the strategy of `i.code`, with
    `PAGE_SPEED_CODES_BY_STRATEGY.desktop` as one array parameter;
  - every test insert into `page_speed` names a strategy (`page-list.repository.int-spec.ts:211`,
    `page-speed.repository.int-spec.ts`, `be/test/e2e/page-speed.e2e-spec.ts`).

  Verify: `pnpm --filter be test:db -- page-speed seo-issues page-list issue-report && pnpm
  --filter be test:ci -- src/modules/pages src/modules/page-speed src/modules/issue-report`.
  Done. `TNewPageSpeedIssue<S>` is widened at the insert only, since the generic `S` cannot
  reach drizzle's value type.
- [x] 2.4 Check that no join to `page_speed` is left without its strategy, and that the score
  still reads the mobile row. Verify: `git grep -n "join page_speed" be/src` (every line names
  `strategy`), and `pnpm --filter be test:db -- page-speed` keeps "a Lighthouse finding counts
  among the issues, in the spread and in the score" green.
  Done: page-list and page-detail name `ps.strategy = 'mobile'`; issue-report names it on the
  next line (the device of each code). The Lighthouse score case stays green.
- [x] 2.5 Edit `be/test/explain/pages-list.explain.sql:33-41`: the join gains `AND ps.strategy =
  'mobile'`, the comment names `page_speed_pk`. Verify: `docker compose up -d --build`, then
  `docker compose exec -T postgres psql -U tracker -d seo_tracker <
  be/test/explain/pages-list.explain.sql`, and read the plan: an index scan on `page_speed_pk`
  with both key columns, or a hash over the small table; not a sequential scan per listed page.
  Done: `Index Scan using page_speed_pk on page_speed ps`, `Index Cond: ((page_id = p.id) AND
  (strategy = 'mobile'))`, 15 loops for the 15-row slice.
- [x] 2.6 `be/src/seed/seed.ts:45` prints `pagespeed  N measurements queued`. The line itself is
  not pinned by a test (the seed-runner int-spec asserts the count, not the words). Verify:
  `pnpm --filter be typecheck && git grep -n "measurements queued" be/src/seed/seed.ts`.
  Done.
- [x] 2.7 Check the stack still queues mobile only. Verify: `docker compose exec postgres psql -U
  tracker -d seo_tracker -c "select strategy, status, count(*) from page_speed group by 1, 2"`
  shows only `mobile` rows (D13); re-crawl one seed client from the UI, and the same query still
  shows only `mobile` rows (D45).
  Done after the stack's migrate applied 0016–0018: 45 `mobile`/`done` rows and no other; run
  207 (semrush.com) re-crawled and the table still held only mobile rows.
- [x] 2.8 Commits, in order:
  - `feat(db): a page_speed row per page and strategy — queue, fence, replace and reads per
    strategy` (2.2–2.4 together: the key change breaks every `on conflict (page_id)` at runtime
    and the NOT NULL column breaks every insert at typecheck, so no smaller commit is green);
  - `test(explain): the pages list joins the mobile row by its key`;
  - `feat(seed): the backfill counts measurements, not pages`.

  Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
  Done: 684e8b2, 47acb13, 4933a7e, after a45f85b, which brought the e2e up to date with the
  retired accessibility audits. lint and typecheck clean; contracts 789, be 1324, fe 435,
  db/e2e 221 tests green.

## 3. Google is asked for desktop, and the crawl queues it (4c) — SPEED-001, SPEED-005, SEED-006

After this group desktop findings appear among the issues and in the report; the Speed block
switches in group 4.

- [x] 3.1 Record a desktop answer. `be/test/fixtures/record-pagespeed-fixtures.ts`: a target's
  `strategy?: 'desktop'`, recorded with `strategy=desktop&category=performance`. Record with
  `node be/test/fixtures/record-pagespeed-fixtures.ts url-field.desktop` so no pinned answer is
  re-recorded; the recorder refuses a file echoing the key. `page-speed-fixtures.spec.ts` pins the
  file's role (field data, no Lighthouse category). VERIFY: a key is in `.env`; the user
  confirms, and the session never prints `.env`. Verify: `git grep -n -E "key=|AIza" --
  be/test/fixtures/pagespeed` prints nothing, and `pnpm --filter be test:ci --
  page-speed-fixtures` passes.
  Done: 329fa17. yoast.com/ on desktop: its own field data, LCP 2530 ms and CLS 0.18 need
  improvement, INP 62 ms good; categories `performance` only. The key came from `.env` and was
  never printed.
- [x] 3.2 Write first:
  - `psi-client.spec.ts` → "a desktop request asks for strategy=desktop and category=performance
    only, the key only in the header" (SPEED-016's desktop scenario);
  - `page-speed-queue.service.spec.ts` → "queues every strategy", replacing 2.1's case.

  They fail: no strategy parameter, and the constant says mobile. Then
  `PsiClient.requestUrl(pageUrl, strategy)` and `runPagespeed(pageUrl, strategy, apiKey,
  signal)`; the executor passes `claim.strategy`; the queue service passes `PSI_STRATEGIES`;
  delete `PAGE_SPEED_QUEUED_STRATEGIES`. Verify: `pnpm --filter be test:ci --
  src/modules/page-speed src/modules/pages && git grep -n "PAGE_SPEED_QUEUED_STRATEGIES" -- be`
  (prints nothing).
  Done: the specs failed on the missing parameter and on the constant; the constant is gone.
- [x] 3.3 Write first in `be/test/e2e/page-speed.e2e-spec.ts`, with every
  `transport.override(PsiClient.requestUrl(…))` (`:69`, `:255`) naming its strategy and the
  desktop URL answered by `url-field.desktop.json`:
  - "a crawl queues both strategies of each page";
  - "a crawl queues both strategies; each measured row has its findings";
  - "a desktop measurement leaves the page's Lighthouse findings, its score and its place in the
    list".

  In `be/src/seed/seed-runner/seed-runner.int-spec.ts`, "the backfill queues each current page
  once, and a second run queues none" becomes "… once per strategy …" with its count doubled.
  They fail before 3.2 lands: no desktop row is queued. Verify: `pnpm --filter be test:db --
  page-speed seed-runner`.
  Done. AMENDED during implementation: the e2e helper answers both devices, the desktop one with
  `url-field.desktop.json` (an error fixture answers both alike). So the existing counts gained
  the desktop findings: the speed case +4 notices, the Lighthouse case +5. The badge case
  compares mobile codes only, because the list's badges are mobile. `issue-report.e2e-spec.ts`
  names its mobile URL. Its desktop rows fail as unanswered (404) and add no finding.
- [x] 3.4 `fe/src/Modules/Issues/IssuesScreen.tsx:141`: the `active` line reads "Speed figures are
  Google's mobile and desktop measurements; pages are re-measured at most once a day.", with its
  `IssuesScreen.test.tsx` case written first. If the Info guide (`fe/src/Modules/Info/`,
  `fe/src/ViewModels/InfoGuideViewModel/`) is committed by now, its "mobile strategy" sentences
  (`speedAndSite.ts:8`, `CoreWebVitalsGuide.tsx:246`, `UsingTracker.tsx:103`) name both devices
  too. VERIFY: those files were untracked at `adc8887`. Verify: `pnpm --filter fe test:ci --
  IssuesScreen`.
  Done. The three Info sentences name both devices; `speedAndSite.ts`'s CWV_SOURCE stays
  mobile because it describes the mobile codes, and the desktop codes have their own
  (65c7272).
- [x] 3.5 Check the worker and its neighbours are unchanged. Verify: `pnpm --filter be test:ci --
  classify-psi-response page-speed-rate-limiter page-speed-worker psi-client`.
  Done: in the full run below.
- [ ] 3.6 Check the stack queues both devices. Verify: `docker compose up -d --build`, re-crawl a
  seed client, then `docker compose exec postgres psql -U tracker -d seo_tracker -c "select
  strategy, status, count(*) from page_speed group by 1, 2"` shows `desktop` rows.
- [x] 3.7 Commits: `test(fixtures): a desktop PageSpeed answer, recorded` · `feat(page-speed): ask
  Google for desktop, and queue both devices`. Verify: `pnpm lint && pnpm typecheck && pnpm test
  && pnpm test:db`.
  Done: lint and typecheck clean; contracts 789, be 1327, fe 436, db/e2e 223 tests green.

## 4. The page shows both devices (4d) — PAGES-014, PAGEDETAIL-011

- [ ] 4.1 Write first:
  - `be/src/modules/pages/services/page-read/page-read.service.spec.ts` → "the detail carries a
    summary per strategy, null where never queued", "the score reads the mobile row whatever the
    desktop row holds";
  - `be/test/e2e/pages.e2e-spec.ts` → "the detail carries pageSpeedByStrategy";
  - `be/test/e2e/page-speed.e2e-spec.ts` → "every non-good desktop card has its desktop finding";
  - `fe/src/Gateways/PageGateway/Validation/PageSchemas.test.ts` → "parses a detail with a desktop
    summary and a null one".

  They fail: there is no field. Then, in ONE commit with group 4's frontend:
  `packages/contracts/src/domain/pages/page-detail.interface.ts` (`pageSpeedByStrategy` replaces
  `pageSpeed`); `repositories/page-speed/page-speed-read.ts` (`pageSpeedColumns(alias: 'ps' |
  'psd')`); `repositories/page-detail/page-detail.repository.ts` (the `psd` join,
  `ICurrentPageRecord.pageSpeedByStrategy`); `page-read.service.ts` (`scoreOf` reads `.mobile`);
  `PageSchemas.ts` (`pageSpeedByStrategy`, still `satisfies z.ZodType<IPageDetail>`). Verify:
  `pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be test:db -- pages page-speed
  && pnpm --filter fe test:ci -- PageSchemas`.
- [ ] 4.2 Write first `fe/src/Modules/PageDetail/SpeedSection/SpeedSection.test.tsx`:
  - "opens on Mobile";
  - "Desktop shows the desktop cards and its TTFB line";
  - "Desktop shows no SEO or accessibility caption";
  - "Desktop reads 'Not measured on desktop yet' for a page never queued on desktop";
  - "Mobile reads 'Measuring…' while Desktop reads 'In queue'";
  - "the key-rejected notice stands above both";
  - "switching makes no request".

  They fail: there is no switch. Then `SpeedSection.tsx` (a Mantine `SegmentedControl` in local
  `useState`, title "Speed (Core Web Vitals)", body over `pageSpeedByStrategy[strategy]`),
  `PageDetailViewModel.ts`, and `PageDetailScreen.tsx` (`:80` passes the record; `:121` and
  `:130` read `.mobile`, plan D49). Verify: `pnpm --filter fe test:ci -- SpeedSection PageDetail
  ChecksSection explainScore CwvBadges`.
- [ ] 4.3 On the stack: `docker compose up -d --build`, sign in with `curl -c c.txt`, then
  `curl -s -b c.txt http://localhost:8080/api/pages/<id> | grep -o
  '"pageSpeedByStrategy":{"mobile"'` prints the match. In a browser, open a page detail and switch
  devices; no console error. Verify: the walk is done and the result written here.
- [ ] 4.4 Commit: `feat(fe): the Speed block switches between mobile and desktop`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 5. Live: both devices drain and agree with Google (4e)

- [ ] 5.1 With a key, re-crawl a seed client. Verify: `docker compose exec postgres psql -U tracker
  -d seo_tracker -c "select strategy, status, count(*), count(measured_at) from page_speed group by
  1, 2"` shows `done` desktop rows, and `… -c "select count(*) from page_speed where strategy =
  'desktop' and (lighthouse_judged is not null or seo_score is not null)"` prints 0.
- [ ] 5.2 Compare one URL's stored desktop LCP, INP and CLS with pagespeed.web.dev's Desktop tab.
  Field values must match for the same CrUX window; lab values only close. Verify: the comparison
  is written here, naming each value's source.
- [ ] 5.3 Check that a desktop measurement left a page's Lighthouse findings alone, and the key did
  not leak. Verify: `select count(*) from seo_issues where page_id = <id> and code like 'LH\_%'`
  is the same before and after that page's desktop row turns `done`, and `docker compose logs be
  | grep -c AIza` prints 0.
- [ ] 5.4 Record in `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`: the strategy per row, the
  two-step migration, Lighthouse on mobile only, the claim order (turns, mobile first within a
  client), calls per crawl (two per page), and the drain time of the backlog with both
  strategies. Commit: `docs(page-speed): desktop measured live — calls, drain time and claim
  order`. Verify: `git grep -n "strategy" be/src/modules/page-speed/PAGE_SPEED_MODULE.md`.

## 6. Change acceptance

- [ ] 6.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 6.2 Archive and deposit belong to plan phase 6. Fold the MODIFIED blocks
  (SPEED-001/002/005/007/014, PAGES-014, SEED-006, PAGEDETAIL-011) by hand. Deposit SPEED-020
  into `PAGE_SPEED_MODULE.md`, and update the deposit lines of the modified ids whose pinning
  tests were renamed, ANALYSIS-012's (`PAGE_ANALYSIS_MODULE.md:580-582`) among them. Verify:
  `pnpm exec openspec validate --specs && git grep -n "invariant: SPEED-020" -- '*.md'`.
