# Pages module

Owns `pages`, `keywords`, `page_keywords`, `seo_issues` and `rank_snapshots`; serves the pages
list, the page detail and the position history.

- **Current = on the client's latest succeeded/partial run.** A page or keyword pair a re-crawl no
  longer finds keeps its `last_seen_run_id` and its history and simply stops being read. Nothing
  deletes pages or pairs (guard: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src ':!*spec.ts'`);
  issues describe the latest fetch and are replaced.
- **Positions are read, never stored twice.** The latest position per pair is a `LATERAL …
  ORDER BY captured_at DESC LIMIT 1` on the snapshot primary key; the best position is picked in
  `pickBestPosition` (lowest, then more relevant, then alphabetical). Measured on the seed
  (~56 000 snapshots): a 15-page slice, 79 pairs, `Index Scan Backward using rank_snapshots_pk`,
  0.8 ms (`be/test/explain/pages-list.explain.sql`). Sorting the list by position would need a
  stored latest position — the trigger to reopen this (D7).
- **The list is four statements whatever the page size** (slice, total, keywords, issue counts);
  a `describe('cost')` test counts them. Search matches the raw text against URLs and its
  normalized form against keywords, `%`/`_` escaped, served by trigram GIN indexes.
- **History** turns the user's calendar days into UTC bounds once (`dayRangeToUtc`, the user's
  zone from the session — a `timeZone` parameter is refused) and scans one key range per pair.
- **The detail answers for every catalogue check, in four states.** `composePageChecks`
  iterates the CATALOGUE, never the stored lists: a code in neither is `notYetChecked` — the
  catalogue gained it after this page's crawl — and a code the catalogue has since retired is
  simply not rendered. Precedence per code is notApplicable, then failed, then judged, else
  notYetChecked; failure is asked before membership because a stored finding is an observation,
  and a composition that could hide one is worse than one that reports a contradiction the
  disjointness constraint already forbids. The status is composed HERE and not on the screen,
  because only this side holds `checks_applicable`.
<!-- invariant: PAGES-012 -->
**A page answers every catalogue check with one of four statuses.** Composed on the backend, in
catalogue order, from the lists the crawl stored; a page whose crawl predates the recording says
so rather than reporting a status it never observed. Pinned by
`be/src/modules/pages/services/page-checks/compose-page-checks.spec.ts` (the four statuses, the
catalogue order, the retired code, the null case),
`be/src/modules/pages/services/page-read/page-read.service.spec.ts` -> `describe('PageReadService.getPage')`,
`be/src/modules/pages/repositories/pages/pages.repository.int-spec.ts` (the four refusals and the
re-crawl overwrite) and `be/test/e2e/pages.e2e-spec.ts` ->
"the detail answers for every catalogue check, and the answers add up".
Specified in `openspec/specs/be/src/modules/pages/spec.md`.

- **`checks_judged` stays nullable, and that is a finding.** The intent was to require it once
  every client had been re-crawled. A re-crawl fills a page the crawl still finds and cannot fill
  one it no longer does, and those rows are kept because nothing here deletes a page. Backfilling
  them is not merely dishonest but unrepresentable: `checks_applicable = cardinality(checks_judged)`
  refuses an invented `'{}'` on a row claiming eighteen applicable checks. NOT NULL would
  therefore need those pages deleted, which the first bullet forbids — so the wire keeps its null
  and the screen says "re-crawl this page to see each check" rather than inventing verdicts.
- **A page row remembers what the next crawl compares against.** `content_hash` (SHA-256 of the
  main text) and `date_modified` (as the page declared it) are written by every crawl and read
  back, for the same client only, before the next one judges the page — the input of
  DATE_BUMPED_WITHOUT_CHANGES. Null on rows crawled before they were recorded, which the check
  reads as "nothing to compare", never as a change.
- **Every read is scoped**; a foreign or non-current id is the same 404 as a missing one.


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable — PAGES-012 is deposited above, beside the prose it belongs to. Unless another path is
named, the requirement lives in `openspec/specs/be/src/modules/pages/spec.md`.

<!-- invariant: PAGES-001 -->
**A rank snapshot is keyed by page, keyword and UTC instant, belongs to a real pair, and sits in 1–100.** Pinned by the CHECK `rank_snapshots_position_range` and the composite FK, by `repositories/rank-snapshots/rank-snapshots.repository.int-spec.ts` -> "refuses position %d" and "refuses a snapshot for a pair the page does not have".

<!-- invariant: PAGES-002 -->
**The list returns only the user’s current pages, filterable by client, paginated at a page size of at most 50, with a total.** Pinned by `repositories/page-list/page-list.repository.int-spec.ts` -> "lists only pages of the latest succeeded or partial run", "a failed or running re-crawl keeps showing the previous run’s pages", "never lists another user’s pages"; `be/test/e2e/pages.e2e-spec.ts` -> the `?pageSize=51` case.

<!-- invariant: PAGES-003 -->
**Search matches a page’s URL or a current keyword, case-insensitively, with `%` and `_` matching themselves.** Pinned by `page-list.repository.int-spec.ts` -> "search matches the URL or a current keyword, not a dropped one" and "an escaped % or _ matches only itself"; `be/src/core/utils/escape-like/escape-like.spec.ts`.

<!-- invariant: PAGES-004 -->
**Latest and best positions are computed at read time from the snapshot key, never stored a second time.** Pinned by `services/best-position/pick-best-position.spec.ts` -> "picks the lowest position" and "breaks a tie by relevance, then by term"; `page-list.repository.int-spec.ts` -> "keywords carry their latest position; issue counts group by severity".

<!-- invariant: PAGES-005 -->
**A `clientId` the user does not own answers exactly like a missing one.** Pinned by `services/page-read/page-read.service.spec.ts` -> "checks a clientId belongs to the user before listing"; `be/test/e2e/pages.e2e-spec.ts` -> "another user’s clientId is a 404, and their list is empty"; `be/test/e2e/isolation-matrix.e2e-spec.ts`.

<!-- invariant: PAGES-006 -->
**The detail returns a current page of the user with its keywords, issues and last run; anything else is the same 404 as a missing page.** Pinned by `services/page-read/page-read.service.spec.ts` -> `describe("PageReadService.getPage")`, notably "refuses a page the scope cannot reach, exactly like a missing one" and "returns the issues in catalogue order, not the order stored"; `be/test/e2e/pages-history.e2e-spec.ts` -> "a page a newer crawl no longer found is a 404, like a missing one".

<!-- invariant: PAGES-007 -->
**The history returns one time-ordered series per current keyword, and a keyword with no points keeps an empty series rather than disappearing.** Pinned by `services/position-history/position-history.service.spec.ts` -> "groups points per keyword and keeps a keyword without points"; `be/test/e2e/pages-history.e2e-spec.ts` -> "the spring-forward day (23 h) too; a keyword without points keeps its empty series".

<!-- invariant: PAGES-008 -->
**The history range defaults to 30 days in the user’s zone, clamps a future end, and refuses an inverted or over-long span.** Pinned by `services/position-history/resolve-history-range.spec.ts` -> "defaults to the 30 days ending today in the user’s zone", "clamps a future `to` to today", "refuses %j with INVALID_DATE_RANGE", "accepts exactly 366 days".

<!-- invariant: PAGES-009 -->
**A page’s score is the rounded share of applicable checks that passed, always reported with the denominator it came from.** Pinned by `packages/contracts/src/domain/pages/page-score/page-score.util.test.ts` -> "rounds half up, so a page is never quietly marked down" and "carries the denominator it was computed from"; `be/test/e2e/pages.e2e-spec.ts` -> "every item carries a score and the denominator it came from". "One implementation serves both sides" is NOT pinned — it rests on both workspaces importing `@app/contracts`.

<!-- invariant: PAGES-010 -->
**The list is ordered score ascending, then failures descending, ending on a unique key so a full walk returns each page exactly once.** Pinned by `page-list.repository.int-spec.ts` -> "orders worst first: the lowest score is row one", "compares scores as fractions, not as integer division", "walking every page at pageSize 3 returns each id exactly once"; `be/test/e2e/pages.e2e-spec.ts` -> "pages through the 15 posts, worst first and each exactly once".

<!-- invariant: PAGES-011 -->
**Each finding reports how many of the client’s current pages carry it — over the whole client, never over the slice on screen.** Pinned by `page-list.repository.int-spec.ts` -> `describe("the site-wide spread")`, notably "a search matching one page still reports the code on five" and "never reports another user’s spread"; the no-query-per-row half by `page-read.service.spec.ts` -> `describe("cost")`.

<!-- invariant: CRAWL-009 -->
**A re-crawl upserts and deletes nothing; "current" is whatever the latest succeeded or partial run saw. (`openspec/specs/be/src/modules/crawl/spec.md`)** Pinned by `repositories/pages/pages.repository.int-spec.ts` -> "upserts on (client_id, url): a re-crawl keeps the id and moves last_seen_run_id"; `page-list.repository.int-spec.ts` -> "a failed or running re-crawl keeps showing the previous run’s pages"; `be/test/e2e/crawl.e2e-spec.ts` -> "a re-crawl keeps a post the sitemap no longer lists, at its old run".

<!-- invariant: ANALYSIS-007 -->
**A re-crawl replaces a page’s issues and its check counters together, and refreshes its keyword pairs without deleting any. (`openspec/specs/be/src/modules/page-analysis/spec.md`)** Pinned by `services/crawl-results/crawl-results.service.spec.ts` -> "replaces the issues of every re-fetched page, even a page with none now" and "upserts every pair with the new relevance and run — and deletes none"; `repositories/pages/pages.repository.int-spec.ts` -> "a re-crawl refreshes the check counters with the issues, not only the page".

<!-- invariant: SEED-003 -->
**Every current pair gets a deterministic daily history, and re-running the seed adds no duplicates. (`openspec/specs/be/src/seed/spec.md`)** Pinned by `services/position-generator/history-days/history-days.spec.ts` -> the "%d pairs → %d days" cases; `generate-positions/generate-positions.spec.ts` -> "the same pair and days give an identical series"; `be/src/seed/seed-runner/seed-runner.int-spec.ts` -> "a second run on the same day adds no rows and crawls nothing".

<!-- invariant: SEED-004 -->
**Every seeded snapshot is captured at 12:00 UTC, and the newest is the last noon not after the seed ran. (`openspec/specs/be/src/seed/spec.md`)** Pinned by `history-days.spec.ts` -> `describe("latestCapture")` -> the "at %s → %s" cases; `generate-positions.spec.ts` -> "captures daily at 12:00 UTC and keeps every value in 1..100"; `seed-runner.int-spec.ts`, whose SQL asserts no row has a UTC hour other than 12.

<!-- invariant: SEED-005 -->
**A pair’s baseline follows its relevance, and each day walks from the previous position with pull, noise and a rare jump, clamped to 1–100. (`openspec/specs/be/src/seed/spec.md`)** Pinned by `services/position-generator/baseline/baseline.spec.ts` -> "puts the strongest keyword at 3–15" and "puts a weak keyword (relevance 0.2) around 64–76"; `generate-positions.spec.ts` -> "stays near the baseline: a strong pair averages in the top 20"; the CHECK `rank_snapshots_position_range`.

<!-- invariant: TZ-003 -->
**The zone is `users.time_zone` carried by the session scope; no request parameter or header may choose it. (`openspec/specs/_root/time-zones/spec.md`)** Pinned by `be/test/e2e/pages-history.e2e-spec.ts` -> the `?timeZone=Asia/Tokyo` case answering 400; `be/src/modules/auth/guards/session/session.guard.spec.ts` -> "attaches a scope with userId and timeZone, and the session user". Structurally, `forbidNonWhitelisted: true` on the global validation pipe.
