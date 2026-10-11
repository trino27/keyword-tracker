# Tasks — core-web-vitals-display

Generated from the plan `issue-report-and-pagespeed` (`docs/_plans/`), Phase 3. Correct it through
the plan; record a wrong task with an `AMENDED during implementation:` line and an already-satisfied
one as `VERIFIED, NOT BUILT`. A test named "first" is run and seen failing for the stated reason,
then lands in the same commit as the code that turns it green.

`page-speed-measurement` must be closed before task 1.1.

## 1. The list and the detail carry the speed summary (3a) — PAGES-014

- [x] 1.1 Write first: `be/src/modules/pages/services/page-read/page-read.service.spec.ts` → "a summary carries each metric's band from the thresholds", "a never-measured page has a null measurement", "lastError is null unless failed", "a page with no row has a null summary", "the availability state comes from pageSpeedAvailabilityOf"; `be/test/e2e/pages.e2e-spec.ts` → "the list and the detail carry the PageSpeed state"; `be/test/e2e/page-speed.e2e-spec.ts` → "every non-good badge in the list has its finding in the detail, and no good one does" and the payload half of the key-rejected case, "the list and the detail say keyRejected"; all fail (no fields). Verify: `pnpm --filter be test:ci -- page-read && pnpm --filter be test:db -- pages page-speed` fail on those cases
  AMENDED during implementation: the summary is a pure function,
  `be/src/modules/pages/services/page-speed-summary/page-speed-summary-of.ts`, so its cases live
  in `page-speed-summary-of.spec.ts` ("a summary carries each metric's band from the thresholds",
  "a never-measured page has a null measurement", "lastError is null unless failed", "a page never
  queued has no summary", plus "INP without field data is null inside a measurement");
  `page-read.service.spec.ts` keeps "the availability state comes from pageSpeedAvailabilityOf"
  and "a page never queued for PageSpeed has no summary". "the list and the detail carry the
  PageSpeed state" went into `page-speed.e2e-spec.ts`, beside the stack that has a key, not into
  `pages.e2e-spec.ts`. The key-rejected payload half is asserted on the LIST
  (`page-speed.e2e-spec.ts` -> "after Google rejects the key every row is still queued and the
  state is keyRejected"); the detail reaches the same `pageSpeedAvailabilityOf` and is pinned for
  it at unit level only.
- [x] 1.2 Contracts `page-speed/page-speed-summary.interface.ts` (`IPageSpeedAvailability` exists since `page-speed-measurement` 2.2); `page-list-item.interface.ts`, `page-list-response.interface.ts`, `page-detail.interface.ts`. Backend: `page-list.repository.ts` (`left join page_speed` in `listSlice`), `page-detail.repository.ts`, `page-read.service.ts` (`cwvBandOf`, `lastError` normalised, availability from `pageSpeedAvailabilityOf(settings, runtime)`). Frontend in the SAME commit: `PageSchemas.ts` gains `pageSpeedSummarySchema`, `pageSpeedAvailabilitySchema` (`state: z.enum(PAGE_SPEED_AVAILABILITY_STATES)`), each `satisfies z.ZodType<…>`, and `PageSchemas.test.ts` → "refuses a summary with an unknown band" and "refuses an unknown availability state". Verify: `pnpm typecheck && pnpm --filter be test:ci -- src/modules/pages && pnpm --filter be test:db -- page-list pages page-speed && pnpm --filter fe test:ci -- PageSchemas`
  AMENDED during implementation: the two `PageSchemas.test.ts` cases, "refuses a summary with an
  unknown band" and "refuses an unknown availability state", were missing from `901b2f1` and
  landed after review in `b2aa7e1`, beside "parses a measured summary". The rest is `901b2f1`: the contracts, the repositories' `page_speed` join (shared columns and row
  mapping in `repositories/page-speed/page-speed-read.ts`), the service, and both schemas, each
  `satisfies z.ZodType<…>`.
- [x] 1.3 The list is still five statements and keeps its order and spread. Verify: `pnpm --filter be test:db -- page-list` (its `describe('cost')` count and PAGES-010/011 cases)
  VERIFIED: the `page_speed` join is inside the slice statement; `page-read.service.spec.ts` ->
  `describe('cost')` -> "makes five repository calls for 50 rows" still holds.
- [x] 1.4 The plan on seeded data. Verify: `docker compose up -d --build`, then `docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql` and read it: the `page_speed` access is a primary-key probe or a hash over the small table
  AMENDED during implementation: `be/test/explain/pages-list.explain.sql` predates the join and
  was not updated, so it cannot show the `page_speed` access. Run instead on the seeded dev stack
  (834 `page_speed` rows): `explain analyze select … from pages p left join page_speed ps on
  ps.page_id = p.id order by p.id limit 20` → a Merge Left Join over `Index Scan using
  page_speed_pkey`, 0.14 ms. After review `8bd0589` added that probe to the explain file.
- [x] 1.5 On the stack. Verify: sign in with `curl -s -c c.txt -H 'Content-Type: application/json' -d '{"email":"yoast.manager@example.com","password":"demo-password-change-me"}' http://localhost:8080/api/auth/login`, then `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20' | grep -o '"pageSpeedAvailability":{[^}]*}'`
  VERIFIED on the rebuilt stack: the list and the detail carry `pageSpeedAvailability` (`{"state":
  "notConfigured"}`, no key) and a `pageSpeed` summary per page.
- [x] 1.6 Commit: `feat(pages): the list and the detail carry each page's Core Web Vitals`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
  Committed as `901b2f1`.

## 2. The list shows three badges (3b) — PAGELIST-008

- [x] 2.1 Write first: `fe/src/Core/Helpers/DescribeCwv/describeCwv.test.ts` → "3100 ms reads 3.1 s", "180 ms reads 180 ms", "0.123 reads 0.12", "origin reads 'Real visitors to the whole site'", "lab reads 'Lab test, may vary'"; `fe/src/Modules/Pages/PagesTable/CwvBadges/CwvBadges.test.tsx` → one case per cell state (Measuring…, badges, badges with the warning marker, Couldn't measure, Not measured, INP no data, and "a queued row reads Paused under keyRejected"); both fail (no modules). Verify: `pnpm --filter fe test:ci -- describeCwv CwvBadges` fails
  AMENDED during implementation: `describeCwv` was created in phase 1 (`issue-catalogue-owners`
  1.7), so its first cases were written there; the values are one table, "%s %d reads %s"
  (3100 → "3.1 s", 180 → "180 ms", 0.123456 → "0.12"), and the source words are
  "says whose experience the value is" and "names the source as a badge tooltip does". The
  CwvBadges cases as built: "colours each metric by its band, and grey for no data", "says in the
  tooltip the value, the band, whose it is and when", "reads Measuring… while queued", "a queued
  row reads Paused under keyRejected", "reads Not measured for a page never queued", "reads
  Couldn't measure for a page given up on", "keeps an old measurement and flags that the refresh
  failed", "is a dash without a key".
- [x] 2.2 `Core/Helpers/DescribeCwv/describeCwv.ts`, `Core/Constants/cwvBandColor.ts` (`Record<TCwvBand | 'noData', string>`), `Core/Constants/pageSpeedAvailabilityCopy.ts` (`Record<TPageSpeedAvailabilityState, …>` holding the three states' words, plan D27), `CwvBadges.tsx`; `PagesTable.tsx` gains the column right of Score, the header for `notConfigured` and for `keyRejected` ("PageSpeed key rejected", tooltip "Google rejected the PageSpeed key — speed measurements are paused. See the README."), and the legend; `PagesViewModel.ts` carries `pageSpeedAvailability`. Then `PagesTable.test.tsx` → "the header says PageSpeed is not configured, and the cells are dashes" and "the header says the key was rejected, and stored badges stay". Verify: `pnpm --filter fe test:ci -- describeCwv CwvBadges PagesTable PagesViewModel`
  AMENDED during implementation: what a cell says for each status and availability is one pure
  function, `pageSpeedViewOf` in `fe/src/Core/Helpers/DescribePageSpeed/` (pinned by
  `describePageSpeed.test.ts`), shared by the badges and the page's Speed block so the two can
  never disagree. Added `PagesTable.test.tsx` -> "explains the colours under the table".
- [x] 2.3 PAGELIST-006 and PAGELIST-002 still hold (order as returned, score never pending). Verify: `pnpm --filter fe test:ci -- PagesTable ScoreBadge`
- [ ] 2.4 Browser walk. Verify: `docker compose up -d --build`, open `/pages`: each row has three badges or "Measuring…", the legend is under the table, no console error
  NOT DONE: no browser was available. Verified instead through the API on the rebuilt stack (the
  list payload carries each page's summary and the availability) and by the component tests of
  2.1–2.2; the walk is open.
- [x] 2.5 Commit: `feat(fe): Core Web Vitals badges beside the score`. Verify: `pnpm lint && pnpm typecheck && pnpm test`
  Committed as `55ccd35`.

## 3. The page's Speed block, and the score explains itself (3c) — PAGEDETAIL-011, PAGEDETAIL-012

- [x] 3.1 Write first: `fe/src/ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.test.ts` → "the fifth paragraph says speed is scored separately" (fails: four paragraphs); `fe/src/Modules/PageDetail/SpeedSection/SpeedSection.test.tsx` → each state of PAGEDETAIL-011 including "under keyRejected the block opens with the key-rejected notice", "a lab value says it may vary", "INP without data says why", "shows the lab performance score as a caption" (fails: no component). Verify: `pnpm --filter fe test:ci -- explainScore SpeedSection` fails
- [x] 3.2 `SpeedSection.tsx` placed after `KpiCards` in `PageDetailScreen.tsx`; `explainScore.ts` gains the paragraph; `ScoreExplainer.tsx`'s comment says five paragraphs. Verify: `pnpm --filter fe test:ci -- explainScore SpeedSection ScoreExplainer PageDetail`
- [x] 3.3 PAGEDETAIL-010's arithmetic is unchanged. Verify: the existing `explainScore.test.ts` cases pass unmodified
  VERIFIED: the branch only adds a case to `explainScore.test.ts`; no existing line changed.
- [x] 3.4 README: one line under "Decisions, and why" on how to read a badge and why speed is scored apart. Verify: `git diff main -- README.md` shows it
- [ ] 3.5 Browser walk. Verify: a page detail shows the Speed block with dates and sources, and the score explanation's new paragraph
  NOT DONE: no browser was available. Verified instead through the detail payload on the rebuilt
  stack and `SpeedSection.test.tsx`; the walk is open.
- [x] 3.6 Commits: `feat(fe): a Speed block on the page, scored apart from SEO` · `docs(readme): how to read a Core Web Vitals badge`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
  AMENDED during implementation: one commit, `0fdfe57 feat(fe): a Speed block on the page, scored
  apart from SEO`, carrying the README's "Reading a badge" lines with the block they describe.

## 4. Phase acceptance

- [x] 4.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
- [x] 4.2 Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
- [x] 4.3 Archive and deposit are plan phase 5: PAGES-014 into `be/src/modules/pages/PAGES_MODULE.md`; the frontend ids where phase 5 decides. Verify: `pnpm exec openspec validate --specs`
  DONE in phase 5: PAGES-014 deposited in `PAGES_MODULE.md`; PAGELIST-008, PAGEDETAIL-011 and
  PAGEDETAIL-012 in `fe/skills/AGENTS.md`, where every frontend requirement is deposited.
