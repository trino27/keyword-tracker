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
- **Every read is scoped**; a foreign or non-current id is the same 404 as a missing one.
