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


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable. Unless another path is
named, the requirement lives in `openspec/specs/be/src/modules/clients/spec.md`.

<!-- invariant: CLIENT-001 -->
**A website IS its site key — lower-cased punycode host without `www.`; another subdomain is another site.** Pinned by `packages/contracts/src/domain/clients/website-url/parse-website-url.util.test.ts` -> the origin/site-key `it.each` and "keeps subdomains other than www apart"; `be/test/e2e/clients.e2e-spec.ts` -> "refuses the same website spelled differently with 409 CLIENT_ALREADY_EXISTS".

<!-- invariant: CLIENT-002 -->
**An address the server must not crawl — bad scheme, credentials, IP literal, localhost, dotless host — is refused before any database work.** Pinned by `parse-website-url.util.test.ts` -> the "refuses %p (%s)" `it.each`; `services/clients/clients.service.spec.ts` -> "refuses an invalid URL before touching the database".

<!-- invariant: CLIENT-003 -->
**At most one client per (user, site key); a concurrent duplicate loses on the index, not on a read-then-write.** Pinned by the unique index `clients_user_id_site_key_uq`; `repositories/crawl-runs/crawl-runs.constraints.int-spec.ts` -> "I9: one client per (user, site key)"; `be/test/e2e/clients.e2e-spec.ts` -> "two concurrent adds of one site: one 201, one 409".

<!-- invariant: CLIENT-004 -->
**Adding a client writes the client and its first queued run in one transaction, and answers without waiting for the crawl.** Pinned by `services/clients/clients.service.spec.ts` -> "creates the client and its first queued run in one transaction"; `be/test/e2e/clients.e2e-spec.ts` -> "adds a client with a queued run and answers 201".

<!-- invariant: CLIENT-005 -->
**A client has at most one queued-or-running run, enforced by a partial unique index rather than by a check-then-insert.** Pinned by the partial unique index `crawl_runs_client_id_active_uq`; `crawl-runs.constraints.int-spec.ts` -> "I10: at most one queued or running run per client"; `be/test/e2e/clients.e2e-spec.ts` -> "refuses a re-crawl while a run is queued with 409 CRAWL_ALREADY_ACTIVE".

<!-- invariant: CLIENT-006 -->
**The clients list carries each client’s latest run and its current page count.** Pinned by `be/test/e2e/clients.e2e-spec.ts` -> "lists the clients with their latest run, by name". The mid-crawl case is NOT pinned — no test reads `pagesDone` while a run is still `running`.

<!-- invariant: CLIENT-007 -->
**A run’s log names the selected sitemap and every candidate in sitemap order, each with its status and reason.** Pinned by `be/test/e2e/crawl.e2e-spec.ts` -> "crawls yoast: 15 posts, 16 log lines, /seo-blog/ skipped as a listing"; the CHECKs by `crawl-runs.constraints.int-spec.ts` -> "I16: a crawled item must reference its page; a skipped one must say why". The selection REASON sentence itself is not asserted.

<!-- invariant: CRAWL-001 -->
**A queued run is claimed by exactly one worker: `FOR UPDATE SKIP LOCKED`, set running, attempt incremented, lease taken. (`openspec/specs/be/src/modules/crawl/spec.md`)** Pinned by `repositories/crawl-runs/crawl-runs.queue.int-spec.ts` -> "two concurrent claims take two different runs (SKIP LOCKED)" and "claims a queued run: running, attempt 1, leased".

<!-- invariant: CRAWL-002 -->
**An abandoned run is reclaimable while attempts remain; past the third it fails `CRAWL_ABANDONED` and is never claimed again. (`openspec/specs/be/src/modules/crawl/spec.md`)** Pinned by `crawl-runs.queue.int-spec.ts` -> "reclaims a running run whose lease expired, as attempt 2" and "fails a run abandoned at attempt 3 with CRAWL_ABANDONED, and never claims it"; CHECK `crawl_runs_attempts_range`.

<!-- invariant: CRAWL-003 -->
**Only the attempt that still owns the run may write its results; a superseded executor writes nothing. (`openspec/specs/be/src/modules/crawl/spec.md`)** Pinned by `be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.spec.ts` -> "writes nothing when a newer attempt holds the fence"; `crawl-runs.queue.int-spec.ts` -> "a stale attempt cannot lock the run for finalize".
