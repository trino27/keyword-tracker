# Clients module

Owns `clients`, `crawl_runs` (the crawl queue) and `crawl_run_items` (the run log).

- **A website's identity is its site key** — the lower-cased host without `www.`
  (`siteKeyOf`, in contracts). `https://www.yoast.com/blog` and `yoast.com` are one client;
  `de.yoast.com` is another site. One rule, `parseWebsiteUrl`, decides validity on both sides;
  the frontend uses it to find the client a 409 refers to.
- **Uniqueness is the database's job:** `clients_user_id_site_key_uq` and the partial
  `crawl_runs_client_id_active_uq` (at most one queued/running run per client). Two concurrent
  requests race to the insert; the loser's 23505 becomes a 409, never a 500.
- **Adding a client answers at once.** The client, its first queued run and a `pg_notify` are one
  transaction; NOTIFY is delivered on commit, so a woken worker always finds the row.
- **Run states:** `queued → running → succeeded | partial | failed`. A run is claimed with
  `FOR UPDATE SKIP LOCKED` and holds a lease renewed by a heartbeat. An expired lease makes the run
  claimable again with `attempts + 1`; after three, `failAbandonedForWorker` fails it
  `CRAWL_ABANDONED`.
- **The fence:** every write of an execution carries `AND attempts = <its attempt>`; finalize
  locks the run on that condition first. A superseded executor (a zombie after a lease expiry)
  writes nothing.
- **"Current" run** = the latest succeeded/partial one, by `finished_at`, then `id`. A failed or
  running re-crawl never hides the previous pages.
- **Unscoped methods end in `ForWorker`** and live behind `ClientCrawlRunsService`; ESLint keeps
  them out of controllers.
