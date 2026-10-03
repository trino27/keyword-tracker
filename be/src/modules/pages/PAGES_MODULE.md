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
- **Every read is scoped**; a foreign or non-current id is the same 404 as a missing one.
