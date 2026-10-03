<!-- ARCHIVED. Present tense below describes what this plan intended, not what is true. -->

# ARCHIVE HEADER

**Status:** archived 2026-10-03. **Branch:** `feat/keyword-tracker`, merged into `main` as
pull request #6. The `**Status:** active` line below is the plan as it was executed; nothing in
the body was edited.

**Built.** All eight changes implemented in phase order, test-first: `test-harness-and-ci-database`,
`user-sessions-and-default-deny`, `clients-and-blog-crawl`, `page-analysis`, `positions-and-seed`,
`pages-and-position-history`, `tracker-screens`, `readme-and-clean-clone`. Verified on a clean
clone — build, migrate, seed from the two live sites, 56 210 snapshot rows — and the README's
command block is the one that run executed verbatim.

**Harvested into** (§18's table, all six written):

| document | carries |
| --- | --- |
| `be/src/modules/auth/AUTH_MODULE.md` | session design, scrypt parameters and `maxmem`, why scrypt over the practice's argon2/bcrypt, RLS as the next step |
| `be/src/modules/clients/CLIENTS_MODULE.md` | site-key identity, the queue states, fencing |
| `be/src/modules/crawl/CRAWL_MODULE.md` | discovery scoring and the rejected alternatives, the listing interpretation, fixture recording |
| `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` | keyword method, rejected methods, where thresholds live |
| `be/src/modules/pages/PAGES_MODULE.md` | currentness rule, read-time positions and D7's reopen trigger, the EXPLAIN result |
| `be/skills/performance-patterns/SKILL.md` | the measured list-query plan and snapshot volume |
| `README.md` | the decisions section, the listing-page interpretation, unfinished and next steps, AI tools |

**Left open, for a person:**

1. **Two browser walks** — `tracker-screens` 4.3 and `readme-and-clean-clone` 2.3. No browser was
   available where the work ran. Both were verified as far as they could be without one: the
   seeded stack serves every route, and a throwaway test drove the real frontend gateways against
   it — sign-in, clients, a run log, the list, a detail and a 30-day history, all parsed through
   the FE schemas. What is unverified is what only eyes can check: layout, and the browser console.
2. **The OpenSpec archive and deposit.** None of this plan's changes has been archived, so
   `openspec/specs/` still holds only `.gitkeep` and all 92 requirements across the repository
   still live under `openspec/changes/`. That is one manual pass — archive, rewrite each delta
   heading from `Requirement: ID — text` into §3's `[ID]` form, then deposit each requirement into
   the module document that owns the invariant with its `<!-- invariant: … -->` marker and its
   pinning line (`openspec/README.md` §3a, §4, §8). The harvest above is done; the deposit is not,
   and it cannot be, because a deposit before the archive points at a proposal.
3. **Next steps**, carried into the README's own unfinished section rather than left here:
   Postgres row-level security behind the scoped queries, a sitemap-less HTML/feed fallback,
   network SEO checks, a Playwright smoke test, and moving the position fill onto the crawl queue.

**Followed by** `docs/_plans-archive/seo-analysis-accuracy.md`, which corrected the SEO check
catalogue this plan's `page-analysis` change built.

---

# SEO keyword tracker — sessions, client crawl, analysis, positions, four screens

An agency user signs in with email and password and stays signed in across refreshes; nothing
is reachable without a session. The **Pages** screen lists the user's crawled blog pages with
each page's likely keywords and their latest positions, its SEO-issue count and its best latest
position, filterable by client, searchable by URL or keyword, paginated. A **page detail** shows
the page, its keywords, its SEO issues, and its position history over a date range the user
picks, as a chart and as a table. **Clients** (the brief's "Add a client" screen) adds a client
by name and website URL — the app finds the site's blog sitemap, crawls its first 15 blog posts
in sitemap order and runs the same keyword and issue logic the seed uses — and lists the user's
clients with crawl status, re-crawl, and each run's candidate log. A seed command creates two
users with one client each (Semrush, Yoast), crawls the live sites through the same code, and
invents a daily position history of at least 50,000 snapshot rows. Snapshots are stored in UTC;
the user is in Toronto; user A never reaches user B's data by any route.

**Status:** active
**Branch:** `feat/keyword-tracker`
**Changes:** test-harness-and-ci-database, user-sessions-and-default-deny, clients-and-blog-crawl, page-analysis, positions-and-seed, pages-and-position-history, tracker-screens, readme-and-clean-clone

## How to read this

Present tense describes the intended state, not the current one: most names below do not exist
yet, and each is marked **new** where it first appears in §7 or §15. §1–§12 are the
specification (what is true when the work is done); §13–§14 say what pins it; §15 is the
sequence. Each change's `tasks.md` is **generated from §15** and is corrected through this plan.

---

## 1. User-visible behaviour

Every screen sits in a Mantine `AppShell`: a top bar with the product name, the navigation
(**Pages**, **Clients**) and a user menu (the signed-in email, **Sign out**). Every screen opens
with a page header: title, one-line subtitle, the primary action on the right (D35). Crawl
statuses use one colour everywhere: queued grey, running blue with a loader, succeeded green,
partial yellow, failed red.

### 1.1 Sign in (`/sign-in`)

- A centred card with Email and Password and a **Sign in** button. No sign-up, no password reset.
- A wrong email or a wrong password shows one sentence — "Email or password is incorrect" — and
  keeps what was typed. Too many attempts show "Too many sign-in attempts. Try again in a
  minute."
- On success the user lands where they were going (the `redirect` search parameter, accepted
  only as a same-origin path), otherwise on `/pages`.
- A signed-in visitor who opens `/sign-in` is sent to `/pages`.
- The session survives a refresh and a browser restart for 7 days of inactivity (sliding).

### 1.2 Pages (`/pages`, the landing screen; `/` redirects here)

- Header: **Pages**, subtitle "N pages across M clients", primary action **Add client** (to
  `/clients`).
- Under the header, when the list is filtered to one client whose latest run is not
  `succeeded`, a **crawl banner**: "Crawling semrush.com — 6 of 15 pages" while queued or
  running (it polls every 2 s); when the run ends `succeeded` or `partial` the list reloads by
  itself; `partial` and `failed` say why in plain words ("Only 9 of 15 posts could be crawled",
  "No blog sitemap found on yoast.com").
- A filter bar above the table: a client select (each option shows the client's latest crawl
  status as a badge), a search box "Search URL or keyword" (applied ~300 ms after typing stops),
  **Clear filters**, and the result count "Showing 21–40 of 47".
- Columns: **Page** (title, the URL muted beneath, a client badge); **Keywords** (chips, each with
  its latest position, the first 3–4 and "+N"); **Best position** (the number and the keyword
  that produced it, coloured by bucket 1–3 / 4–10 / 11–20 / 21+); **Issues** (the count, red when
  any issue is an error); **Last captured** (the date in the user's zone). The whole row opens
  the page detail.
- Under the table: pagination and a page-size select (20 / 50).
- Filters, search, page and page size live in the URL: a reload, the back button and a shared
  link reproduce the same list.
- Empty states: no clients yet → "Add your first client" with the **Add client** action; no
  match for the filters → "No pages match" with **Clear filters**; a page without positions yet
  shows "—" in Best position with the hint "appears after the next seed run".
- Changing a filter or the search returns to page 1.

### 1.3 Page detail (`/pages/:pageId`)

- Breadcrumb **Pages / client / page**; "Pages" returns to the list with its filters intact.
- Header: the page title, an external link to the URL, the client badge, "Last crawled …".
- KPI cards: best position (and its keyword), keywords tracked, issues by severity (errors /
  warnings / notices), last crawl status (badge and time).
- **Position history**: range presets 7d / 30d (default) / 90d / 12m and a custom range picker;
  keyword toggles that double as the chart legend; a Chart | Table switch. The chart has position
  1 at the top (inverted Y, 1–100) and dates on the X axis in the user's zone. The table shows
  per keyword: term, relevance, latest position in range, change over the range (arrow), best
  and worst in range. The range and the view live in the URL.
- **SEO issues**: grouped Errors / Warnings / Notices, each as a human sentence with what exactly
  is wrong ("Title is 72 characters; keep it between 30 and 60").
- An id the user does not own, or that does not exist, shows a not-found view with a link back
  to Pages — the two are indistinguishable.

### 1.4 Clients (`/clients` — the brief's "Add a client" screen)

- Header: **Clients**, subtitle with the client count.
- An add form card on top: **Name**, **Website URL** with the helper "We'll find its blog
  sitemap and crawl the first 15 posts", **Add client**. An invalid URL is a field error under
  Website URL ("Enter a public website address, e.g. https://example.com"); a website already
  added is a field error with a link to that client's pages ("You already track this site — view
  its pages").
- After adding, the user lands on `/pages?clientId=<new>` with the crawl banner (D25).
- Below, the clients table: client name and site; current pages; last crawl status badge and
  time, with "6 / 15" while running; actions **View pages** (the list filtered to that client)
  and **Re-crawl** (disabled while a run is queued or running). The table refreshes every 2 s
  while any run is active.
- A row expands into the **run log** of the client's latest run: the selected sitemap and why it
  was selected, then every candidate in sitemap order with a status badge (crawled, listing
  skipped, robots disallowed, not HTML, other site, failed) and the reason. This is where the
  Yoast `/seo-blog/` listing page is visibly skipped.

### 1.5 What the seed gives a reviewer

`docker compose run --rm seed` creates `semrush.manager@example.com` (client Semrush,
https://www.semrush.com) and `yoast.manager@example.com` (client Yoast, https://yoast.com), both
in America/Toronto, with the password from `SEED_USER_PASSWORD`; crawls both sites live; and
generates daily positions ending at the latest 12:00 UTC. Running it again adds no duplicates and
extends every walk to today.

## 2. Principles

- **P1 — The scope is in the query.** Every read or write of user data takes an `IUserScope` and
  joins `clients.user_id` in SQL; consequence: a missing ownership check is a missing argument,
  which does not compile, rather than a forgotten `if` (D8).
- **P2 — Deny by default.** A route is public only by an explicit `@Public()`, and a test
  enumerates every route; consequence: a new controller is protected before anybody thinks about
  it (D32).
- **P3 — A foreign object does not exist.** Foreign and missing ids answer the same 404 body;
  consequence: ids cannot be probed, and no code path loads-then-checks (D8).
- **P4 — Instants are UTC; calendar days belong to the user's zone, which is a column.** Zone
  conversion happens in exactly two places: the API's day-range → UTC bounds, and the frontend's
  `Intl` formatting in the user's zone (D2, D3).
- **P5 — The schema forbids what must never be.** Uniqueness, single active run, snapshot
  integrity, run-state consistency are constraints, not service checks (D1, D5, D9, D33).
- **P6 — The crawl is data.** A run's status, its failure reason and every candidate it
  considered are rows; consequence: the UI explains a failed crawl from the database and the
  seed shares the UI's path (D5, D21, D33).
- **P7 — One crawl path.** The seed, the UI and a re-crawl all enqueue a `crawl_runs` row and the
  same worker executes it; consequence: nothing site-specific may appear in code, and a fixture
  for each site runs through identical logic (D18, D19, D23).
- **P8 — Results are written once, atomically, by the attempt that owns the run.** A run's pages,
  keywords, issues, items and final status are committed in one transaction guarded by the
  attempt number; consequence: a reclaimed run executing twice cannot interleave its writes
  (D19).
- **P9 — Nothing is deleted on re-crawl; "current" is computed.** Pages and pairs carry
  `last_seen_run_id`, and what is shown is what the client's latest succeeded/partial run saw
  (D31).
- **P10 — Computed at read time, never denormalized.** Latest and best positions come from the
  snapshot PK at read time, only for the listed page (D6, D7).
- **P11 — A catalogue is executed, not described.** The SEO rule set and the error codes are
  `Record`s the code builds from, shared through `@app/contracts`; consequence: a code the
  frontend does not know fails its schema parse instead of rendering blank (D4, D16).
- **P12 — The network is never in a test.** Crawler behaviour is pinned against recorded
  fixtures served by a transport double (D26).
- **P13 — The decision log beats a practice.** Where a decision contradicts `practices/` (scrypt
  vs argon2/bcrypt in `security-patterns`; an instant column vs a `date` column and API-side
  range conversion in `timestamp-column-naming`), the decision wins and §18 records the
  divergence in the owning module document.

## 3. Data model

All tables are new, under `be/src/persistence/schema/tables/<table>/<table>.schema.ts`, each
spread into `databaseSchema` in the same commit. ids are `primaryId()`; FKs are
`bigint(..., { mode: 'number' })`. **Every `pgEnum` is exported from the schema file of the
table that uses it**, because drizzle-kit reads only the `tables/**/*.schema.ts` glob and an
enum imported from elsewhere is not emitted as `CREATE TYPE` (VERIFY: drizzle-kit 0.31 behaviour
for an enum not exported from a globbed file). Enum values come from `@app/contracts` tuples so
the two sides cannot drift.

### 3.1 `users` (phase 2)

```ts
export const users = pgTable('users', {
  id: primaryId(),
  // Stored lower-cased by AuthService; the CHECK makes a mixed-case duplicate unrepresentable.
  email: varchar('email', { length: 254 }).notNull(),
  // `scrypt$N$r$p$saltB64$hashB64` (D11); parameters travel with the hash so they can be raised later.
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  // IANA name (D3), validated with Intl at write. Owned by an outside system: varchar, not enum.
  timeZone: varchar('time_zone', { length: 64 }).notNull(),
  ...auditTimestampColumns(),
}, (t) => [
  uniqueIndex('users_email_uq').on(t.email),
  check('users_email_lowercase', sql`${t.email} = lower(${t.email})`),
]);
```

### 3.2 `sessions` (phase 2)

```ts
export const sessions = pgTable('sessions', {
  id: primaryId(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  // sha256(token); the token itself exists only in the cookie (D10). VERIFY: drizzle-orm 0.45
  // pg-core exports `bytea`; otherwise a `customType<{ data: Buffer }>` named byteaColumn.
  tokenHash: bytea('token_hash').notNull(),
  // Sliding: pushed forward on use, at most once per SESSION_TOUCH_INTERVAL.
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: createdAtColumn(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('sessions_token_hash_uq').on(t.tokenHash),
  index('sessions_user_id_idx').on(t.userId),
  index('sessions_expires_at_idx').on(t.expiresAt), // the purge on login
]);
```

### 3.3 `clients` (phase 3)

```ts
export const clients = pgTable('clients', {
  id: primaryId(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  // The origin as entered (scheme added when missing), D9. Crawling starts here.
  websiteUrl: varchar('website_url', { length: 2048 }).notNull(),
  // Lower-cased host, punycode, no leading "www." — the identity of "the same website" (D9).
  siteKey: varchar('site_key', { length: 253 }).notNull(),
  ...auditTimestampColumns(),
}, (t) => [
  // Also serves "list my clients" (leading user_id).
  uniqueIndex('clients_user_id_site_key_uq').on(t.userId, t.siteKey),
]);
```

### 3.4 `crawl_runs` (phase 3)

```ts
export const crawlStatusEnum = pgEnum('crawl_status_enum', CRAWL_RUN_STATUSES);   // queued|running|succeeded|partial|failed
export const crawlTriggerEnum = pgEnum('crawl_trigger_enum', CRAWL_TRIGGERS);     // seed|user

export const crawlRuns = pgTable('crawl_runs', {
  id: primaryId(),
  clientId: bigint('client_id', { mode: 'number' }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  status: crawlStatusEnum('status').notNull().default('queued'),
  trigger: crawlTriggerEnum('trigger').notNull(),
  // Null until discovery selects one; the run log shows it.
  sitemapUrl: varchar('sitemap_url', { length: 2048 }),
  // Human sentence: why this sitemap won (D14), e.g. "name 'blog' +3, 100% of URLs under /blog/ +3, 10/10 feed items +4".
  selectionReason: varchar('selection_reason', { length: 500 }),
  // URLs in the selected sitemap group after the same-site filter; 0 until discovery ends.
  pagesFound: integer('pages_found').notNull().default(0),
  // Posts crawled so far; the banner's "6 of 15". After finalize = the run's page count.
  pagesDone: integer('pages_done').notNull().default(0),
  // A CRAWL_RUN_ERROR_CODES key (contracts); null unless partial or failed.
  errorCode: varchar('error_code', { length: 64 }),
  errorMessage: varchar('error_message', { length: 500 }),
  // Claim counter AND fencing token (P8): the executor that claimed attempt N may finalize only while attempts = N.
  attempts: smallint('attempts').notNull().default(0),
  // Lease; null while queued. A running run whose lease expired is reclaimable (D19).
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  createdAt: createdAtColumn(),
}, (t) => [
  // D5/D30: at most one active run per client; a double start is a 23505.
  uniqueIndex('crawl_runs_client_id_active_uq').on(t.clientId).where(sql`${t.status} in ('queued', 'running')`),
  // The claim query's ORDER BY created_at over claimable rows.
  index('crawl_runs_claim_idx').on(t.createdAt).where(sql`${t.status} in ('queued', 'running')`),
  // "latest run of a client" and "current (latest succeeded/partial) run of a client".
  index('crawl_runs_client_id_created_at_idx').on(t.clientId, t.createdAt),
  index('crawl_runs_client_id_finished_at_idx').on(t.clientId, t.finishedAt).where(sql`${t.status} in ('succeeded', 'partial')`),
  check('crawl_runs_finished_at_required', sql`${t.status} not in ('succeeded', 'partial', 'failed') or ${t.finishedAt} is not null`),
  check('crawl_runs_started_at_required', sql`${t.status} = 'queued' or ${t.startedAt} is not null`),
  check('crawl_runs_pages_done_nonnegative', sql`${t.pagesDone} >= 0 and ${t.pagesFound} >= 0`),
  check('crawl_runs_attempts_range', sql`${t.attempts} between 0 and 3`),
]);
```

### 3.5 `pages` (phase 3)

```ts
export const pages = pgTable('pages', {
  id: primaryId(),
  clientId: bigint('client_id', { mode: 'number' }).notNull().references(() => clients.id, { onDelete: 'cascade' }),
  // The sitemap URL of the post (the identity for upsert, D19); the final URL after redirects is final_url.
  url: varchar('url', { length: 2048 }).notNull(),
  finalUrl: varchar('final_url', { length: 2048 }).notNull(),
  title: varchar('title', { length: 1000 }),          // null: no <title> in <head>
  metaDescription: varchar('meta_description', { length: 2000 }),
  h1: varchar('h1', { length: 1000 }),
  lang: varchar('lang', { length: 35 }),               // BCP 47 from <html lang>, null when absent
  wordCount: integer('word_count').notNull(),          // main-content words
  httpStatus: smallint('http_status').notNull(),
  responseMs: integer('response_ms').notNull(),        // TTFB, for SLOW_RESPONSE
  htmlBytes: integer('html_bytes').notNull(),
  // Position in the selected sitemap group (0-based); the list's secondary order (D12).
  sitemapPosition: integer('sitemap_position').notNull(),
  // The run that last saw this page (D31). Current = equals the client's latest succeeded/partial run.
  lastSeenRunId: bigint('last_seen_run_id', { mode: 'number' }).notNull().references(() => crawlRuns.id),
  // When the page was last fetched; differs from created_at after any re-crawl.
  crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull(),
  ...auditTimestampColumns(),
}, (t) => [
  uniqueIndex('pages_client_id_url_uq').on(t.clientId, t.url),
  index('pages_client_id_last_seen_run_id_idx').on(t.clientId, t.lastSeenRunId),
  index('pages_last_seen_run_id_idx').on(t.lastSeenRunId),
  // pages_url_trgm_idx is added in phase 6 (needs pg_trgm first), see §3.11.
]);
```

### 3.6 `crawl_run_items` (phase 3; D33 — replaces D21's `failures_json`, which is never created)

```ts
export const crawlItemStatusEnum = pgEnum('crawl_item_status_enum', CRAWL_ITEM_STATUSES);
// crawled | skipped_listing | skipped_robots | skipped_not_html | skipped_other_site | failed

export const crawlRunItems = pgTable('crawl_run_items', {
  runId: bigint('run_id', { mode: 'number' }).notNull().references(() => crawlRuns.id, { onDelete: 'cascade' }),
  sitemapPosition: integer('sitemap_position').notNull(),
  url: varchar('url', { length: 2048 }).notNull(),
  status: crawlItemStatusEnum('status').notNull(),
  // Plain-words reason; null for crawled. "Declares itself a listing (JSON-LD CollectionPage)".
  reason: varchar('reason', { length: 300 }),
  httpStatus: smallint('http_status'),                  // null: not fetched, or no response
  // Set for crawled items; pages are never deleted except with their client (D31).
  pageId: bigint('page_id', { mode: 'number' }).references(() => pages.id, { onDelete: 'set null' }),
}, (t) => [
  primaryKey({ name: 'crawl_run_items_pk', columns: [t.runId, t.sitemapPosition] }),
  check('crawl_run_items_page_required', sql`${t.status} <> 'crawled' or ${t.pageId} is not null`),
  check('crawl_run_items_reason_required', sql`${t.status} = 'crawled' or ${t.reason} is not null`),
]);
```

### 3.7 `keywords` (phase 4) — a global dictionary (D1); shared by all users, so nothing cascades from it

```ts
export const keywords = pgTable('keywords', {
  id: primaryId(),
  term: varchar('term', { length: 200 }).notNull(),   // normalized (§10.4); unique
  createdAt: createdAtColumn(),
}, (t) => [
  uniqueIndex('keywords_term_uq').on(t.term),
  // keywords_term_trgm_idx added in phase 6, §3.11.
]);
```

### 3.8 `page_keywords` (phase 4)

```ts
export const pageKeywords = pgTable('page_keywords', {
  pageId: bigint('page_id', { mode: 'number' }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
  // No cascade: a keyword row is shared across users.
  keywordId: bigint('keyword_id', { mode: 'number' }).notNull().references(() => keywords.id),
  relevance: real('relevance').notNull(),               // 0..1, score / page's top score (D15)
  lastSeenRunId: bigint('last_seen_run_id', { mode: 'number' }).notNull().references(() => crawlRuns.id),
  ...auditTimestampColumns(),
}, (t) => [
  primaryKey({ name: 'page_keywords_pk', columns: [t.pageId, t.keywordId] }),
  index('page_keywords_keyword_id_idx').on(t.keywordId),  // search: term match -> pages
  check('page_keywords_relevance_range', sql`${t.relevance} > 0 and ${t.relevance} <= 1`),
]);
```

### 3.9 `seo_issues` (phase 4, D4)

```ts
export const seoIssueSeverityEnum = pgEnum('seo_issue_severity_enum', SEO_ISSUE_SEVERITIES); // error|warning|notice

export const seoIssues = pgTable('seo_issues', {
  id: primaryId(),
  pageId: bigint('page_id', { mode: 'number' }).notNull().references(() => pages.id, { onDelete: 'cascade' }),
  // A key of SEO_ISSUE_CATALOGUE (contracts); a growing set, so varchar (D4).
  code: varchar('code', { length: 64 }).notNull(),
  severity: seoIssueSeverityEnum('severity').notNull(),
  // What exactly is wrong, e.g. { length: 72, min: 30, max: 60 }.
  details: jsonb('details_json').notNull(),
  createdAt: createdAtColumn(),
}, (t) => [uniqueIndex('seo_issues_page_id_code_uq').on(t.pageId, t.code)]);
```

### 3.10 `rank_snapshots` (phase 5, D1/D2)

```ts
export const rankSnapshots = pgTable('rank_snapshots', {
  pageId: bigint('page_id', { mode: 'number' }).notNull(),
  keywordId: bigint('keyword_id', { mode: 'number' }).notNull(),
  // When the position was observed (an instant, UTC). Seeded at 12:00 UTC daily (D2).
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  position: smallint('position').notNull(),
  // Differs from captured_at for every seeded row.
  createdAt: createdAtColumn(),
}, (t) => [
  // Serves both reads: LATERAL latest per pair (backward scan) and the per-page history range.
  primaryKey({ name: 'rank_snapshots_pk', columns: [t.pageId, t.keywordId, t.capturedAt] }),
  // A snapshot cannot exist for a pair the page does not have (D1).
  foreignKey({ name: 'rank_snapshots_page_keyword_fk', columns: [t.pageId, t.keywordId],
    foreignColumns: [pageKeywords.pageId, pageKeywords.keywordId] }).onDelete('cascade'),
  check('rank_snapshots_position_range', sql`${t.position} between 1 and 100`),
]);
```

### 3.11 Trigram search (phase 6, D12)

1. `pnpm --filter be db:generate --custom --name enable_pg_trgm` creates an empty migration;
   its whole body is `CREATE EXTENSION IF NOT EXISTS pg_trgm;`. This is the one hand-written
   migration body, allowed because Drizzle cannot express an extension. (VERIFY: pnpm forwards
   `--custom --name` to the `db:generate` script unchanged; otherwise run
   `pnpm --filter be exec dotenv -e ../.env -- drizzle-kit generate --custom --name enable_pg_trgm`.)
2. Then the schema gains, and `pnpm db:generate` emits after it:

```ts
index('pages_url_trgm_idx').using('gin', t.url.op('gin_trgm_ops')),
index('keywords_term_trgm_idx').using('gin', t.term.op('gin_trgm_ops')),
```

The order matters: an index migration before the extension migration fails on a fresh database
with "operator class gin_trgm_ops does not exist" — which the clean-clone check would be the
first to see.

### 3.12 Volume

Two seed clients × 15 posts × ~6 keywords ≈ 180 pairs; days = max(365, ceil(50 000 / 180)) =
365; ≈ 65 700 snapshot rows. Everything else is small.

## 4. Invariants and their enforcement

| # | Invariant | Mechanism | Req id |
| --- | --- | --- | --- |
| I1 | Every route except `POST /api/auth/login` and `GET /api/health` answers 401 without a valid session | global `APP_GUARD` `SessionGuard` + `@Public()` metadata | ISO-001 |
| I2 | A foreign id answers exactly like a missing one (404, identical body) | repository SQL joins `clients.user_id = scope.userId`; services throw the same `*NotFoundException` for "no row" | ISO-002 |
| I3 | An `IUserScope` is created only by the session guard | branded interface + ESLint `no-restricted-syntax` banning `as IUserScope` outside `create-user-scope.ts` and tests | ISO-003 |
| I4 | Unscoped repository/service methods (suffix `ForWorker`) are never called from a controller | ESLint selector on `src/modules/**/controllers/**` | ISO-004 |
| I5 | Every route taking an id or a `clientId` is in the isolation matrix | static test: routes with a path param ∪ `{GET /api/pages?clientId}` ⊆ matrix keys | ISO-005 |
| I6 | Only `scrypt$…` strings are stored as passwords; only sha256 of the session token is stored | `PasswordHasher`, `hashSessionToken`; column holds bytes, never the cookie value | AUTH-001/002 |
| I7 | Unknown email and wrong password are indistinguishable (body, status; timing via a dummy hash) | `AuthService.signIn` single exit | AUTH-004 |
| I8 | Mutating requests with a body accept only `application/json` | `jsonOnlyMiddleware` in `configureApp` | AUTH-008 |
| I9 | One client per (user, site key) | `clients_user_id_site_key_uq`; 23505 → 409 | CLIENT-003 |
| I10 | At most one queued/running run per client | partial unique `crawl_runs_client_id_active_uq`; 23505 → 409 | CLIENT-005 |
| I11 | A finished run has `finished_at`; a started one has `started_at`; attempts ≤ 3 | CHECKs §3.4 | CRAWL-002 |
| I12 | Only the attempt that currently owns a run writes its results | finalize locks the run `WHERE id = ? AND status = 'running' AND attempts = ?` inside the finalize transaction; zero rows → rollback | CRAWL-003 |
| I13 | A client and its first queued run are created in one transaction; the HTTP request never awaits the crawl | `ClientsService.addClient` uses one `TransactionRunner.run`; the worker is the only executor | CLIENT-004 |
| I14 | A run fetches no page before selecting the sitemap; only same-site sitemaps and URLs | `SitemapDiscoveryService` takes only sitemap/feed/robots fetches; `isSameSite(url, siteKey)` filter | CRAWL-004/005 |
| I15 | ≤ 15 posts, ≤ 30 candidates, sitemap order | `PostSelectionService` constants from contracts | CRAWL-006 |
| I16 | Every considered candidate is an item; a crawled item references its page | `crawl_run_items` PK + CHECKs | CLIENT-007, CRAWL-007 |
| I17 | No outbound request reaches a private, loopback, link-local or metadata address, on any hop | `guardedLookup` in the undici `Agent` (connect-time check of the resolved address) + scheme/credential/IP-literal checks per hop | REMOTE-001 |
| I18 | Every outbound request is bounded: 10 s, ≤ 5 redirects, size caps, ≤ 2 retries on 429/5xx/network only | `RemoteApiCore` + `UndiciHttpTransport` | REMOTE-002/003 |
| I19 | Re-crawl deletes no page and no pair; what is shown is the client's latest succeeded/partial run | upsert-only repositories; `last_seen_run_id = currentRun.id` in every owned read | CRAWL-009 |
| I20 | Issues use only catalogued codes; every catalogued code has a rule | `SEO_RULES: Record<TSeoIssueCode, ISeoRule>` (compile-time completeness) + runtime test | ANALYSIS-001 |
| I21 | One issue per (page, code); relevance in (0, 1] | `seo_issues_page_id_code_uq`, `page_keywords_relevance_range` | ANALYSIS-005 |
| I22 | A snapshot belongs to an existing page-keyword pair; position 1..100 | composite FK, CHECK | PAGES-001 |
| I23 | Every instant is `timestamptz` | existing ESLint selector in `be/eslint.config.mjs` | TZ-001 |
| I24 | A user's calendar range maps to `[from 00:00, to+1 00:00)` in the user's zone | `dayRangeToUtc` in `@app/contracts`, the only conversion on the backend | TZ-002 |
| I25 | Seeded snapshots are at 12:00 UTC, never in the future; ≥ 50 000 rows; re-run adds no duplicates | generator + `ON CONFLICT DO NOTHING` on the PK + the seed's own final assertion | SEED-003/004 |
| I26 | Dates on screen are rendered in the user's zone from the session, never the browser's | `formatInZone(instant, timeZone)` is the only formatter; ViewModels pass `session.user.timeZone` | TZ-004 |
| I27 | Every gateway response is parsed; FE schemas match the contract types | `ABaseGateway.request` parses; each schema declared `z.ZodType<IContractShape>` | GATEWAY-001 |
| I28 | Every crawl status has exactly one colour | `crawlStatusColor: Record<TCrawlRunStatus, MantineColor>` | SHELL-004 |

## 5. Wire contract (`@app/contracts`)

Everything here is **new** under `packages/contracts/src/domain/<domain>/`, one file per kind
(`skills/be-canonical-fe-mirror`), listed in `src/index.ts` with the `.js` suffix the barrel
uses. A tested util gets its own folder with its `*.test.ts`. Dates on the wire are ISO-8601 UTC
strings; calendar days are `TIsoDay` (`YYYY-MM-DD`).

| file | content |
| --- | --- |
| `http/api-error-code.constant.ts` | `API_ERROR_CODES` = INVALID_CREDENTIALS, SESSION_REQUIRED, JSON_REQUIRED, INVALID_WEBSITE_URL, CLIENT_ALREADY_EXISTS, CLIENT_NOT_FOUND, CRAWL_ALREADY_ACTIVE, CRAWL_RUN_NOT_FOUND, PAGE_NOT_FOUND, INVALID_DATE_RANGE; `TApiErrorCode` |
| `auth/session-user.interface.ts` | `ISessionUser { id: number; email: string; timeZone: string }` |
| `auth/login-request.interface.ts` | `ILoginRequest { email: string; password: string }` |
| `clients/website-url/parse-website-url.util.ts` (+test) | `parseWebsiteUrl(input: string): { ok: true; origin: string; siteKey: string } \| { ok: false; reason: TWebsiteUrlRejection }` — D9, used by the backend DTO/service AND by the frontend to locate the existing client on a 409 |
| `clients/site-key/is-same-site.util.ts` (+test) | `isSameSite(url: string, siteKey: string): boolean` |
| `clients/client.interface.ts` | `IClient { id; name; websiteUrl; siteKey; currentPageCount: number; latestRun: ICrawlRunSummary \| null; createdAt }` |
| `clients/create-client-request.interface.ts` | `ICreateClientRequest { name; websiteUrl }` |
| `crawl/crawl-run-status.enum.ts` | `CRAWL_RUN_STATUSES` tuple + `TCrawlRunStatus`; `ACTIVE_CRAWL_RUN_STATUSES` |
| `crawl/crawl-trigger.enum.ts` | `CRAWL_TRIGGERS` (`seed`, `user`) |
| `crawl/crawl-item-status.enum.ts` | `CRAWL_ITEM_STATUSES` |
| `crawl/crawl-limits.constant.ts` | `CRAWL_POST_LIMIT = 15`, `CRAWL_CANDIDATE_LIMIT = 30` |
| `crawl/crawl-run-error.constant.ts` | `CRAWL_RUN_ERRORS: Record<code, { message }>` — SITEMAP_NOT_FOUND, BLOG_SITEMAP_NOT_FOUND, SITE_UNREACHABLE, NO_POSTS_CRAWLED, CRAWL_ABANDONED, CRAWL_INTERNAL_ERROR |
| `crawl/crawl-run-summary.interface.ts` | `ICrawlRunSummary { id; status; trigger; pagesFound; pagesDone; errorCode: string \| null; errorMessage: string \| null; createdAt; startedAt \| null; finishedAt \| null }` |
| `crawl/crawl-run-detail.interface.ts` | `ICrawlRunDetail extends ICrawlRunSummary { clientId; sitemapUrl \| null; selectionReason \| null; items: ICrawlRunItem[] }` |
| `crawl/crawl-run-item.interface.ts` | `{ sitemapPosition; url; status; reason \| null; httpStatus \| null; pageId \| null }` |
| `seo/seo-issue-severity.enum.ts` | `SEO_ISSUE_SEVERITIES` (`error`, `warning`, `notice`) |
| `seo/seo-issue-catalogue.constant.ts` | `SEO_ISSUE_CATALOGUE = { TITLE_MISSING: { severity: 'error', label: 'Title is missing' }, TITLE_LENGTH: { severity: 'warning', label: …, min: 30, max: 60 }, … } as const satisfies Record<string, ISeoIssueDefinition>`; `TSeoIssueCode = keyof typeof SEO_ISSUE_CATALOGUE`. Thresholds live here (D16) |
| `seo/seo-issue.interface.ts` | `ISeoIssue { code: TSeoIssueCode; severity; details: Record<string, unknown> }` |
| `pages/keyword-position.interface.ts` | `IKeywordPosition { keywordId; term; relevance; latestPosition: number \| null; latestCapturedAt: string \| null }` |
| `pages/best-position.interface.ts` | `IBestPosition { position; keywordId; term; capturedAt }` |
| `pages/page-list-item.interface.ts` | `IPageListItem { id; url; title \| null; client: { id; name }; keywords: IKeywordPosition[]; bestPosition: IBestPosition \| null; issues: { total; error; warning; notice }; lastCapturedAt: string \| null }` |
| `pages/page-list-response.interface.ts` | `IPageListResponse { items; page; pageSize; total }` |
| `pages/page-list-limits.constant.ts` | `PAGE_SIZE_OPTIONS = [20, 50]`, `MAX_PAGE_SIZE = 50`, `DEFAULT_PAGE_SIZE = 20` |
| `pages/page-detail.interface.ts` | `IPageDetail { page: { id; url; finalUrl; title; metaDescription; h1; lang; wordCount; httpStatus; crawledAt }; client: { id; name; websiteUrl }; keywords: IKeywordPosition[]; bestPosition \| null; issues: ISeoIssue[]; lastCrawl: ICrawlRunSummary \| null }` |
| `pages/position-history.interface.ts` | `IPositionHistory { from: TIsoDay; to: TIsoDay; timeZone; series: { keywordId; term; points: { capturedAt; position }[] }[] }` (D13) |
| `time/iso-day.type.ts` | `TIsoDay = \`${number}-${number}-${number}\`` |
| `time/history-range.constant.ts` | `DEFAULT_HISTORY_DAYS = 30`, `MAX_HISTORY_DAYS = 366` |
| `time/day-range-to-utc/day-range-to-utc.util.ts` (+test) | `dayRangeToUtc(from, to, timeZone): { fromUtc: string; toUtcExclusive: string }` |
| `time/today-in-zone/today-in-zone.util.ts` (+test) | `todayInZone(now: Date, timeZone): TIsoDay` |
| `time/add-days/add-days.util.ts` (+test) | `addDays(day, n): TIsoDay` — calendar arithmetic, no zone |
| `time/is-iso-day/is-iso-day.util.ts` (+test) | real-calendar validation (`2026-02-30` is false) |
| `time/is-time-zone/is-time-zone.util.ts` (+test) | `Intl.DateTimeFormat` accepts it |

**Ships together.** A contracts change and its first consumer land in one commit; `pnpm
typecheck` builds the package first and fails both sides on drift. A response field change ships
with the FE zod schema in the same commit (`skills/fe-be-roundtrip` §3). Phases 2–6 add contracts
the frontend does not read until phase 7; that is safe because nothing consumes them yet.

## 6. API surface

All under `/api`. "Scoped" = repository SQL filters by `scope.userId`; every `:id` is parsed with
`ParseIntPipe` (a non-numeric id is a 400 `BAD_REQUEST`, which reveals nothing about ownership).

| route | auth | request | 2xx | errors |
| --- | --- | --- | --- | --- |
| `GET /health` | `@Public` | — | 200 `IHealthResponse` (unchanged) | 503 |
| `POST /auth/login` | `@Public`, throttled | `LoginDto { email: IsEmail, max 254; password: IsString, 1..200 }` | 200 `{ user: ISessionUser }` + `Set-Cookie: sid` | 400, 401 INVALID_CREDENTIALS, 415, 429 |
| `POST /auth/logout` | session | — (no body) | 204, cookie cleared | 401 |
| `GET /auth/me` | session | — | 200 `{ user: ISessionUser }` | 401 |
| `GET /clients` | scoped | — | 200 `{ items: IClient[] }`, by name then id | 401 |
| `POST /clients` | scoped, throttled | `CreateClientDto { name: trim, 1..120; websiteUrl: IsString, max 2048 }` — the URL rule is `parseWebsiteUrl` in the service, so one rule decides | 201 `{ client: IClient }` (latestRun queued) | 400 INVALID_WEBSITE_URL, 409 CLIENT_ALREADY_EXISTS, 415, 429 |
| `GET /clients/:id` | scoped | — | 200 `{ client: IClient }` (D22 polling) | 404 CLIENT_NOT_FOUND |
| `POST /clients/:id/crawl-runs` | scoped, throttled | — | 201 `{ run: ICrawlRunSummary }` | 404, 409 CRAWL_ALREADY_ACTIVE, 429 |
| `GET /crawl-runs/:id` | scoped via client | — | 200 `{ run: ICrawlRunDetail }` (items ≤ 30) | 404 CRAWL_RUN_NOT_FOUND |
| `GET /pages` | scoped | `ListPagesQueryDto { clientId?: Int ≥1; q?: trim, 1..200; page = 1, Int ≥1; pageSize = 20, Int 1..50 }` | 200 `IPageListResponse` | 400, 404 CLIENT_NOT_FOUND (foreign/missing `clientId`) |
| `GET /pages/:id` | scoped | — | 200 `IPageDetail` | 404 PAGE_NOT_FOUND |
| `GET /pages/:id/positions` | scoped | `PositionsQueryDto { from?: TIsoDay; to?: TIsoDay }` | 200 `IPositionHistory` | 400 INVALID_DATE_RANGE / BAD_REQUEST, 404 |

`/pages/:id` returns a page only if it is current (P9); a page that dropped out of the latest
run answers 404 like any other unreachable id.

**Not added, deliberately:** sign-up, password reset, profile/time-zone editing (the zone is
seeded; D3); deleting or renaming a client; cancelling a run; listing past runs (only the
latest run's log is shown; history survives in the table); sorting the pages list by position
(D7's reopen trigger); SSE (D22); any endpoint taking `userId` from a request. `GET /clients` is
not paginated: a user's clients are a handful and the clients table shows them all — reopen at
100 clients per user (Q10).

**Rate limits** (`@nestjs/throttler`, in-memory, Q8): login 10 per minute per IP + lower-cased
email; `POST /clients` and `POST /clients/:id/crawl-runs` 10 per minute per user. Constants in
`be/src/modules/auth/constants/throttle.constant.ts` and `be/src/modules/clients/constants/`.

## 7. Services and modules

Module graph (no cycles, no `forwardRef`): `auth` ← nothing; `clients` → nothing;
`pages` → `clients`; `page-analysis` → nothing; `crawl` → `clients`, `pages`, `page-analysis`,
`infrastructure/remote-api`; `seed` (not a module, a CLI context) → `auth`, `clients`, `crawl`,
`pages`. A repository may JOIN another module's table **only to scope or to decide currentness**
(`clients.user_id`, the current `crawl_runs` row) — reading another module's data for its own
sake goes through that module's exported service (`practices/be/nestjs/cross-module-dependencies`).

### 7.1 Shared and core (new)

| path | what | why there |
| --- | --- | --- |
| `be/src/shared/user-scope/user-scope.interface.ts` | `IUserScope { readonly userId: number; readonly timeZone: string; readonly [userScopeBrand]: true }` | used by every module's repositories; pure type |
| `be/src/core/decorators/public/public.decorator.ts` | `@Public()` + `IS_PUBLIC_KEY` | Nest primitive with no module dependency |
| `be/src/core/decorators/current-scope/current-scope.decorator.ts` | `@CurrentScope()` reads `request.userScope` | same |
| `be/src/core/middleware/json-only/json-only.middleware.ts` (+spec) | 415 for POST/PUT/PATCH/DELETE carrying a body that is not `application/json` | HTTP plumbing; wired in `configureApp` so the e2e harness has it |
| `be/src/core/utils/escape-like/escape-like.util.ts` (+spec) | escapes `\`, `%`, `_` | SQL plumbing used by a repository |
| `be/src/persistence/connections/postgres/transaction-runner/transaction-runner.ts` | `TransactionRunner.run<T>(cb: (tx: Transaction) => Promise<T>)` | lets services open a transaction without importing Drizzle (ESLint) |
| `be/src/persistence/migrations/run-migrations/run-migrations.ts` | `runMigrations(databaseUrl)` extracted from `migrate.ts` | `migrate.ts` and the DB-test global setup share one implementation |

`configureApp` (existing) gains `cookie-parser` and `jsonOnlyMiddleware`.

### 7.2 `be/src/modules/auth/` (new)

- `AuthController` — login, logout, me.
- `AuthService` — `signIn(email, password, ip)`: normalizes email, verifies via `PasswordHasher`
  (against `DUMMY_PASSWORD_HASH` when the user is unknown), purges expired sessions, creates a
  session, returns `{ user, token }`; `signOut(token)`; `resolveSession(token)` → user or null,
  sliding the expiry at most once per `SESSION_TOUCH_INTERVAL_MS`.
- `PasswordHasher` (`services/password-hasher/`) — `hash(password, params = SCRYPT_PARAMS)` and
  `verify(password, stored)`; `SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1, saltBytes: 16, keyLen: 64,
  maxmem: 256 * 1024 * 1024 }` — **`maxmem` is mandatory**: N·r·128 = 128 MiB exceeds Node's 32
  MiB default and `scrypt` throws without it.
- `session-token.ts` (pure) — `generateSessionToken()` (32 random bytes, base64url),
  `hashSessionToken(token)` (sha256 Buffer).
- `UsersRepository`, `SessionsRepository`.
- `SessionGuard` (`guards/session/session.guard.ts`) — registered as `APP_GUARD` in
  `AuthModule.providers` (core cannot import modules); reads `sid`, resolves, attaches
  `request.userScope = createUserScope(user)`, re-issues the cookie when the expiry slid.
- `create-user-scope.ts` (`guards/session/`) — the only file allowed to write `as IUserScope`.
- `UserAccountsService` (exported) — `upsertUserForWorker({ email, password, timeZone })` for the
  seed.
- `constants/session.constant.ts` — `SESSION_COOKIE_NAME = 'sid'`, `SESSION_TTL_MS = 7 days`,
  `SESSION_TOUCH_INTERVAL_MS = 60 s`. `constants/auth-errors.constant.ts`, `exceptions/`.

### 7.3 `be/src/modules/clients/` (new) — owns `clients`, `crawl_runs`, `crawl_run_items`

- `ClientsController` (`/clients`), `CrawlRunsController` (`/crawl-runs/:id`).
- `ClientsService` — `listClients(scope)`, `getClient(scope, id)`, `addClient(scope, dto)`
  (parse URL → one transaction: insert client, insert queued run with `trigger: 'user'`,
  `pg_notify('crawl_run_queued', runId)`; 23505 on `clients_user_id_site_key_uq` → 409),
  `requestRecrawl(scope, clientId)` (insert queued run; 23505 on the partial index → 409),
  `getRunDetail(scope, runId)`, `getLatestRunSummary(scope, clientId)` (exported, used by pages).
- `ClientCrawlRunsService` (exported, worker/seed API, every method `…ForWorker`):
  `claimNextForWorker(leaseMs)`, `renewLeaseForWorker(runId, attempt, leaseMs)`,
  `failAbandonedForWorker()`, `getRunTargetForWorker(runId)` → `{ clientId, websiteUrl,
  siteKey }`, `recordDiscoveryForWorker(runId, attempt, { sitemapUrl, selectionReason,
  pagesFound })`, `recordProgressForWorker(runId, attempt, pagesDone)`,
  `lockForFinalizeForWorker(tx, runId, attempt)` → boolean,
  `finalizeForWorker(tx, runId, { status, pagesDone, errorCode, errorMessage, items })`,
  `enqueueForWorker(clientId, trigger)` (seed), `findClientIdsWithoutSuccessForWorker(ids)`.
- Repositories: `ClientsRepository`, `CrawlRunsRepository`, `CrawlRunItemsRepository`.
- `constants/clients-errors.constant.ts` (codes from `API_ERROR_CODES`), `exceptions/`.

### 7.4 `be/src/infrastructure/remote-api/` (new) — outbound HTTP (`practices/be/remote-api-core`)

- `http-transport/http-transport.interface.ts` — `IHttpTransport.send({ url, headers, signal,
  maxBytes }) → { status, headers, body: Buffer, ttfbMs, truncated }`, one hop, no redirect
  following; token `HTTP_TRANSPORT`.
- `undici-http-transport/undici-http-transport.ts` — `undici` `fetch` with an `Agent` whose
  `connect.lookup` is `guardedLookup` (the connection goes to the address that was checked — no
  DNS rebinding window); `redirect: 'manual'`; streamed body aborted past `maxBytes`; gunzip for
  `.gz` sitemaps within the same cap (Q5).
- `address-guard/address-guard.ts` — `isPublicAddress(ip)`: refuses 0/8, 10/8, 100.64/10,
  127/8, 169.254/16, 172.16/12, 192.168/16, 224/4, 240/4, ::, ::1, fc00::/7, fe80::/10,
  IPv4-mapped forms of those.
- `guarded-lookup/guarded-lookup.ts` — wraps `dns.lookup` (all addresses), fails with
  `RemoteApiForbiddenAddressError` if any resolved address is not public.
- `remote-api.core.ts` — `RemoteApiCore`: per-hop URL check (http/https only, no credentials, no
  IP literal), ≤ 5 redirects, timeout 10 s per request (`AbortSignal.timeout`), retries 2 with
  `250 ms · 2^attempt + jitter` honouring `Retry-After` (capped at 10 s) on 429/5xx/network,
  `User-Agent: SeoKeywordTrackerBot/1.0 (+<repo URL>)`, logs method/host/status/duration/attempt.
- `remote-api.errors.ts` — `RemoteApiTimeoutError`, `RemoteApiUnavailableError`,
  `RemoteApiForbiddenAddressError`, `RemoteApiTooLargeError`, `RemoteApiTooManyRedirectsError`.
- `remote-api.module.ts` — provides `HTTP_TRANSPORT` → `UndiciHttpTransport`.
- `_testing/fixture-http-transport.ts` (+spec) — serves `be/test/fixtures/sites/` through a
  `manifest.json` (exact URL → file + status + headers + `ttfbMs`; pattern fallbacks that
  synthesize a minimal article for unrecorded post URLs); an unknown URL is a 404, never a
  network call.

### 7.5 `be/src/modules/crawl/` (new) — executes runs; owns no table

- `workers/crawl-worker/crawl-worker.ts` — `OnApplicationBootstrap` starts the loop when
  `CRAWL_WORKER_ENABLED=true`; two slots; each slot: `failAbandonedForWorker()`, claim, execute,
  repeat; idle → wait up to `CRAWL_POLL_INTERVAL_MS` (2 s) or a wake-up; heartbeat every 10 s
  renews a 60 s lease; `OnApplicationShutdown` stops claiming and aborts in-flight fetches (the
  lease then expires and another worker reclaims). Exposes `runOnce()` for tests and the seed.
  `workers/` is outside the folder vocabulary on purpose: a long-running loop is neither a
  controller nor a schedule.
- `workers/crawl-wakeup/crawl-wakeup.listener.ts` — a dedicated `pg` client `LISTEN
  crawl_run_queued`; NOTIFY is delivered only on commit, so a wake-up never precedes the row.
- `services/crawl-run-executor/crawl-run-executor.service.ts` — discovery → selection/fetch
  (progress recorded) → analysis (pure, outside any transaction) → finalize transaction
  (fencing lock, `CrawlResultsService.applyRunResultsForWorker`, items, status).
- `services/site-http-client/site-http-client.ts` — `extends RemoteApiCore`: `getRobots`,
  `getSitemap`, `getFeed`, `getHomeHtml`, `getPostHtml` with per-kind caps (HTML 5 MB, sitemap
  10 MB parsed / 50 MB compressed).
- `services/robots-policy/robots-policy.ts` — `robots-parser` wrapper (Q6); missing robots.txt =
  everything allowed.
- `services/sitemap-parser/sitemap-parser.ts` — `fast-xml-parser`: `urlset` → URLs in order;
  `sitemapindex` → child sitemaps in order.
- `services/feed-discovery/feed-discovery.service.ts` — §10.1.
- `services/sitemap-scoring/sitemap-scoring.ts` — pure scoring and grouping, §10.1.
- `services/sitemap-discovery/sitemap-discovery.service.ts` — orchestrates §10.1.
- `services/post-selection/post-selection.service.ts` — §10.2.
- `constants/sitemap-scoring.constant.ts`, `constants/crawl-worker.constant.ts`.

### 7.6 `be/src/modules/page-analysis/` (new) — pure business opinions behind one injectable

- `services/page-analysis/page-analysis.service.ts` — `analyseRun(parsedPages[], siteKey) →
  per page { keywords, issues }`.
- `services/html-extraction/extract-page.ts` — `extractPage(html, finalUrl, headers) →
  IParsedPage` (cheerio; title from `head > title` only).
- `services/keyword-extraction/` — `tokenize/`, `stop-words/`, `collect-candidates/`,
  `score-candidates/`, `select-keywords/`, `extract-keywords/` (each its own folder + spec).
- `services/seo-rules/seo-rules.registry.ts` — `SEO_RULES: Record<TSeoIssueCode, ISeoRule>`;
  rule groups `rules/title-rules/`, `rules/meta-rules/`, `rules/heading-rules/`,
  `rules/indexing-rules/`, `rules/content-rules/`, `rules/transport-rules/`,
  `rules/keyword-rules/`, each a file of pure functions with a table-driven spec.
- `constants/keyword-scoring.constant.ts` — every tunable in §10.4.

### 7.7 `be/src/modules/pages/` (new) — owns `pages`, `keywords`, `page_keywords`, `seo_issues`, `rank_snapshots`

- `PagesController` — list, detail, positions.
- `PageReadService` — `listPages(scope, query)` (four statements: slice, total, keywords with
  LATERAL latest, issue counts — never a per-row loop), `getPage(scope, id)`.
- `PositionHistoryService` — `getHistory(scope, pageId, from?, to?)`: range rules (§10.6),
  `dayRangeToUtc`, one PK range scan.
- `services/best-position/pick-best-position.ts` (pure) — D6.
- `CrawlResultsService` (exported) — `applyRunResultsForWorker(tx, runId, clientId, results)`:
  upsert pages, upsert keywords by term, upsert page_keywords (relevance, `last_seen_run_id`),
  replace issues of each re-fetched page; returns the page ids by URL for the items.
- `PositionSeedService` (exported) — `listCurrentPairsForWorker()` (each with its last snapshot),
  `insertSnapshotsForWorker(rows)` (chunks of 5 000, `ON CONFLICT DO NOTHING`),
  `countSnapshotsForWorker()`.
- Repositories: `PagesRepository`, `PageListRepository` (the list's four queries),
  `KeywordsRepository`, `PageKeywordsRepository`, `SeoIssuesRepository`,
  `RankSnapshotsRepository`.

### 7.8 `be/src/seed/` (new; ESLint already exempts `src/seed/**` from `no-console`)

- `seed.ts` — CLI: `NestFactory.createApplicationContext(SeedModule)`, runs `SeedRunner`, exits
  non-zero on any failed step; `--positions-only`.
- `seed.module.ts` — `ConfigModule`, `LoggerModule`, `DatabaseModule`, `AuthModule`,
  `ClientsModule`, `PagesModule`, `CrawlModule` (its worker enabled in this process).
- `seed-runner/seed-runner.service.ts` — §10.5.
- `seed-accounts.constant.ts` — the two emails, client names, website URLs, `America/Toronto`.
  Data, not logic: the crawl code never sees a site name.
- `position-generator/` — `hash-seed/`, `prng/`, `baseline/`, `generate-positions/`,
  `history-days/` (pure, each + spec), §10.5.

### 7.9 Env (`be/src/infrastructure/config/`)

`EnvKeys` and `envSchema` gain `CRAWL_WORKER_ENABLED` (`'true' | 'false'`, optional, default
false in code; compose sets it true for `be` and `seed`). `SEED_USER_PASSWORD` is read and
validated by `seed.ts` only (min 8 chars), not by the API. `TEST_DATABASE_URL` is read only by
the DB-test global setup. Tunables are constants, not env.

## 8. Error catalogue

| errorCode | HTTP | when | the copy's job |
| --- | --- | --- | --- |
| `BAD_REQUEST` | 400 | DTO validation (filter-built from Nest's 400) | name the field; FE shows it at the form |
| `INVALID_WEBSITE_URL` | 400 | `parseWebsiteUrl` refused (scheme, credentials, IP literal, localhost, no dot) | say what a valid address looks like |
| `INVALID_DATE_RANGE` | 400 | from > to, span > 366 days, from after today | say the allowed range |
| `INVALID_CREDENTIALS` | 401 | unknown email or wrong password — one message | never reveal which |
| `SESSION_REQUIRED` | 401 | no, unknown or expired session | none shown; FE signs out and redirects |
| `CLIENT_NOT_FOUND` / `PAGE_NOT_FOUND` / `CRAWL_RUN_NOT_FOUND` | 404 | missing **or foreign** | identical for both (P3) |
| `CLIENT_ALREADY_EXISTS` | 409 | same site key for this user, including a concurrent insert (23505) | "You already track this site" |
| `CRAWL_ALREADY_ACTIVE` | 409 | a queued/running run exists (23505 on the partial index) | "A crawl is already running" |
| `JSON_REQUIRED` | 415 | mutating request with a non-JSON body | developer-facing |
| `TOO_MANY_REQUESTS` | 429 | throttler (filter maps `HttpStatus[429]`) | "Try again in a minute" |
| `INTERNAL_ERROR` | 500 | anything else; masked by `SecureExceptionsFilter` | generic |

Crawl-run error codes are data on the run, not HTTP answers: `SITEMAP_NOT_FOUND`,
`BLOG_SITEMAP_NOT_FOUND`, `SITE_UNREACHABLE`, `NO_POSTS_CRAWLED`, `CRAWL_ABANDONED` (attempts
exhausted), `CRAWL_INTERNAL_ERROR`; messages in `CRAWL_RUN_ERRORS` (contracts), which the FE
banner and run log show verbatim. `partial` carries no error code; its sentence is derived from
`pagesDone` and `CRAWL_POST_LIMIT`.

The codes are declared once in `API_ERROR_CODES`; each module's `constants/*-errors.constant.ts`
builds its `{ code, message }` entries from it, and `createException()` builds the classes from
those entries — the catalogue is executed (P11). The FE branches only on these constants.

## 9. Background work

**The queue is `crawl_runs` (D19).** Claim, in one statement:

```sql
UPDATE crawl_runs
SET status = 'running', attempts = attempts + 1,
    locked_until = now() + make_interval(secs => $lease),
    started_at = coalesce(started_at, now())
WHERE id = (
  SELECT id FROM crawl_runs
  WHERE (status = 'queued' OR (status = 'running' AND locked_until < now()))
    AND attempts < 3
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1)
RETURNING *;
```

`failAbandonedForWorker()` runs before each claim: running runs with an expired lease and
`attempts >= 3` become `failed / CRAWL_ABANDONED` with `finished_at = now()`. Heartbeat and
progress updates carry `AND attempts = $attempt`, so a superseded executor's writes affect zero
rows; it notices and stops.

**Finalize (P8)** — one transaction, after all fetching and the pure analysis are done:
1. `SELECT … FROM crawl_runs WHERE id = $run AND status = 'running' AND attempts = $attempt FOR
   UPDATE` — no row: roll back, log, stop (a newer attempt owns the run).
2. `CrawlResultsService.applyRunResultsForWorker` (pages, keywords, page_keywords, issues).
3. Insert `crawl_run_items` (delete-then-insert for this run id, because an earlier attempt of
   the same run may have finalized nothing but the PK makes a retry safe either way).
4. Set `status`, `pages_done`, `error_code`, `error_message`, `finished_at`, `locked_until =
   null`.

A discovery failure finalizes `failed` with its error code and whatever items exist (none).
An unexpected exception inside the executor finalizes `failed / CRAWL_INTERNAL_ERROR` when the
fencing lock still holds; if the process dies, the lease expires and the run is reclaimed.

**External fetch failure.** A failed post fetch is an item (`failed`, http status, reason) and
the next candidate is tried. robots.txt unreachable (5xx/timeout) → treated as allow-all and
logged; home page unreachable → feed discovery falls back to the well-known paths; every sitemap
unreachable → `SITEMAP_NOT_FOUND` (or `SITE_UNREACHABLE` when robots.txt, the home page and all
well-known sitemap paths fail at the network level).

**Who runs the worker.** The `be` service with `CRAWL_WORKER_ENABLED=true`; the seed process
runs its own worker in-process. Both claim with `SKIP LOCKED`, so either may execute a seed run;
the seed waits on the run's status, not on its own worker.

## 10. Algorithms

### 10.1 Blog sitemap discovery (D14)

Input: `websiteUrl`, `siteKey`. Output: `{ sitemapUrls: string[] (one group, in index order),
urls: string[] (concatenated, same-site, deduplicated, order kept), reason }` or a failure code.

1. **Sitemaps.** robots.txt `Sitemap:` lines (same-site only); if none, try in order
   `/sitemap.xml`, `/sitemap_index.xml`, `/wp-sitemap.xml`, `/sitemap-index.xml`, `/sitemap/`.
   Expand every `sitemapindex` recursively, depth ≤ `SITEMAP_MAX_DEPTH = 3`, total fetches ≤
   `SITEMAP_MAX_FETCHES = 50`; `.gz` decompressed. Children whose URL is not same-site are
   dropped unfetched (semrush's index lists `de.semrush.com/...`; those are other sites under
   D9). Leaf candidates are fetched in descending **name score** order so the budget is spent on
   likely blogs first. None at all → `SITEMAP_NOT_FOUND`.
2. **Feed.** `<link rel="alternate" type="application/rss+xml|application/atom+xml">` on the home
   page (yoast advertises `/feed/`), else `/feed/`, `/blog/feed/`, `/rss.xml` (semrush's
   `/blog/feed/` is found here). The feed's item links (same-site) form `feedUrls`; no feed →
   empty set.
3. **Grouping.** Numbered siblings form one candidate: the group key is the sitemap file name
   with trailing digits before the extension removed (`post-sitemap2.xml` → `post-sitemap.xml`);
   the group's URLs are the members' URLs concatenated in index order.
4. **Score** per group = `nameScore + pathShareScore + feedShareScore`:
   - `nameScore`: tokens of the sitemap path (split on non-alphanumerics): `blog` +3; `post`,
     `posts`, `article`, `articles` +2; `news` +1; any of `page`, `pages`, `product`,
     `products`, `category`, `categories`, `tag`, `tags`, `author`, `authors`, `video`, `videos`,
     `image`, `images`, `attachment`, `media`, `portfolio`, `event`, `events`, `job`, `jobs`,
     `location`, `locations`, `shop`, `store` −3 (applied once).
   - `pathShareScore` = 3 × the largest share of the group's URLs whose first path segment is
     one of `blog`, `news`, `articles`.
   - `feedShareScore` = 4 × |feedUrls ∩ groupUrls| / |feedUrls| (0 when no feed).
   - `BLOG_SITEMAP_MIN_SCORE = 2`; ties: higher score, then more URLs, then index order.
     Below the threshold → `BLOG_SITEMAP_NOT_FOUND`.
   - Expected on the fixtures: semrush `blog/sitemap/` ≈ 3 + 3 + 4; yoast `post-sitemap` group
     ≈ 2 + 0 + 4, `page-sitemap` ≈ −3; a root-level post sitemap without a feed = 2 (selected);
     a pages-only `sitemap.xml` = 0 (refused).
5. `selection_reason` records the winning terms; `pages_found` = |urls|.

No page is fetched before step 4 ends (I14). Rejected: name + path only, content sampling,
HTML/feed fallbacks without a sitemap (D14, D29).

### 10.2 Post selection (D14, D21, D33)

Walk `urls` in order, position by position, in windows of `CRAWL_FETCH_CONCURRENCY = 3`, until
15 items are `crawled` or 30 candidates have been considered:

| check (in order) | item status | reason |
| --- | --- | --- |
| not same-site (pre-fetch) | `skipped_other_site` | "Belongs to another site" |
| path is `/` (site root) | `skipped_listing` | "The site's home page" |
| extension is a known non-HTML type (`.pdf .jpg .png .gif .webp .svg .zip .xml .mp4 …`) | `skipped_not_html` | "Not an HTML page (.pdf)" |
| robots.txt disallows | `skipped_robots` | "Disallowed by robots.txt" |
| fetch fails after retries / status ≥ 400 | `failed` | "HTTP 404" / "Timed out" |
| redirect ends on another site | `skipped_other_site` | "Redirects to another site" |
| `Content-Type` not `text/html` | `skipped_not_html` | "Not HTML (application/pdf)" |
| JSON-LD `@type` includes `CollectionPage` or `ItemList` | `skipped_listing` | "Declares itself a listing (JSON-LD CollectionPage)" |
| otherwise | `crawled` | — |

Results of a window are applied in position order; when the 15th `crawled` is reached, the rest
of that window is discarded and not recorded, so the log ends at the cut. An unmarked page counts
as a post. Status: 15 crawled → `succeeded`; 1–14 → `partial`; 0 → `failed / NO_POSTS_CRAWLED`.
Yoast's first sitemap entry `https://yoast.com/seo-blog/` (JSON-LD `CollectionPage`) is
`skipped_listing`; the README names this interpretation and points at the run log (D32, D34).

### 10.3 Page extraction

`extractPage` (cheerio): title = text of the first `head > title` (never an SVG `<title>` in the
body — semrush has one); meta description, robots meta, canonical, `og:*`, `article:tag`, JSON-LD
blocks (parsed defensively; `@graph` flattened), `<html lang>`; main content = `main` or
`article` (first match, else `body`) with `nav, header, footer, aside, script, style, noscript,
form, svg, iframe` removed; headings in document order; first paragraph; images in main with
their `alt`; word count of main text.

### 10.4 Keyword extraction (D15)

1. **Normalize**: NFKC, lower case, punctuation stripped to spaces, whitespace collapsed.
2. **Tokens**: Unicode letters/digits, length ≥ 2, not digits-only.
3. **Stop words** by the primary subtag of `<html lang>` (`stopword` package lists, Q7); unknown
   or missing language → no stop words and `MAX_NGRAM_UNKNOWN_LANG = 2`.
4. **Candidates**: 1–3-grams (`MAX_NGRAM = 3`) from the main content and each field, never
   starting or ending with a stop word, never crossing a sentence or heading boundary.
5. **Fields and weights** (`FIELD_WEIGHTS`): title 5 (brand suffix removed: the last segment
   after ` | `, ` - `, ` – `, ` — `, ` · ` when it contains the site key's first label or
   `og:site_name`), h1 4, URL slug 3, meta description 2, h2/h3 2, first paragraph 1.5, body 1.
   Field contribution = weight × presence for every field except body; body = 1 × ln(1 + tf).
6. **Multi-field bonus**: × (1 + `MULTI_FIELD_BONUS` 0.25 × (strong fields present − 1)), strong =
   title, h1, slug, meta, h2/h3.
7. **Declared metadata bonus**: × `METADATA_BONUS` 1.15 when the candidate equals or is contained
   in a JSON-LD `keywords` entry or an `article:tag` (yoast posts carry JSON-LD keywords).
8. **N-gram preference**: × 1.0 / 1.15 / 1.1 for 1 / 2 / 3 tokens (`NGRAM_FACTOR`).
9. **IDF penalty over the run's pages**: × ln(1 + N / df) / ln(1 + N), N = pages in the run, df
   = pages containing the candidate (N = 1 → factor 1). Site-wide terms ("semrush", "yoast seo")
   fade.
10. **Subsumption**: a candidate contained in a higher-ranked longer candidate whose score is ≥
    `SUBSUME_RATIO` 0.8 × its own is dropped.
11. **Selection**: sort by score; keep up to `MAX_KEYWORDS` 8 with score ≥ `FLOOR_RATIO` 0.25 ×
    top; if fewer than `MIN_KEYWORDS` 5 pass, fill up to 5 from the next best with score > 0.
    `relevance = score / topScore` (top = 1).

Computed once per run after all pages are fetched (step 9 needs the whole run). Rejected:
weights only, YAKE/RAKE, plain TF-IDF, LLM/SERP APIs (D15).

### 10.5 Seed and positions (D17, D18, D27)

`SeedRunner.run({ positionsOnly })`:
1. Upsert the two users (`UserAccountsService.upsertUserForWorker`, password from
   `SEED_USER_PASSWORD`, zone `America/Toronto`) and their clients (upsert on
   `(user_id, site_key)`).
2. For each seed client without a succeeded/partial run: if an active run exists, wait for it;
   otherwise `enqueueForWorker(clientId, 'seed')`. Wait by polling the run every 2 s, with a
   `SEED_CRAWL_TIMEOUT_MS` = 10 min ceiling. `failed` → the seed exits 1 with the run's error
   code; `partial` → a warning, continue.
3. Positions: `listCurrentPairsForWorker()` returns every current pair in the database (UI-added
   clients included) with `(url, term, relevance, lastCapturedAt, lastPosition)`.
   `days = max(365, ceil(50 000 / pairCount))`; `end` = latest 12:00 UTC ≤ now. New pair: days
   `end − days + 1 … end`, starting at its baseline. Existing pair: `lastCapturedAt + 1 day …
   end`, continuing from `lastPosition`. Batches of 5 000, `ON CONFLICT DO NOTHING`.
4. Assert `countSnapshotsForWorker() >= 50 000`; else exit 1. Log users, runs, pairs, rows added.

Generator (pure):
- `hashSeed(url, term)` — 32-bit FNV-1a of `url + '\u0000' + term`.
- `prng(seed)` — mulberry32.
- `baseline(relevance, seed)` = clamp(1, 100, round(3 + (1 − r)^1.5 × 85 + u × 12)), u from the
  pair's PRNG: r = 1 → 3–15, r = 0.2 → ~64–76 (D17's "strong ~3–15, weak ~30–90").
- Step for day d: draw from `prng(hashSeed(url, term) ^ dayNumber(d))` — **each day's randomness
  depends only on the pair and the day**, so generating a→c in one call equals a→b then b→c
  continued from b's position (the property D18's fill-up relies on). `pos' = clamp(1, 100,
  round(pos + REVERT 0.15 × (base − pos) + noise ±2 + jump))`, jump ±5–15 with probability
  `JUMP_PROBABILITY` 0.02.

### 10.6 Ranges and zones (D2, D13)

`dayRangeToUtc(from, to, tz)`: `fromUtc` = the instant of 00:00 of `from` in `tz`;
`toUtcExclusive` = the instant of 00:00 of `addDays(to, 1)` in `tz`. The local-midnight instant is
found with `Intl.DateTimeFormat(…, { timeZone })` offset probing (two iterations cover a DST
change; 00:00 always exists in America/Toronto because its transitions are at 02:00). History
rules: missing `to` = `todayInZone(now, tz)`; missing `from` = `to − 29`; `to` after today →
today; `from > to` or `to − from + 1 > 366` → `INVALID_DATE_RANGE`. Query: `WHERE page_id = $id AND
captured_at >= $fromUtc AND captured_at < $toUtcExclusive` joined to the page's current pairs,
scoped, ordered by `keyword_id, captured_at`.

### 10.7 Pages list (D6, D7, D12)

Four statements per request (a `describe('cost')` test pins the count):
1. **Slice**: pages joined to clients (`user_id = scope`) and to the client's current run via a
   LATERAL `(… status in ('succeeded','partial') ORDER BY finished_at DESC, id DESC LIMIT 1)`,
   `p.last_seen_run_id = cur.id`, optional `clientId`, optional `q` → `p.url ILIKE $pat OR
   EXISTS (page_keywords current pairs ⨝ keywords WHERE term ILIKE $pat)` with `$pat =
   '%' || escapeLike(q) || '%'`, `ORDER BY c.name, c.id, p.sitemap_position, p.id LIMIT $n
   OFFSET $o`.
2. **Total**: the same filters, `count(*)`.
3. **Keywords**: current pairs of the slice's page ids (scoped again), each with `LEFT JOIN
   LATERAL (SELECT position, captured_at FROM rank_snapshots s WHERE s.page_id = pk.page_id AND
   s.keyword_id = pk.keyword_id ORDER BY captured_at DESC LIMIT 1)`.
4. **Issue counts**: by page and severity for the slice.

`pickBestPosition(keywords)`: the minimum `latestPosition`; ties → higher relevance, then term;
null when no keyword has a position. `lastCapturedAt` = the latest `latestCapturedAt`.

## 11. Scenario walkthroughs

**A. Adding Yoast from the UI.** The user submits "Yoast" / `yoast.com`. `parseWebsiteUrl` →
origin `https://yoast.com`, site key `yoast.com`. One transaction inserts the client and a queued
run and NOTIFYs; 201 returns the client with `latestRun.status = 'queued'`. The FE navigates to
`/pages?clientId=7`; the banner polls `GET /clients/7`. The worker wakes, claims (attempt 1),
reads robots.txt (`Sitemap: /sitemap_index.xml`), expands the index, scores `post-sitemap` +
`post-sitemap2` as one group (name +2, feed share +4), records discovery (`pages_found` ≈ 940).
Selection: position 0 `/seo-blog/` → `skipped_listing` (CollectionPage); positions 1… fetched three
at a time, `pages_done` rising. After 15 crawled: analysis over the 15 parsed pages; finalize
transaction (fencing lock holds) writes pages, keywords, pairs, issues, 16 items, `succeeded`.
The banner sees `succeeded`, the list refreshes, 15 rows appear with "—" positions ("appears
after the next seed run"). A second "Add" of `https://www.yoast.com/blog` → site key `yoast.com`
→ 409, the form links to client 7.

**B. A reclaimed run.** The API container is killed mid-crawl with run 12 at attempt 1. Its
lease expires after 60 s; the restarted worker's claim matches `status = 'running' AND
locked_until < now() AND attempts < 3`, sets attempt 2 and re-executes from scratch (page writes
are upserts, items are rewritten at finalize). Had the old process survived as a zombie and
reached finalize, its `… AND attempts = 1 FOR UPDATE` finds nothing and it rolls back. After a
third expiry `failAbandonedForWorker` marks the run `failed / CRAWL_ABANDONED`; the client can
re-crawl.

**C. History across DST for a Toronto user.** `GET /pages/42/positions?from=2026-11-01&to=2026-11-01`.
The scope carries `America/Toronto`. `dayRangeToUtc` → `[2026-11-01T04:00Z, 2026-11-02T05:00Z)`
— a 25-hour day, because clocks fall back at 02:00. The seeded point at `2026-11-01T12:00Z`
(07:00 EST, still Nov 1 in Toronto — the reason D2 captures at noon UTC) is inside; the points at `2026-10-31T12:00Z` and `2026-11-02T12:00Z` are
not. The FE plots the point on Nov 1 using `formatInZone(capturedAt, 'America/Toronto')`; a
reviewer whose laptop is in Tokyo sees the same date. A user B request for page 42 → 404, the same
body as `/pages/999999`.

## 12. Frontend

### 12.1 Stack additions (D24)

`@mantine/core`, `@mantine/hooks`, `@mantine/dates` + `dayjs`, `@mantine/notifications`,
`recharts`, `sass-embedded`; dev `postcss`, `postcss-preset-mantine`, `postcss-simple-vars`.
`fe/postcss.config.cjs` configures the preset; `fe/src/main.tsx` imports the Mantine stylesheets
and wraps the router in `MantineProvider` (theme from `Core/Configs/theme.ts`) and
`Notifications`. New styles are `*.module.scss` beside their component; `index.css` keeps the
tokens. `fe/vitest.setup.ts` stubs `window.matchMedia`, `ResizeObserver` and
`Element.prototype.scrollIntoView`. VERIFY: the Mantine major installed (v8 expected) — v8's date
components take `YYYY-MM-DD` strings, which is what `TIsoDay` already is; v7 takes `Date`s and
would need an adapter in the range picker.

### 12.2 Routes (`App/Router/router.tsx`)

```
root (errorComponent: RouteError, notFoundComponent: NotFound)
├── /sign-in              SignInScreen        beforeLoad: redirectIfSignedIn; search { redirect?: string }
└── app (pathless)        AppLayout           beforeLoad: requireSession(location)
    ├── /                 -> redirect /pages
    ├── /pages            PagesScreen         search PagesSearch { clientId?, q?, page=1, pageSize=20 }
    ├── /pages/$pageId    PageDetailScreen    search PageDetailSearch { range='30d' | 'custom', from?, to?, view='chart', hidden?: number[] }
    └── /clients          ClientsScreen       search ClientsSearch { expanded?: number }
```

Search schemas are zod with defaults and `.catch()` fallbacks (malformed → default, never a
throw), in `App/Router/SearchSchemas/<Name>/<name>.ts` with tests — beside the router rather than
inside it because a tested unit gets its own folder. `Modules/Home/`, `ViewModels/HealthViewModel/`
and `Gateways/HealthGateway/` are removed (the backend health endpoint stays for the compose
healthcheck).

### 12.3 Gateways

- `ABaseGateway.request` gains an option `{ notifyUnauthorized?: boolean }` (default true): on 401
  it calls `notifyUnauthorized()` from `Gateways/_Shared/Request/UnauthorizedSignal/unauthorizedSignal.ts`
  (a listener set) before throwing. The router module registers the one listener (clear the
  session store, reset the other stores, `navigate({ to: '/sign-in', search: { redirect } })`).
- `SessionGateway` — `login` (401 is an expected outcome → `{ kind: 'invalid' }`, 429 →
  `{ kind: 'throttled' }`, never notifies), `logout`, `me` (401 → `null`, never notifies).
- `ClientGateway` — `list`, `get`, `create` (409 → `{ kind: 'exists' }`, 400 INVALID_WEBSITE_URL →
  `{ kind: 'invalidUrl', message }`), `recrawl` (409 → `{ kind: 'active' }`), `getRun`.
- `PageGateway` — `list(query)`, `get(id)`, `positions(id, from, to)`.
- Schemas in `Validation/<Entity>Schemas.ts`, each declared `z.ZodType<IContractShape>` so a
  contract change that the schema does not follow fails `tsc`. `code` fields parse with
  `z.enum(Object.keys(SEO_ISSUE_CATALOGUE))`; an unknown code is a contract-drift error, not a
  blank cell.

### 12.4 ViewModels

| store | state | actions |
| --- | --- | --- |
| `SessionViewModel` | `user: ISessionUser \| null`, `status`, `actionError` | `fetchSession` (shares in-flight), `signIn`, `signOut` (calls the others' `reset()` — the sanctioned reach), `applySignedOut`, `reset` |
| `ClientsViewModel` | `clients`, `status`, `error`, `submitStatus`, `actionError`, `fieldErrors`, `runLogs: Record<runId, { status, run, error }>` | `fetchClients`, `refreshClients`, `addClient` (returns the new id for navigation), `recrawl`, `fetchRunLog`, `startPolling`/`stopPolling` (2 s while `hasActiveRun`), `clearActionError`, `reset` |
| `CrawlStatusViewModel` | `clientId`, `client`, `status`, `finishedAt` (when a run turned terminal under observation) | `startPolling(clientId)`, `stopPolling`, `reset` — polls `GET /clients/:id` every 2 s while active |
| `PagesViewModel` | `items`, `total`, `page`, `pageSize`, `status`, `error`, `isEmpty`, `emptyKind: 'noClients' \| 'noMatches' \| null` | `fetchPages(search)`, `refreshPages(search)`, `reset` |
| `PageDetailViewModel` | `detail`, `detailStatus`, `detailError`, `notFound`, `history`, `historyStatus`, `historyError` | `fetchDetail(id)`, `fetchHistory(id, range)`, `reset` |

Services (pure, tested): `ClientsViewModel/Services/summarizeClients` ("N pages across M
clients"), `hasActiveRun`, `findClientBySiteKey` (409 link, via `parseWebsiteUrl`);
`CrawlStatusViewModel/Services/describeRunProgress` (banner sentence from status, pagesDone,
pagesFound, `CRAWL_POST_LIMIT`, `CRAWL_RUN_ERRORS`); `PagesViewModel/Services/describeResultRange`
("Showing 21–40 of 47"), `toEmptyKind`; `PageDetailViewModel/Services/resolveRange` (preset →
`{ from, to }` with `todayInZone(now, user.timeZone)` and `addDays`), `buildHistoryTable`
(latest, change, best, worst per keyword), `toChartRows`, `groupIssues`. `Core/Helpers/FormatInZone/formatInZone`
(`Intl.DateTimeFormat` with the user's `timeZone`) and `Core/Helpers/PositionBucket/positionBucket`
(1–3 / 4–10 / 11–20 / 21+ / none → colour) are shared by several ViewModels and views;
`Core/Constants/crawlStatusColor.ts` is `Record<TCrawlRunStatus, MantineColor>`;
`Core/Helpers/SafeRedirectPath/safeRedirectPath` validates the `redirect` parameter.

Polling timers live in closures inside `create`, cleared by `stopPolling` and `reset`; screens
start and stop them in an effect keyed on the id (stops on unmount, D22).

### 12.5 Screens and every state

`Modules/_Shared/`: `AppLayout` (AppShell, nav, user menu), `PageHeader`, `SectionError`,
`EmptyState`, `CrawlStatusBadge`, `PositionBadge`, `NotFound`, `RouteError`.

**Sign in** — `Modules/SignIn/SignInScreen.tsx`, `SignInForm/SignInForm.tsx`, `SignInSchema.ts`.
States: idle; submitting (button loading, inputs kept); invalid (form-level alert "Email or
password is incorrect"); throttled (alert); network/5xx (alert from `describeError`); success →
navigate to `safeRedirectPath(redirect) ?? '/pages'`.

**Pages** — `Modules/Pages/PagesScreen.tsx`, `PagesFilterBar/`, `PagesTable/`, `CrawlBanner/`,
`PagesPagination/`. The screen fetches pages on every validated-search change and clients once;
the search box keeps local text and writes `q` to the URL after 300 ms; a filter change resets
`page` to 1. States, in this order: loading (table skeleton); error (`SectionError` with retry);
empty `noClients` (CTA **Add client**); empty `noMatches` (**Clear filters**); rows. A row
without positions shows "—" and the hint. Banner states (only with `clientId`): hidden
(succeeded or no run); active (blue/grey, "Crawling yoast.com — 6 of 15 pages", polling);
partial (yellow, sentence); failed (red, sentence + **Re-crawl** link to `/clients`). On a
transition to succeeded/partial observed by `CrawlStatusViewModel`, the screen calls
`refreshPages` and `refreshClients` (screens chain two ViewModels; ViewModels do not import each
other).

**Page detail** — `Modules/PageDetail/PageDetailScreen.tsx`, `PageDetailHeader/`, `KpiCards/`,
`PositionHistory/` (`RangeControls/`, `KeywordToggles/`, `PositionChart/`, `PositionTable/`),
`IssuesSection/`. The breadcrumb's "Pages" link is built from the list search the user came from
(carried in router state; absent → plain `/pages`). States: detail loading (header skeleton);
not found (`NotFound` with link to Pages); detail error (`SectionError`); history loading (chart
area skeleton, KPIs stay); history error (section-level, retry); history empty range ("No
positions in this range" — every series empty); keyword with no points (toggle shown, struck
through); chart and table views; issues empty ("No issues found").

**Clients** — `Modules/Clients/ClientsScreen.tsx`, `AddClientForm/` (`AddClientForm.tsx`,
`AddClientSchema.ts` — name 1–120, URL accepted by `parseWebsiteUrl`), `ClientsTable/`,
`RunLog/`. States: form idle / submitting / field errors (zod, then 400 → Website URL field,
409 → Website URL field with the link to `/pages?clientId=<existing>`) / form error (5xx,
network); table loading / error / empty ("No clients yet — add one above") / rows; re-crawl
refused (409 → inline message on the row, `actionError`); run log loading / error / items.

## 13. Invariants ↔ tests

| # | Pinned by | Kind | What makes it fail |
| --- | --- | --- | --- |
| I1 | `be/test/e2e/default-deny.e2e-spec.ts` → "every non-public route answers 401 without a session" and "the @Public routes are exactly login and health" | e2e | removing `@Public` from health, adding a route without the guard, adding a new `@Public` |
| I2 | `be/test/e2e/isolation-matrix.e2e-spec.ts` → "user B gets the same 404 as for a missing id" per row; list rows "B's lists exclude A's rows" | e2e | a repository method without the `user_id` join |
| I3 | ESLint `no-restricted-syntax` (`TSAsExpression[typeAnnotation.typeName.name='IUserScope']`) in `be/eslint.config.mjs` | lint | `pnpm --filter be lint` on any forged scope |
| I4 | ESLint selector `CallExpression[callee.property.name=/ForWorker$/]` on `src/modules/**/controllers/**` | lint | a controller calling a worker method |
| I5 | `isolation-matrix.e2e-spec.ts` → "every id-taking route has a matrix row" (static partner over the enumerated routes) | e2e (static) | a new `:id` route without a row |
| I6 | `password-hasher.service.spec.ts` → "stores scrypt$N$r$p$salt$hash" / "verify rejects a wrong password"; `auth.e2e-spec.ts` → "the session row holds sha256 of the cookie, not the cookie" | unit + e2e | storing the token or a different format |
| I7 | `auth.e2e-spec.ts` → "unknown email and wrong password answer identically"; `auth.service.spec.ts` → "verifies against the dummy hash when the user is unknown" | e2e + unit | branching messages, skipping the dummy verify |
| I8 | `json-only.middleware.spec.ts` table; `auth.e2e-spec.ts` → "a text/plain login is 415" | unit + e2e | middleware unwired |
| I9 | `clients.repository.int-spec.ts` → "a second insert of the same site key violates clients_user_id_site_key_uq"; `clients.e2e-spec.ts` → "two concurrent POSTs: one 201, one 409" | DB + e2e | index missing, 23505 unmapped |
| I10 | `crawl-runs.repository.int-spec.ts` → "a second active run violates the partial unique index"; `clients.e2e-spec.ts` → "re-crawl while queued is 409" | DB + e2e | partial predicate wrong |
| I11 | `crawl-runs.repository.int-spec.ts` → "finishing without finished_at violates crawl_runs_finished_at_required" | DB | CHECK missing |
| I12 | `crawl-runs.repository.int-spec.ts` → "a stale attempt cannot lock for finalize"; `crawl-run-executor.service.spec.ts` → "rolls back when the fencing lock is lost" | DB + unit | finalize without `attempts = ?` |
| I13 | `clients.service.spec.ts` → "inserts client and run with the same tx"; `clients.e2e-spec.ts` → "POST returns queued with the worker disabled" | unit + e2e | two transactions, an awaited crawl |
| I14 | `sitemap-discovery.service.spec.ts` (fixtures) → "fetches no page URL before selection" (transport log) and "ignores de.semrush.com sitemaps" | fixture | a page fetch in discovery, missing site filter |
| I15 | `post-selection.service.spec.ts` → "stops at 15 crawled", "stops at 30 candidates", "keeps sitemap order across windows" | fixture | wrong limits, out-of-order window |
| I16 | `crawl-run-items.repository.int-spec.ts` → "a crawled item without page_id violates crawl_run_items_page_required"; `crawl.e2e-spec.ts` → "yoast run logs /seo-blog/ as skipped_listing at position 0" | DB + e2e | CHECK missing, items not written |
| I17 | `address-guard.spec.ts` table; `guarded-lookup.spec.ts` → "rejects a host resolving to 10.0.0.5"; `remote-api.core.spec.ts` → "refuses a redirect to http://169.254.169.254/" | unit | guard bypass on a hop |
| I18 | `remote-api.core.spec.ts` → timeout, body cap, 6th redirect, retry on 503 then success, no retry on 404, `Retry-After` honoured; `undici-http-transport.spec.ts` → "aborts past maxBytes" (local server on 127.0.0.1 with the guard injected permissive) | unit | missing bound |
| I19 | `page-list.repository.int-spec.ts` → "a page absent from the latest run is not listed" (D31); `crawl-results.service.spec.ts` → "never deletes a page or a pair"; grep in §15 phase 4 regression guard | DB + unit | a DELETE, a missing currentness filter |
| I20 | Type `Record<TSeoIssueCode, ISeoRule>` (tsc); `seo-rules.registry.spec.ts` → "emits only catalogued codes over every fixture page" | typecheck + unit | a rule emitting an uncatalogued code; a catalogue entry without a rule (tsc) |
| I21 | `seo-issues.repository.int-spec.ts` → "duplicate (page, code) violates the unique index"; `page-keywords.repository.int-spec.ts` → "relevance 0 violates the CHECK" | DB | constraint missing |
| I22 | `rank-snapshots.repository.int-spec.ts` → "a snapshot for a missing pair violates rank_snapshots_page_keyword_fk"; "position 0 violates the CHECK" | DB | FK/CHECK missing |
| I23 | existing ESLint timestamp selector | lint | a bare `timestamp()` |
| I24 | `day-range-to-utc.util.test.ts` (DST table: 2026-03-08, 2026-11-01, normal days, Asia/Tokyo, UTC); `pages-history.e2e-spec.ts` → "a range on 2026-11-01 Toronto includes 12:00Z of Nov 1 only" | unit + e2e | UTC-midnight bounds, browser-zone use |
| I25 | `generate-positions.spec.ts` → determinism, continuation equality, clamp, 12:00 UTC; `seed-runner.int-spec.ts` → "≥ 50 000 rows", "re-run adds 0 rows", "a new page gets full history", "existing pairs are filled to today" | unit + DB | non-deterministic noise, missing ON CONFLICT |
| I26 | `formatInZone.test.ts` → "renders 2026-11-01T03:30Z as Oct 31 for Toronto and Nov 1 for Tokyo" (TZ is Toronto, so the Tokyo case proves the argument is used) | unit (fe) | `toLocaleDateString()` without `timeZone` |
| I27 | gateway tests ("refuses a body of the wrong shape"); `tsc -b` on the `z.ZodType<IShape>` declarations | unit + typecheck | schema drift |
| I28 | `pnpm --filter fe typecheck` on the `Record` | typecheck | a status added to the contract without a colour |

Not pinned by a test: **the list query's plan** (D7) — pinned by the `EXPLAIN` in phase 6's
acceptance, because a plan depends on statistics a test database does not have; **nothing
site-specific in crawler code** (CRAWL-010) — pinned by both fixture sites running through the
same code plus a `git grep` in phase 3's regression guard, because absence of a string is not a
runtime behaviour.

## 14. Test plan

Conventions are owned by `practices/be/nestjs/testing-patterns`, `practices/fe/react/testing`
and `fe/skills/testing`; this section names kind and placement only.

| unit under test | kind | placement |
| --- | --- | --- |
| `parseWebsiteUrl`, `isSameSite`, time utils | unit (vitest) | `packages/contracts/src/domain/**/<unit>/<unit>.util.test.ts` |
| `PasswordHasher`, `session-token`, `AuthService`, `SessionGuard`, `jsonOnlyMiddleware`, `escapeLike` | unit | beside the unit, `*.spec.ts` |
| users/sessions/clients/crawl-runs/items/pages/keywords/page-keywords/issues/snapshots repositories | DB integration | beside the repository, `*.int-spec.ts` |
| `RemoteApiCore`, `UndiciHttpTransport`, `guardedLookup`, `isPublicAddress`, `FixtureHttpTransport` | unit | `be/src/infrastructure/remote-api/**` |
| sitemap parser/scoring/discovery, robots policy, post selection, executor | unit + fixture | `be/src/modules/crawl/**`; fixtures `be/test/fixtures/sites/` |
| extraction, tokenizer, candidates, scoring, selection, every SEO rule group, registry | unit + fixture | `be/src/modules/page-analysis/**` |
| `pickBestPosition`, `PageReadService` (incl. `describe('cost')`), `PositionHistoryService`, `CrawlResultsService` | unit | `be/src/modules/pages/**` |
| position generator parts, `SeedRunner` | unit + DB integration | `be/src/seed/**` |
| auth, default-deny, isolation matrix, clients, crawl (fixture transport), pages list, page detail, history/DST | e2e (supertest, real DB) | `be/test/e2e/*.e2e-spec.ts` |
| search schemas, `safeRedirectPath`, `formatInZone`, `positionBucket`, VM services | unit (vitest) | beside the unit |
| each gateway | unit, fake `fetch` | `Gateways/<Entity>Gateway/<Entity>Gateway.test.ts` |
| each ViewModel: ready, failure, superseded, refused write keeps reads, polling start/stop (fake timers) | unit | `ViewModels/<Entity>ViewModel/*.test.ts` |
| SignInForm, PagesFilterBar, PagesTable states, CrawlBanner, AddClientForm 400/409, RunLog, PositionTable, KeywordToggles | component | beside the component |

**Harness (phase 1).** `be/test/jest-db.config.json` (rootDir `..`, roots `src` and `test`,
testRegex `\.(int|e2e)-spec\.ts$`, `globalSetup: test/support/db-global-setup.ts`, run with
`--runInBand`); the global setup refuses any `TEST_DATABASE_URL` whose database name does not end
in `_test`, skips the suite when the database is unreachable unless `E2E_REQUIRE_INFRA=1`, runs
`runMigrations`, truncates all tables once. Because the run is in band, a suite that needs an
empty database (the seed test) may call `resetDatabase()` in its `beforeAll` — the practice's
"never truncate in a suite" rule exists for parallel suites, which this config forbids.
`be/test/support/`: `create-test-app.ts` (real `AppModule`, `configureApp`, overridable
`HTTP_TRANSPORT`, `CRAWL_WORKER_ENABLED=false`), `sign-in.ts` (creates a user and returns a
cookie, asserting every status), `list-routes.ts` (Nest `DiscoveryService` + path/method
metadata, so it sees exactly what Nest registered), `assert-test-database/` (+spec).

**Fixtures.** Recorded once by `be/test/fixtures/record-fixtures.ts` (run by hand with
`pnpm --filter be exec ts-node test/fixtures/record-fixtures.ts`; never by a test): robots.txt,
sitemap indexes, blog sitemaps, feeds and three posts per site, plus the yoast `/seo-blog/`
listing; synthetic sites: `no-robots`, `gzip-sitemap`, `root-blog-no-feed`, `unusual-name`
(`sitemap-insights.xml` + feed), `collection-page-first`, `redirect-offsite`, `robots-disallow`,
`private-redirect`. Unrecorded post URLs are served by the manifest's synthetic-article pattern,
so a 15-post run needs no 15 recorded pages.

**Cost.** `PageReadService` `describe('cost')`: with `pageSize = 50`, each of the four repository
methods is called exactly once (the quadratic shape this guards is a per-row latest-position
query).

## 15. Work order

Phase acceptance always ends with `pnpm lint && pnpm typecheck && pnpm test` (pre-push) plus
`pnpm --filter be test:db` once phase 1 exists, and `docker compose up -d --build` followed by
`curl -fsS http://localhost:8080/api/health`. A phase closes only when every task of the change
it names is closed. Commits are Conventional Commits on `feat/keyword-tracker`
(`skills/claude-workflow`). Every migration is generated (`pnpm db:generate`), read, applied
(`pnpm db:migrate`) and backwards-compatible: every phase only adds tables, columns, indexes and
enum types — nothing the previous code reads is dropped or renamed.

### Phase 1 — Test harness and CI database · change `test-harness-and-ci-database`

Depends on: nothing. Ends with: DB-backed tests runnable locally and in CI; the app unchanged.

**1a. Real-database test runner**
- Deliverables: new `be/src/persistence/migrations/run-migrations/run-migrations.ts`; changed
  `be/src/migrate.ts` (calls it); new `be/test/jest-db.config.json`,
  `be/test/support/{db-global-setup.ts,reset-database.ts,create-test-app.ts}`,
  `be/test/support/assert-test-database/{assert-test-database.ts,assert-test-database.spec.ts}`,
  `be/test/e2e/health.e2e-spec.ts`; changed `be/package.json` (`test:db`, jest `roots` adds
  `<rootDir>/../test/support`, devDeps `supertest`, `@types/supertest`), `be/tsconfig.build.json`
  (exclude `test`), be `lint` glob `"{src,test}/**/*.ts"`, root `package.json` (`test:db`),
  `.env.example` (`TEST_DATABASE_URL=postgresql://tracker:change-me@localhost:5432/seo_tracker_test`).
- Pre-conditions: none.
- TDD: first `assert-test-database.spec.ts` → "refuses postgresql://…/seo_tracker" and "accepts
  …/seo_tracker_test" — fails: module does not exist. Then `health.e2e-spec.ts` → "GET /api/health
  answers 200 with status ok through the real AppModule" — fails: `pnpm --filter be test:db` is
  not a script.
- Acceptance: `pnpm --filter be test:ci -- test/support`; `pnpm dev:db && pnpm --filter be test:db`
  (1 suite passes); `E2E_REQUIRE_INFRA=1 TEST_DATABASE_URL=postgresql://x:y@localhost:1/none_test pnpm --filter be test:db`
  exits non-zero; `TEST_DATABASE_URL=$DATABASE_URL pnpm --filter be test:db` exits non-zero with
  the refusal; `pnpm --filter be build && docker compose up -d --build`.
- Regression guard: `migrate.ts` behaviour — `docker compose up -d --build` runs the migrate
  service to completion; `pnpm --filter be build` proves `test/` stays out of `dist`.
- Rollback: revert the commits; no schema touched.
- Commits: `refactor(be): extract runMigrations from the migrate CLI`;
  `test(be): real-database jest config with a _test-only global setup`;
  `test(be): health e2e through the real AppModule`.

**1b. CI runs the database tests**
- Deliverables: changed `.github/workflows/ci.yml` — new job `db-tests` with `services.postgres`
  (`postgres:18-alpine`, db `seo_tracker_test`, health options), steps install, `cp .env.example .env`,
  `pnpm --filter @app/contracts run build`, `pnpm --filter be test:db` with
  `TEST_DATABASE_URL` and `E2E_REQUIRE_INFRA=1`.
- Pre-conditions: 1a green.
- TDD: none (pipeline config); its failing case is proven locally in 1a's acceptance.
- Acceptance: `git push -u origin feat/keyword-tracker:feat/keyword-tracker` and open the PR, then
  `gh pr checks --watch` shows `db-tests` green.
- Regression guard: the existing `checks` and `docker` jobs still pass in the same run.
- Rollback: revert the workflow commit.
- Commits: `ci: run database tests against a postgres service container`.

### Phase 2 — Sessions and default deny · change `user-sessions-and-default-deny`

Depends on: phase 1. Decisions D3, D8, D10, D11, D32. Ends with: every route but login and
health requires a session; no users exist until the seed (phase 5), which is acceptable because
the frontend does not call any guarded route yet.

**2a. Users and sessions schema + contracts**
- Deliverables: `packages/contracts/src/domain/http/api-error-code.constant.ts`,
  `auth/session-user.interface.ts`, `auth/login-request.interface.ts`, `time/is-time-zone/` (+test),
  `src/index.ts`; `be/src/persistence/schema/tables/{users,sessions}/*.schema.ts`;
  `database-schema.ts`; generated `be/drizzle/0000_*.sql` + meta;
  `be/src/modules/auth/repositories/{users,sessions}/*.repository.ts` + `*.int-spec.ts`.
- Pre-conditions: 1a.
- TDD: `users.repository.int-spec.ts` → "a mixed-case email violates users_email_lowercase",
  "a duplicate email violates users_email_uq"; `sessions.repository.int-spec.ts` → "deleting a
  user cascades its sessions", "deleteExpired removes only expired rows" — fail: tables do not
  exist. `is-time-zone.util.test.ts` → "accepts America/Toronto, refuses Mars/Base" — fails: no util.
- Acceptance: `pnpm db:generate` then read the SQL (two tables, two indexes, one CHECK, one FK
  cascade); `pnpm db:migrate`; `pnpm --filter be test:db -- users sessions`;
  `pnpm --filter @app/contracts test:ci`.
- Regression guard: `pnpm --filter be test:db` (health e2e still green); migrate service in compose.
- Rollback: a new migration cannot be un-applied by drizzle; roll forward with a generated drop
  migration only if the tables must go (nothing reads them yet).
- Commits: `feat(contracts): session user, login request, api error codes`;
  `feat(db): users and sessions tables`; `test(auth): users and sessions repositories against postgres`.

**2b. Password hashing and session tokens**
- Deliverables: `be/src/modules/auth/services/password-hasher/` (+spec),
  `services/session-token/` (+spec), `constants/session.constant.ts`.
- Pre-conditions: 2a.
- TDD: `password-hasher.service.spec.ts` → "hash produces scrypt$131072$8$1$<salt>$<hash>",
  "verify true for the right password and false for a wrong one", "verify reads N/r/p from the
  stored string" (test uses N = 2^10 via the params argument), "verify returns false for a
  malformed string without throwing"; `session-token.spec.ts` → "32 random bytes, base64url",
  "hash is sha256 and 32 bytes" — fail: no units.
- Acceptance: `pnpm --filter be test:ci -- src/modules/auth/services`.
- Regression guard: none outside the module — nothing calls these yet.
- Rollback: revert.
- Commits: `feat(auth): scrypt password hasher with self-describing hashes`;
  `feat(auth): session token generation and hashing`.

**2c. Login, logout, me, the session guard and default deny**
- Deliverables: `be/src/shared/user-scope/user-scope.interface.ts`;
  `be/src/core/decorators/{public,current-scope}/`; `be/src/core/middleware/json-only/` (+spec);
  `core/bootstrap/configure-app.ts` (cookie-parser, json-only); `modules/auth/{auth.module.ts,
  controllers/auth/auth.controller.ts, dto/login/login.dto.ts, services/auth/auth.service.ts
  (+spec), services/user-accounts/user-accounts.service.ts, guards/session/{session.guard.ts
  (+spec), create-user-scope.ts}, constants/{auth-errors,throttle}.constant.ts, exceptions/}`;
  `@Public()` on `HealthController`; `AppModule` imports `AuthModule` and `ThrottlerModule`;
  `be/eslint.config.mjs` (I3, I4 selectors); deps `cookie-parser`, `@types/cookie-parser`,
  `@nestjs/throttler`; `be/test/support/{sign-in.ts,list-routes.ts}`;
  `be/test/e2e/{auth,default-deny,isolation-matrix}.e2e-spec.ts`.
- Pre-conditions: 2a, 2b.
- TDD: first `default-deny.e2e-spec.ts` → "the @Public routes are exactly POST /api/auth/login
  and GET /api/health" — fails: health carries no `@Public`; then "every non-public route answers
  401" — fails once auth routes exist without the guard. `auth.e2e-spec.ts` → login sets `sid`
  with HttpOnly, SameSite=Lax, Path=/, no Secure on localhost, Max-Age 604800; me returns
  `timeZone`; logout → 204 and the next me is 401; unknown email ≡ wrong password; the 11th
  login per minute is 429; a text/plain login is 415; an expired session is 401; the session row
  holds sha256(cookie). `auth.service.spec.ts` → "verifies against the dummy hash when the user is
  unknown", "purges expired sessions on login". `session.guard.spec.ts` → "attaches a scope with
  userId and timeZone", "slides expiry only after the touch interval". `isolation-matrix.e2e-spec.ts`
  → the static partner (no id routes yet; it bites from phase 3).
- Acceptance: `pnpm --filter be test:ci -- src/modules/auth src/core`;
  `pnpm --filter be test:db -- auth default-deny isolation-matrix`; `pnpm --filter be lint`;
  `docker compose up -d --build`; `curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/auth/me`
  prints 401; `curl -fsS http://localhost:8080/api/health`.
- Regression guard: the compose healthcheck (`GET /api/health` must stay public) — `docker
  compose ps` shows `be` healthy; the FE home screen still renders health.
- Rollback: revert; the tables stay (unread).
- Commits: `feat(core): @Public, @CurrentScope and a JSON-only guard for mutating requests`;
  `feat(auth): login, logout and me with server-side sessions`;
  `feat(auth): global session guard — every route is denied by default`;
  `chore(be): lint bans forged user scopes and worker methods in controllers`;
  `test(auth): default-deny route enumeration and the isolation matrix harness`.

### Phase 3 — Clients and blog crawl · change `clients-and-blog-crawl`

Depends on: phase 2. Decisions D5, D9, D14, D19, D20, D21, D30, D31, D33. Ends with: the API can
add a client and crawl its blog; the worker runs in the `be` container. No UI yet.

**3a. The website rule**
- Deliverables: `packages/contracts/src/domain/clients/{website-url,site-key}/` (+tests),
  `clients/{client,create-client-request}.interface.ts`, `crawl/*.enum.ts`,
  `crawl/{crawl-limits,crawl-run-error}.constant.ts`, `crawl/*.interface.ts`.
- Pre-conditions: none beyond phase 2.
- TDD: `parse-website-url.util.test.ts` table → `yoast.com` → `https://yoast.com` / `yoast.com`;
  `https://WWW.Semrush.com:443/blog/?x=1` → `semrush.com`; `http://bücher.de` → punycode;
  `de.semrush.com` ≠ `semrush.com`; refused: `ftp://a.com`, `https://u:p@a.com`, `http://10.0.0.1`,
  `http://[::1]`, `http://localhost`, `http://intranet` — fails: no util.
- Acceptance: `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
- Regression guard: contracts barrel export surface (`pnpm typecheck` builds both sides).
- Rollback: revert.
- Commits: `feat(contracts): website URL parsing and site keys`; `feat(contracts): crawl run vocabulary`.

**3b. Clients, runs, items and pages schema**
- Deliverables: `tables/{clients,crawl-runs,crawl-run-items,pages}/*.schema.ts`; generated
  migration; repositories `modules/clients/repositories/{clients,crawl-runs,crawl-run-items}/`
  and `modules/pages/repositories/pages/` with `*.int-spec.ts`;
  `persistence/connections/postgres/transaction-runner/transaction-runner.ts`.
- Pre-conditions: 3a.
- TDD: int-specs for I9, I10, I11, I16 (constraint names asserted from the 23505/23514 error) and
  "pages upsert on (client_id, url) keeps the id" — fail: tables do not exist.
- Acceptance: `pnpm db:generate` and read the SQL (partial unique index predicate, the CHECKs,
  three enum types emitted); `pnpm db:migrate`; `pnpm --filter be test:db -- clients crawl-run pages`.
- Regression guard: phase-2 e2e suites (`pnpm --filter be test:db`).
- Rollback: roll forward only (unread tables).
- Commits: `feat(db): clients, crawl runs, run items and pages`;
  `feat(persistence): a transaction runner services can use without Drizzle`;
  `test(clients): constraint behaviour of clients and runs against postgres`.

**3c. Clients API (worker disabled)**
- Deliverables: `modules/clients/{clients.module.ts, controllers/{clients,crawl-runs}/,
  dto/create-client/, services/{clients,client-crawl-runs}/ (+specs), constants/, exceptions/}`;
  `AppModule`; `be/test/e2e/clients.e2e-spec.ts`; matrix rows for `GET /clients/:id`,
  `POST /clients/:id/crawl-runs`, `GET /crawl-runs/:id`.
- Pre-conditions: 3b.
- TDD: `clients.e2e-spec.ts` → POST 201 with `latestRun.status = 'queued'`; invalid URL 400
  INVALID_WEBSITE_URL; duplicate (`https://www.yoast.com/blog`) 409; concurrent duplicates one
  201 one 409; re-crawl while queued 409; list carries `latestRun` and `currentPageCount = 0`.
  Static partner in `isolation-matrix.e2e-spec.ts` now fails until the three rows are added.
  `clients.service.spec.ts` → "client and run share one tx", "maps 23505 on the site key index to
  CLIENT_ALREADY_EXISTS and on the active-run index to CRAWL_ALREADY_ACTIVE".
- Acceptance: `pnpm --filter be test:ci -- src/modules/clients`;
  `pnpm --filter be test:db -- clients isolation-matrix default-deny`.
- Regression guard: default-deny enumerates the new routes automatically.
- Rollback: revert; queued runs left in the database are inert while the worker is off.
- Commits: `feat(clients): add, list and read clients with their latest run`;
  `feat(clients): queue a re-crawl and read a run's log`; `test(clients): isolation rows for client and run ids`.

**3d. The queue worker**
- Deliverables: `modules/crawl/{crawl.module.ts, workers/crawl-worker/ (+spec),
  workers/crawl-wakeup/, constants/crawl-worker.constant.ts}`; a temporary executor port
  `ICrawlRunExecutor` with the real implementation landing in 3g; env `CRAWL_WORKER_ENABLED`
  (+ `env.schema.spec.ts` case); `crawl-runs.repository.int-spec.ts` additions.
- Pre-conditions: 3c.
- TDD: int → "two concurrent claims take two different runs (SKIP LOCKED)", "an expired running
  run is reclaimed with attempts 2", "attempts 3 expired → failed CRAWL_ABANDONED", "a stale
  attempt cannot lock for finalize", "renewLease with a stale attempt updates 0 rows"; unit
  `crawl-worker.spec.ts` → "runs at most 2 executions at once", "wakes on notify before the
  poll interval", "stops claiming on shutdown" (fake timers).
- Acceptance: `pnpm --filter be test:ci -- src/modules/crawl/workers`;
  `pnpm --filter be test:db -- crawl-runs`.
- Regression guard: `CRAWL_WORKER_ENABLED` defaults to false, so compose behaviour is unchanged —
  `docker compose up -d --build` and `docker compose logs be` shows no worker start.
- Rollback: revert.
- Commits: `feat(crawl): a postgres-backed queue worker with leases and fencing`.

**3e. Bounded, guarded outbound HTTP**
- Deliverables: `be/src/infrastructure/remote-api/**` (§7.4) with specs; deps `undici`;
  `be/test/fixtures/{record-fixtures.ts, sites/**, manifest.json}` (recorded once, committed).
- Pre-conditions: none beyond phase 2 (parallel-safe with 3d).
- TDD: `address-guard.spec.ts` table; `guarded-lookup.spec.ts` (fake resolver);
  `remote-api.core.spec.ts` with a scripted fake transport → timeout, 6th redirect refused,
  redirect to a private IP literal refused, retry 503→200, no retry on 404, `Retry-After: 2`
  waited (fake timers), UA header present; `undici-http-transport.spec.ts` → body cap and gunzip
  against a local `http.createServer` on 127.0.0.1 (the test injects a permissive lookup; the
  production lookup refusing 127.0.0.1 is its own case); `fixture-http-transport.spec.ts` →
  "unknown URL is 404, never the network" — fail: nothing exists.
- Acceptance: `pnpm --filter be test:ci -- src/infrastructure/remote-api`.
- Regression guard: nothing calls it yet.
- Rollback: revert.
- Commits: `feat(infra): guarded HTTP transport with DNS-pinned SSRF checks and body caps`;
  `feat(infra): RemoteApiCore — redirects, retries, timeouts, user agent`;
  `test(crawl): recorded semrush and yoast fixtures and synthetic sites`.

**3f. Sitemap discovery**
- Deliverables: `modules/crawl/services/{robots-policy,sitemap-parser,feed-discovery,
  sitemap-scoring,sitemap-discovery,site-http-client}/` (+specs),
  `constants/sitemap-scoring.constant.ts`; deps `fast-xml-parser`, `robots-parser`, `cheerio`.
- Pre-conditions: 3e.
- TDD: `sitemap-scoring.spec.ts` (pure) → the §10.1 expectations as a table, grouping of
  `post-sitemap`/`post-sitemap2`, tie-breaks; `sitemap-discovery.service.spec.ts` (fixtures) →
  semrush selects `/blog/sitemap/` and ignores `de.semrush.com`; yoast selects the post group in
  index order; `no-robots` uses well-known paths; `gzip-sitemap` parses; `root-blog-no-feed`
  selects at score 2; `unusual-name` selects via feed share; a pages-only site fails
  `BLOG_SITEMAP_NOT_FOUND`; no sitemap fails `SITEMAP_NOT_FOUND`; "no page URL is requested
  before selection" (the transport's request log contains only robots, sitemaps, home, feeds).
- Acceptance: `pnpm --filter be test:ci -- src/modules/crawl/services`.
- Regression guard: `git grep -n -i -E "semrush|yoast" -- be/src/modules be/src/infrastructure`
  prints nothing (CRAWL-010).
- Rollback: revert.
- Commits: `feat(crawl): sitemap and feed parsing`; `feat(crawl): score and group candidate sitemaps`;
  `feat(crawl): blog sitemap discovery with a same-site filter and a fetch budget`.

**3g. Post selection, execution and finalize; the worker goes live**
- Deliverables: `services/post-selection/` (+spec), `services/crawl-run-executor/` (+spec),
  `modules/pages/services/crawl-results/` (+spec, pages only for now),
  `be/test/e2e/crawl.e2e-spec.ts`; `docker-compose.yml` (`be`: `CRAWL_WORKER_ENABLED: "true"`);
  `.env.example` (`CRAWL_WORKER_ENABLED=true`).
- Pre-conditions: 3d, 3f.
- TDD: `post-selection.service.spec.ts` → I15 cases, `/seo-blog/` skipped at position 0,
  robots-disallowed skipped, offsite redirect skipped, a 500 recorded as failed and the next tried,
  window results applied in order; `crawl-run-executor.service.spec.ts` → status by count,
  discovery failure finalizes `failed` with its code, fencing loss rolls back;
  `crawl.e2e-spec.ts` (fixture transport, `runOnce()`) → POST a client for the yoast fixture →
  run succeeded, 15 pages, 16 items, position 0 `skipped_listing`; a re-crawl after removing one
  post from the fixture sitemap → the page row still exists with the old `last_seen_run_id`.
- Acceptance: `pnpm --filter be test:ci -- src/modules/crawl src/modules/pages`;
  `pnpm --filter be test:db -- crawl clients`; `docker compose up -d --build` and
  `docker compose logs be | grep -i "crawl worker started"`.
- Regression guard: the grep from 3f; `pnpm --filter be test:db` whole suite.
- Rollback: set `CRAWL_WORKER_ENABLED: "false"` in compose (runs stay queued, nothing breaks), or revert.
- Commits: `feat(crawl): select the first 15 posts in sitemap order and log every candidate`;
  `feat(crawl): execute runs and finalize results atomically under the attempt fence`;
  `feat(ops): run the crawl worker inside the api container`.

### Phase 4 — Page analysis · change `page-analysis`

Depends on: phase 3. Decisions D1, D4, D15, D16, D31. Ends with: every crawled page has keywords
and SEO issues; a re-crawl updates them without deleting history.

**4a. Catalogue and schema**
- Deliverables: `packages/contracts/src/domain/seo/*`; `tables/{keywords,page-keywords,seo-issues}/`;
  generated migration; `modules/pages/repositories/{keywords,page-keywords,seo-issues}/` + int-specs.
- Pre-conditions: phase 3 closed (`pages` and `crawl_runs` exist for the FKs).
- TDD: int → I21 cases, "keyword upsert by term returns the existing id", "deleting a page
  cascades its pairs and issues but not the keyword" — fail: tables absent.
- Acceptance: `pnpm db:generate` + read SQL; `pnpm db:migrate`; `pnpm --filter be test:db -- keywords page-keywords seo-issues`.
- Regression guard: `pnpm --filter be test:db` (crawl e2e still green).
- Rollback: roll forward only.
- Commits: `feat(contracts): the SEO issue catalogue with its thresholds`;
  `feat(db): keywords, page keywords and seo issues`.

**4b. Extraction**
- Deliverables: `modules/page-analysis/services/html-extraction/` (+spec).
- Pre-conditions: 3e fixtures (recorded posts); independent of 4a.
- TDD: `extract-page.spec.ts` (fixtures) → semrush title from `<head>` not the body SVG; yoast
  JSON-LD keywords and `Article`; main content strips nav/header/footer/aside; word count;
  `lang` — fail: no unit.
- Acceptance: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction`.
- Regression guard: none (unused yet). Rollback: revert.
- Commits: `feat(analysis): extract the fields a page is judged by`.

**4c. SEO rules**
- Deliverables: `services/seo-rules/{seo-rules.registry.ts (+spec), rules/*/}` (+specs).
- Pre-conditions: 4a (catalogue), 4b (`IParsedPage`).
- TDD: one table-driven spec per rule group covering each D16 threshold at, below and above its
  boundary (title 29/30/60/61, meta 69/70/160/161, words 299/300, TTFB 1500/1501 ms, HTML
  1 048 576/1 048 577 bytes, `X-Robots-Tag: noindex`, `alt=""` not missing), with `details`
  asserted; registry spec → "emits only catalogued codes over every fixture page" — fail: no rules.
- Acceptance: `pnpm --filter be test:ci -- src/modules/page-analysis/services/seo-rules && pnpm typecheck`.
- Regression guard: removing one rule from the registry must fail `pnpm typecheck` (checked once by hand while writing 4c).
- Rollback: revert.
- Commits: `feat(analysis): SEO issue rules built from the shared catalogue`.

**4d. Keyword extraction**
- Deliverables: `services/keyword-extraction/**` (+specs), `constants/keyword-scoring.constant.ts`;
  dep `stopword`.
- Pre-conditions: 4b (`IParsedPage`); decision D15.
- TDD: tokenizer (NFKC, punctuation, digits-only dropped); candidates never start/end with a stop
  word and never cross a heading; brand suffix removed from the title; IDF factor 1 at N = 1 and
  < 0.3 for a term on every page of 15; subsumption; selection 5–8 with relevance 1 for the top;
  golden fixtures → a yoast post's slug phrase is in its top 3, "yoast" is not in any page's top 3
  — fail: no units.
- Acceptance: `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction`.
- Regression guard: none outside the folder — nothing calls the extractor until 4e.
- Rollback: revert. Commits: `feat(analysis): field-weighted keyword candidates`;
  `feat(analysis): corpus IDF, subsumption and keyword selection`.

**4e. Analysis in the crawl**
- Deliverables: `services/page-analysis/` (+spec), `page-analysis.module.ts`; executor and
  `CrawlResultsService` extended (pairs, issues); `crawl.e2e-spec.ts` extended.
- Pre-conditions: 4a, 4c, 4d.
- TDD: `crawl-results.service.spec.ts` → "replaces the issues of a re-fetched page", "updates
  relevance of a surviving pair and sets its last_seen_run_id", "never deletes a pair";
  `crawl.e2e-spec.ts` → after a run every page has 5–8 pairs and its issues; KEYWORD_NOT_IN_TITLE
  appears on the synthetic page whose title omits its top keyword — fail: analysis not wired.
- Acceptance: `pnpm --filter be test:db -- crawl`; `pnpm --filter be test:ci`.
- Regression guard: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src` prints nothing (I19).
- Rollback: revert (pages keep working without keywords).
- Commits: `feat(crawl): analyse each run's pages once all are fetched`.

### Phase 5 — Positions and seed · change `positions-and-seed`

Depends on: phase 4. Decisions D2, D17, D18, D23, D27. Ends with: `docker compose run --rm seed`
produces the two users, two crawled clients and ≥ 50 000 snapshots; users can sign in (API).

**5a. Snapshot storage** — Deliverables: `tables/rank-snapshots/`, generated migration,
`modules/pages/repositories/rank-snapshots/` + int-spec. Pre-conditions: phase 4 closed
(`page_keywords` exists for the composite FK). TDD: I22 cases, "ON CONFLICT DO NOTHING
leaves the first row", "deleting a page cascades its snapshots" — fail: table absent. Acceptance:
`pnpm db:generate` + read SQL (composite FK present); `pnpm db:migrate`;
`pnpm --filter be test:db -- rank-snapshots`. Regression: whole `test:db`. Rollback: roll forward
only. Commits: `feat(db): rank snapshots keyed by page, keyword and instant`.

**5b. Position generator** — Deliverables: `be/src/seed/position-generator/**` (+specs).
Pre-conditions: none (pure; decision D17).
TDD: "same pair, same days → identical series"; "a→c equals a→b continued from b's last
position"; "every value in 1..100"; baseline ranges for r = 1 and r = 0.2; "days end at the latest
12:00 UTC not after now (now = 11:59Z → yesterday's noon)"; `historyDays(180) = 365`,
`historyDays(100) = 500` — fail: no units. Acceptance:
`pnpm --filter be test:ci -- src/seed/position-generator`. Regression: none — pure functions
nobody calls until 5c. Rollback: revert.
Commits: `feat(seed): deterministic mean-reverting position walks`.

**5c. The seed command** — Deliverables: `be/src/seed/{seed.ts, seed.module.ts,
seed-accounts.constant.ts, seed-runner/ (+spec, +int-spec)}`; `PositionSeedService`,
`UserAccountsService.upsertUserForWorker`, `ClientCrawlRunsService.enqueueForWorker`;
`be/package.json` `seed` script (`dotenv -e ../.env -- ts-node -r tsconfig-paths/register
src/seed/seed.ts`); root `seed`; `docker-compose.yml` service `seed` (image
`seo-keyword-tracker-be`, `command: ["node", "dist/src/seed/seed.js"]`, `profiles: [tools]`,
`depends_on: migrate: service_completed_successfully`, env `*be-env` + `SEED_USER_PASSWORD` +
`CRAWL_WORKER_ENABLED: "true"`); `.env.example` `SEED_USER_PASSWORD=demo-password-change-me`.
Pre-conditions: 5a, 5b; phase 3's worker and phase 4's analysis (the seed crawls through them).
VERIFY: `docker compose run --rm seed` starts the already-exited `migrate` dependency again —
harmless, since applied migrations are skipped, but it adds a few seconds and a log block.
TDD: `seed-runner.int-spec.ts` (fixture transport, `resetDatabase()` first) → "creates two
users and two clients", "crawl runs have trigger seed and succeeded", "≥ 50 000 snapshots", "a
second run adds 0 rows", "a page added by a UI run after the first seed gets a full history on the
second", "with --positions-only no crawl run is created", "a failed crawl makes the run exit with
an error"; `seed-runner.service.spec.ts` → "does not enqueue for a client with a succeeded run" —
fail: nothing exists. Acceptance: `pnpm --filter be test:db -- seed-runner`;
`docker compose up -d --build && docker compose run --rm seed` exits 0;
`docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots"`
≥ 50000; `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from rank_snapshots where extract(hour from captured_at at time zone 'UTC') <> 12 or captured_at > now()"`
= 0; a second `docker compose run --rm seed` reports 0 rows added (same day); login curl:
`curl -s -c /tmp/c -H 'Content-Type: application/json' -d '{"email":"yoast.manager@example.com","password":"demo-password-change-me"}' http://localhost:8080/api/auth/login`
→ 200. Regression: whole `test:db`; `git grep -n "demo-password" -- be/src` prints nothing.
Rollback: the seed is additive; revert the code; seeded rows are dev data. Commits:
`feat(seed): idempotent seed — users, clients, crawls through the worker`;
`feat(seed): fill daily positions for every current pair`; `feat(ops): one-shot seed compose service`.

### Phase 6 — Pages API · change `pages-and-position-history`

Depends on: phase 5 (the EXPLAIN needs seeded data). Decisions D2, D6, D7, D12, D13, D31.

**6a. Zone conversion** — Deliverables: `packages/contracts/src/domain/time/**` (+tests).
Pre-conditions: none (pure; decisions D2, D3).
TDD: `day-range-to-utc.util.test.ts` → `2026-03-08` Toronto = `[05:00Z, 2026-03-09T04:00Z)`
(23 h), `2026-11-01` = `[04:00Z, 2026-11-02T05:00Z)` (25 h), `2026-07-15` EDT, `Asia/Tokyo`,
`UTC`; `today-in-zone` at `2026-11-02T03:30Z` is `2026-11-01` in Toronto; `is-iso-day` refuses
`2026-02-30` — fail: no utils. Acceptance: `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
Regression: the contracts barrel (`pnpm typecheck` builds both consumers). Rollback: revert. Commits: `feat(contracts): calendar ranges in the user's zone to UTC bounds`.

**6b. Trigram search indexes** — Deliverables: custom migration (`CREATE EXTENSION IF NOT EXISTS
pg_trgm;`), schema indexes §3.11, generated migration after it. Pre-conditions: phase 5
closed. TDD: `page-list.repository.int-spec.ts`
→ "the trgm indexes exist" (query `pg_indexes`) — fails: no index. Acceptance:
`pnpm --filter be db:generate --custom --name enable_pg_trgm`, edit only that file's body,
`pnpm db:generate`, read both SQL files, check the custom one sorts first in `be/drizzle/meta/_journal.json`
(read, never edited); `pnpm db:migrate`; drop and recreate the test DB once to prove the order on
a fresh database: `docker compose exec -T postgres dropdb -U tracker seo_tracker_test && pnpm --filter be test:db`.
Regression: whole `test:db`. Rollback: roll forward only. Commits:
`feat(db): pg_trgm and trigram indexes for page and keyword search`.

**6c. Pages list** — Deliverables: `modules/pages/{pages.module.ts, controllers/pages/,
dto/list-pages-query/, services/{page-read,best-position}/ (+specs),
repositories/page-list/ (+int-spec)}`; `be/src/core/utils/escape-like/` (+spec);
`be/test/e2e/pages.e2e-spec.ts`; matrix row `GET /pages?clientId`;
`be/test/explain/pages-list.explain.sql`. Pre-conditions: 6a, 6b; a seeded database for the
EXPLAIN. TDD: int → "a page absent from the latest run is not
listed" (D31), "a failed re-crawl keeps the previous run's pages", "q matches URL or a keyword",
"q='%' matches only a literal percent", "order client name then sitemap position", "keywords carry
their latest position"; unit `pick-best-position.spec.ts` (ties, null); `page-read.service.spec.ts`
`describe('cost')` → four repository calls for 50 rows; e2e → pagination totals, `pageSize=51`
400, foreign `clientId` 404 — fail: no endpoint. Acceptance:
`pnpm --filter be test:ci -- src/modules/pages src/core/utils`; `pnpm --filter be test:db -- pages isolation-matrix`;
`docker compose up -d --build && docker compose run --rm seed`;
`docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/pages-list.explain.sql`
shows `Index Scan … rank_snapshots_pk` under the LATERAL `Limit` with loops equal to the slice's
pair count and no `Seq Scan on rank_snapshots`. Regression: default-deny sees the new routes.
Rollback: revert. Commits: `feat(pages): scoped pages list with current pages only`;
`feat(pages): best and latest positions at read time for the listed page`;
`perf(pages): explain of the list query on seeded data`.

**6d. Page detail and history** — Deliverables: `dto/positions-query/`,
`services/position-history/` (+spec), detail in `PageReadService`;
`be/test/e2e/pages-history.e2e-spec.ts`; matrix rows `GET /pages/:id`, `GET /pages/:id/positions`;
`be/test/explain/position-history.explain.sql`. Pre-conditions: 6a, 6c (module and
controller exist). TDD: unit → default 30 days ending today in the
zone, future `to` clamped, `from > to` and 367 days → `INVALID_DATE_RANGE`; e2e → the DST
scenario (§11 C), empty series kept for a keyword without points, a dropped-out page answers 404,
a `timeZone` query parameter is refused (400, TZ-003), B gets 404 for A's page and positions —
fail: no endpoints. Acceptance:
`pnpm --filter be test:ci -- src/modules/pages`; `pnpm --filter be test:db -- pages-history isolation-matrix`;
`docker compose exec -T postgres psql -U tracker -d seo_tracker < be/test/explain/position-history.explain.sql`
shows one index range scan on `rank_snapshots_pk`. Regression: default-deny and the
isolation matrix's static partner see the two new id routes. Rollback: revert. Commits:
`feat(pages): page detail with keywords, issues and last crawl`;
`feat(pages): position history over the user's calendar range`.

### Phase 7 — Frontend · change `tracker-screens`

Depends on: phase 6 (every endpoint exists). Decisions D3, D22, D24, D25, D34, D35. Each
sub-phase keeps `docker compose up -d --build` working; a screen joins the navigation when it is
finished, and until 7c the landing route `/pages` is a placeholder that says the list is coming.
The phase as a whole ends with all four screens and no placeholder.

**7a. Shell, session and sign-in**
- Deliverables: deps §12.1; `fe/postcss.config.cjs`; `fe/vitest.setup.ts` stubs; `main.tsx`;
  `Core/Configs/theme.ts`; `Core/Helpers/{SafeRedirectPath,FormatInZone}/` (+tests);
  `Gateways/_Shared/Request/UnauthorizedSignal/` (+test), `ABaseGateway` option;
  `Gateways/SessionGateway/` (+test); `ViewModels/SessionViewModel/` (+tests);
  `App/Guards/{requireSession,redirectIfSignedIn}.ts`; `App/Router/router.tsx`;
  `Modules/_Shared/{AppLayout,PageHeader,SectionError,EmptyState,NotFound,RouteError}/`;
  `Modules/SignIn/**`; removed `Modules/Home/`, `ViewModels/HealthViewModel/`,
  `Gateways/HealthGateway/`; temporary `/pages` placeholder ("Pages arrive in the next step") so
  the redirect target exists — replaced in 7c.
- Pre-conditions: phase 6 closed; the auth endpoints of phase 2; decisions D3, D24, D35 (shell).
- TDD: `safeRedirectPath.test.ts` → refuses `//evil.com`, `https://evil.com`, accepts
  `/pages?q=x`; `formatInZone.test.ts` → I26; `SessionGateway.test.ts` → 401 on me is `null`,
  401 on login is `{ kind: 'invalid' }` and does not notify; `SessionViewModel.test.ts` → shared
  in-flight `fetchSession`, sign-out resets; `SignInForm.test.tsx` → invalid credentials alert,
  inputs kept; a router test → visiting `/pages` signed out lands on `/sign-in?redirect=%2Fpages`
  — fail: nothing exists.
- Acceptance: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe lint && pnpm --filter fe build`;
  `docker compose up -d --build`; `curl -fsS http://localhost:8080/sign-in | grep -q 'id="root"'`.
- Regression guard: `pnpm --filter fe lint` (gateway import rule — guards call the ViewModel,
  never a gateway).
- Rollback: revert.
- Commits: `chore(fe): add Mantine, Recharts, SCSS and their test stubs`;
  `feat(fe): session view model, sign-in screen and the session guard`;
  `feat(fe): app shell with navigation and sign-out`; `refactor(fe): drop the health home screen`.

**7b. Clients screen**
- Deliverables: `Core/Constants/crawlStatusColor.ts`; `Gateways/ClientGateway/` (+test);
  `ViewModels/{ClientsViewModel,CrawlStatusViewModel}/` (+tests, services + tests);
  `Modules/_Shared/CrawlStatusBadge/`; `Modules/Clients/**` (+component tests); route `/clients`
  and the nav item.
- Pre-conditions: 7a; decisions D22, D33, D34.
- TDD: gateway → 409 `{ kind: 'exists' }`, 400 `{ kind: 'invalidUrl' }`; VM → `addClient` refusal
  sets `actionError`/`fieldErrors` and keeps `clients`, polling runs only while a run is active
  and stops on `stopPolling` (fake timers), superseded `fetchClients`; `AddClientForm.test.tsx` →
  409 shows the link to the existing client's pages; `RunLog.test.tsx` → items in sitemap order
  with badges — fail: nothing exists.
- Acceptance: `pnpm --filter fe test:ci && pnpm --filter fe build && docker compose up -d --build`;
  `curl -fsS http://localhost:8080/clients | grep -q 'id="root"'`.
- Regression guard: 7a tests. Rollback: revert (remove the nav item).
- Commits: `feat(fe): clients gateway and view models with crawl polling`;
  `feat(fe): clients screen — add form, clients table, re-crawl and run log`.

**7c. Pages list**
- Deliverables: `App/Router/SearchSchemas/PagesSearchSchema/` (+test);
  `Core/Helpers/PositionBucket/` (+test); `Gateways/PageGateway/` (list + test);
  `ViewModels/PagesViewModel/` (+tests, services + tests); `Modules/_Shared/PositionBadge/`;
  `Modules/Pages/**` (+component tests); the placeholder removed.
- Pre-conditions: 7b (clients for the filter and the header; `CrawlStatusViewModel`); D12, D25.
- TDD: search schema → malformed `page=abc` falls back to 1, `pageSize=999` to 20; VM →
  `emptyKind`, superseded, `refreshPages` silent on error; `PagesTable.test.tsx` → loading, error,
  both empty states, a row with "—"; `CrawlBanner.test.tsx` → "Crawling yoast.com — 6 of 15
  pages", the partial sentence; `PagesFilterBar.test.tsx` → typing writes `q` once after 300 ms
  and resets `page` — fail: nothing exists.
- Acceptance: `pnpm --filter fe test:ci && pnpm --filter fe build && docker compose up -d --build`;
  `curl -fsS http://localhost:8080/pages | grep -q 'id="root"'`.
- Regression guard: 7b — after adding a client the navigation to `/pages?clientId=` now has a
  real target (component test on the Clients screen asserts the navigate call).
- Rollback: revert. Commits: `feat(fe): pages list with URL-held filters, search and pagination`;
  `feat(fe): crawl banner that polls and reloads the list`.

**7d. Page detail**
- Deliverables: `App/Router/SearchSchemas/PageDetailSearchSchema/` (+test);
  `PageGateway.get/positions` (+tests); `ViewModels/PageDetailViewModel/` (+tests, services +
  tests); `Modules/PageDetail/**` (+component tests); list rows become links.
- Pre-conditions: 7c; D13.
- TDD: `resolveRange.test.ts` → 7d/30d/90d/12m from `todayInZone` in the user's zone;
  `buildHistoryTable.test.ts` → latest, change (+ is better = lower number), best, worst;
  VM → history superseded when the range changes twice, not-found on 404; `PositionTable.test.tsx`,
  `KeywordToggles.test.tsx`, `IssuesSection.test.tsx` (grouping and sentences) — fail: nothing
  exists.
- Acceptance: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe lint && pnpm --filter fe build`;
  `docker compose up -d --build && docker compose run --rm seed`; then by hand in a browser at
  http://localhost:8080: sign in as both seed users, open a page, switch ranges, check the chart's
  inverted axis — and `curl -fsS http://localhost:8080/pages/1 | grep -q 'id="root"'`.
- Regression guard: whole `pnpm test`. Rollback: revert (rows stop linking).
- Commits: `feat(fe): page detail header and KPI cards`;
  `feat(fe): position history chart and table over a chosen range`; `feat(fe): SEO issues by severity`.

### Phase 8 — README and clean-clone verification · change `readme-and-clean-clone`

**8a. README** — Deliverables: `README.md` rewritten (§18). Pre-conditions: phase 7.
TDD: none (prose). Acceptance: `git grep -n -E "change-me|demo-password" -- README.md` lists only
the documented demo password line; the README's command block is the one 8b runs verbatim.
Regression guard: none — documentation only. Rollback: revert. Commits: `docs: README — run, decisions, next steps, AI tools`.

**8b. Clean clone** — Deliverables: none in the tree (findings become `AMENDED` lines or fixes).
Pre-conditions: 8a; the branch pushed. TDD: none — the run itself is the check. Regression
guard: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db` after any fix.
Acceptance, in a fresh directory with the main stack stopped (`docker compose down`, never `-v`).
`docker-compose.yml` pins `name: seo-keyword-tracker`, so a clone in another directory would
reuse the existing `seo-keyword-tracker_postgres-data` volume and verify nothing; the run sets
`COMPOSE_PROJECT_NAME`, which overrides the top-level `name`, and otherwise runs the README's
commands verbatim:
`git clone <repo-url> skt-clean && cd skt-clean && git checkout feat/keyword-tracker && cp .env.example .env && export COMPOSE_PROJECT_NAME=skt-clean && docker compose up -d --build && docker compose run --rm seed`,
then `curl -s -c c.txt -H 'Content-Type: application/json' -d '{"email":"semrush.manager@example.com","password":"demo-password-change-me"}' http://localhost:8080/api/auth/login`
→ 200 and `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20'` → `total` ≥ 15; and
the browser walk of 7d. Rollback: n/a. Commits: any fix found, as `fix(...)`.

### The order of the changes

`test-harness-and-ci-database` → `user-sessions-and-default-deny` → `clients-and-blog-crawl` →
`page-analysis` → `positions-and-seed` → `pages-and-position-history` → `tracker-screens` →
`readme-and-clean-clone`. Two capabilities receive requirements from two changes:
`be/src/modules/pages` (PAGES-001 from `positions-and-seed`, PAGES-002…008 from
`pages-and-position-history`) and `_root/time-zones` (TZ-001…003 from `pages-and-position-history`,
TZ-004 from `tracker-screens`). Archive in this order so each fold lands on the previous one.

| change | capabilities (delta paths under `specs/`) | ids |
| --- | --- | --- |
| `test-harness-and-ci-database` | none (`skip_specs: true`) | — |
| `user-sessions-and-default-deny` | `be/src/modules/auth`, `_root/data-isolation` | AUTH-001…009, ISO-001…005 |
| `clients-and-blog-crawl` | `be/src/modules/clients`, `be/src/modules/crawl`, `be/src/infrastructure/remote-api` | CLIENT-001…007, CRAWL-001…010, REMOTE-001…004 |
| `page-analysis` | `be/src/modules/page-analysis` | ANALYSIS-001…007 |
| `positions-and-seed` | `be/src/modules/pages`, `be/src/seed` | PAGES-001, SEED-001…005 |
| `pages-and-position-history` | `be/src/modules/pages`, `_root/time-zones` | PAGES-002…008, TZ-001…003 |
| `tracker-screens` | `fe/src/App`, `fe/src/Gateways`, `fe/src/Modules/{SignIn,Pages,PageDetail,Clients}`, `_root/time-zones` | SHELL-001…004, GATEWAY-001, SIGNIN-001…002, PAGELIST-001…005, PAGEDETAIL-001…005, CLIENTSUI-001…005, TZ-004 |
| `readme-and-clean-clone` | none (`skip_specs: true`) | — |

CRAWL-009's "hidden from user-facing reads" half is pinned only once the reads exist
(`page-list.repository.int-spec.ts`, phase 6); phase 3 pins the "deletes nothing" half.

## 16. Risks

| risk | check that catches it |
| --- | --- |
| A live site blocks the bot User-Agent or changes its sitemap layout (semrush is behind a bot filter) | the seed exits 1 naming the run's error code (5c acceptance); fixtures keep CI green; Q9 |
| scrypt at N = 2^17 needs 128 MiB per hash; concurrent logins spike memory | `maxmem` set (2b spec); login throttle; `docker stats` during 5c's login curl |
| drizzle-kit emits the trgm index before the extension | 6b's fresh-database run |
| An enum not exported from a schema file is not migrated | 3b/4a "read the SQL" step lists every `CREATE TYPE` |
| Node's bundled undici and the `undici` package disagree when mixing global `fetch` with the package's `Agent` | the transport uses the package's own `fetch` (Q5); 3e transport spec runs a real connection |
| DST conversion off by an hour | 6a table + 6d e2e |
| A reviewer's browser zone leaks into dates | `formatInZone` Tokyo case (7a) |
| The worker's analysis blocks the API event loop | 3g/4e: `curl -w '%{time_total}' /api/health` during a live crawl stays well under a second; if not, run the worker as its own container from the same image (D19's flag) |
| Polling continues after leaving a screen | VM fake-timer tests (7b, 7c) |
| Mantine major differs from v8 assumptions | 7a VERIFY; `pnpm --filter fe typecheck` |
| e2e suites hit the login throttle | throttle keyed by IP + email; `sign-in.ts` signs each user in once per suite |
| The CI `db-tests` job skips instead of failing | `E2E_REQUIRE_INFRA=1` + 1a's negative acceptance |
| The clean-clone check silently reuses the developer's database volume (the compose file pins its project name) | 8b sets `COMPOSE_PROJECT_NAME=skt-clean`; `docker volume ls` shows `skt-clean_postgres-data` created by the run |

## 17. Cross-workspace touchpoints

| change | be | fe | contracts | docker / env | CI |
| --- | --- | --- | --- | --- | --- |
| harness | test config, migrate refactor | — | — | `.env.example` TEST_DATABASE_URL | `db-tests` job |
| sessions | auth module, guard, core primitives | — (health still public) | auth, error codes | — | — |
| clients + crawl | clients, crawl, remote-api, pages (table) | — | clients, crawl | `be` worker flag | — |
| analysis | page-analysis, pages repos | — | seo catalogue | — | — |
| positions + seed | snapshots, seed CLI | — | — | `seed` service, SEED_USER_PASSWORD | — |
| pages API | pages module | — | pages, time | — | — |
| screens | — | everything in §12 | consumed | — | — |
| README | — | — | — | README | — |

A contracts change is built before both workspaces (`pnpm typecheck` does it); a response field
and its FE schema change in the same commit from phase 7 on.

## 18. README and harvest

**README (one page)**:
1. What it is (two sentences).
2. Run from a clean clone — exactly: `git clone …`, `cd …`, `cp .env.example .env`,
   `docker compose up -d --build`, `docker compose run --rm seed`, open http://localhost:8080,
   sign in as `semrush.manager@example.com` or `yoast.manager@example.com` with the
   `SEED_USER_PASSWORD` value from `.env` (demo value shown). Local development and checks
   (`pnpm test`, `pnpm test:db`) in three lines.
3. Decisions and why, one line each: global keyword dictionary; instants in UTC + the user's zone
   column + noon capture; best position; read-time latest positions; isolation in the query plus
   default deny plus the e2e matrix; server-side sessions + scrypt; Postgres queue on
   `crawl_runs`; multi-signal sitemap discovery; field-weighted keywords; nothing deleted on
   re-crawl; **the listing-page interpretation** — "first 15 blog posts" excludes pages declaring
   themselves listings (Yoast's `/seo-blog/`), visible in the run log.
4. Unfinished and next steps: Postgres RLS as defence in depth; HTML/feed fallback without a blog
   sitemap; network SEO checks (Lighthouse/axe, broken links); a Playwright smoke test; sorting by
   position; anything amended during implementation.
5. AI tools used: Claude Code — planning, OpenSpec changes, implementation and review.

**Harvest (before each change is archived)**:
- `be/src/modules/auth/AUTH_MODULE.md` (new): session design, scrypt parameters and `maxmem`, why
  scrypt over the practice's argon2/bcrypt (no native dependency), RLS as the next step.
- `be/src/modules/clients/CLIENTS_MODULE.md` (new): site-key identity, the queue states, fencing.
- `be/src/modules/crawl/CRAWL_MODULE.md` (new): discovery scoring and the rejected alternatives,
  the listing interpretation, fixture recording.
- `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` (new): keyword method, rejected methods,
  where thresholds live.
- `be/src/modules/pages/PAGES_MODULE.md` (new): currentness rule, read-time positions and D7's
  reopen trigger, the EXPLAIN result.
- `be/skills/performance-patterns/SKILL.md`: the measured list-query plan and snapshot volume.
- `practices/be/nestjs/testing-patterns/SKILL.md`: the in-band exception to "truncate once",
  `be/test/` as this repository's location (Q4).
- `fe/skills/data-retrieval/SKILL.md`: polling a run inside a ViewModel closure, stopped on unmount.
- Deposits (after archive, `openspec/README.md` §8): each requirement id into the module document
  that owns its invariant, naming the spec path and the pinning test.

## 19. Out of scope

| item | reason |
| --- | --- |
| Postgres row-level security | defence in depth on top of query scoping; README next step (D8, D29) |
| HTML or feed crawl without a blog sitemap | the brief is "the blog sitemap"; README next step (D14, D29) |
| Network SEO checks, Lighthouse, axe | out of the brief's depth; README next step (D16, D29) |
| Playwright / browser e2e | the end-to-end path is verified by the clean clone; README next step (D26, D29) |
| SSE or websockets for crawl progress | polling every 2 s is enough for a 15-page crawl (D22) |
| pg-boss, BullMQ, fire-and-forget | a queue on `crawl_runs` keeps status and work in one row (D19) |
| LLM or SERP APIs for keywords or positions | positions are invented by the brief; keywords stay explainable (D15, D17) |
| Primary-keyword or average position | best position is the standard reading (D6) |
| Sorting the list by position | would need denormalization; D7's reopen trigger |
| A fifth screen | exactly the brief's four (D34 reverses D28) |
| Sign-up, password reset, editing the time zone | not in the brief; the zone is seeded (D3, D35) |
| Deleting or renaming clients, cancelling runs | not in the brief; Q11 |
| Spoofing a browser User-Agent | an honest bot UA is the policy (D20); Q9 |

## 20. Open questions and the decision log

### Open questions

Q4-Q12 below were accepted with their defaults (D36); none is open.

- **Q1 — Seed credentials.** Resolved by D27.
- **Q2 — A clients view.** Resolved by D28, then D34.
- **Q3 — Out of scope.** Resolved by D29.
- **Q4 — Where DB tests and fixtures live.** D26 names `be/test/fixtures`; the practice names
  `be/testing/` for e2e. Default: `be/test/` for fixtures, support and e2e (one directory, not
  two siblings); the practice gains a line in harvest. Reopens if a reviewer prefers the
  practice's path (`git mv`, no code change).
- **Q5 — `fetch` implementation.** D20 says Node's built-in fetch (undici). Default: `fetch` and
  `Agent` from the `undici` package — the same implementation — because a DNS-pinned
  `connect.lookup` needs an `Agent`, and mixing the package's `Agent` with Node's global `fetch`
  depends on matching versions. Reopens if the global `fetch` is shown to accept the package's
  dispatcher reliably on Node 24.
- **Q6 — robots.txt parsing.** Default: the `robots-parser` package. Reopens on a parsing defect
  in a fixture.
- **Q7 — Stop-word lists.** Default: the `stopword` package's lists by primary language subtag;
  unknown → none (D15). Reopens if a fixture post's keywords are dominated by function words.
- **Q8 — Rate limits.** Default: `@nestjs/throttler`, in-memory; login 10/min per IP + email;
  adding a client and re-crawl 10/min per user. Reopens if the API runs as more than one instance.
- **Q9 — A site that refuses the bot.** Default: no UA spoofing; the run fails with its reason and
  the seed exits non-zero; the README says so. Reopens if the semrush seed run fails with 403.
- **Q10 — Paginating clients.** Default: not paginated. Reopens at 100 clients per user.
- **Q11 — Deleting a client.** Default: not offered. Reopens if the brief or a reviewer asks.
- **Q12 — Mantine major.** Default: v8 (string dates). Reopens if `pnpm add` resolves another
  major (7a VERIFY).

### Decision log (verbatim, append-only)

D1. Keywords are a global dictionary: keywords(term UNIQUE), page_keywords(page_id, keyword_id, relevance), rank_snapshots keyed by (page_id, keyword_id, <time>) with a composite FK to page_keywords. Why: mirrors the brief's domain (a keyword is a search term; a snapshot is page × keyword × date), keeps snapshot integrity in the schema, and makes keyword search hit a small table.

D2. Snapshot time is an instant: rank_snapshots.captured_at timestamptz, PK(page_id, keyword_id, captured_at). The seed captures once a day at 12:00 UTC, never in the future. Conversion to the user's zone happens in exactly two places: the API turns the user's calendar dates into UTC bounds [from 00:00, to+1 00:00) in the user's zone, and the FE formats instants with Intl in that zone. Why: "stored in UTC" taken literally, correct across DST; 12:00 UTC keeps the UTC date and the Toronto date equal so a daily point never looks shifted. Pinned by a DST-boundary test.

D3. The user's zone is a column: users.time_zone (IANA name), seeded 'America/Toronto'. Why: the zone belongs to the user, the backend knows it without trusting the client, and every reviewer sees the same dates regardless of their machine. Rejected: browser zone (machine-dependent), a global constant (hard-codes one user's city).

D4. SEO issues are a table: seo_issues(id, page_id FK ON DELETE CASCADE, code varchar(64), severity seo_issue_severity_enum (error|warning|notice), details_json jsonb, UNIQUE(page_id, code)). code is a key of a rule catalogue in @app/contracts; a test pins that the analyser emits only catalogued codes. Why: an issue is one of the brief's six entities; counting and filtering stay plain SQL. Severity is a closed set (enum); codes grow (varchar).

D5. Crawl state is a table: crawl_runs(id, client_id FK, status crawl_status_enum (queued|running|succeeded|partial|failed), trigger (seed|user), sitemap_url, pages_found, pages_done, error_code, error_message, started_at, finished_at, created_at), with UNIQUE(client_id) WHERE status IN ('queued','running'). Why: the run's status and failure reason are data, history survives a re-run, the seed and the UI share one path, and a double start is impossible by schema.

D6. A page's "latest position" in the list is its BEST position: the minimum position across the page's keywords at their latest capture, returned with the keyword that produced it and the capture instant; every keyword chip also carries its own latest position. null when the page has no snapshots yet (a client added after the last seed). Why: the standard tracker reading, robust to a wrong guess about the primary keyword. Rejected: primary-keyword position, average.

D7. Latest positions are computed at read time with a LATERAL lookup per (page, keyword) on the snapshot PK, only for the pages on the current list page; nothing is denormalized. Why: one source of truth, cannot drift; at this data size an index lookup per pair is cheap. An EXPLAIN of the list query on the seeded database is part of the phase's acceptance. Reopen if the list ever needs sorting by position.

D8. Isolation is enforced in the query, carried by a type. Every repository method over a user's data takes `scope: IUserScope` first (created only by the session guard) and joins to clients.user_id in SQL. A foreign id answers the same 404 as a missing one. Worker-only methods without a scope have distinct names (…ForWorker) and are never called from a controller. An e2e matrix on a real database proves, for every route that takes an id or a clientId, that user B gets 404 for user A's objects. Rejected for now: Postgres RLS — named in the README as the next defence-in-depth step.

D9. "Same website" = same site_key: the lower-cased host (punycode via URL) without a leading "www."; scheme, default port, path, query and trailing slash ignored. UNIQUE(user_id, site_key); a unique violation (23505) from a concurrent insert maps to 409 CLIENT_ALREADY_EXISTS. website_url stores the origin as entered; a missing scheme becomes https://. Rejected as invalid (400): non-http(s) schemes, credentials in the URL, IP literals, localhost, hosts without a dot. Subdomains other than www are different sites.

D10. Sessions are server-side: sessions(id, user_id FK ON DELETE CASCADE, token_hash bytea UNIQUE, expires_at, created_at, last_seen_at). Cookie `sid` = 32 random bytes, HttpOnly, SameSite=Lax, Path=/, Secure outside localhost; only sha256(token) is stored. 7-day sliding expiry; logout deletes the row; expired rows are purged on login. CSRF: SameSite=Lax + same-origin + mutating endpoints accept application/json only. Login returns one error for unknown email and wrong password, and is rate-limited. Endpoints: POST /auth/login, POST /auth/logout, GET /auth/me (user + timeZone). The session guard creates IUserScope.

D11. Passwords are hashed with node:crypto scrypt (N=2^17, r=8, p=1, 16-byte salt), stored as `scrypt$N$r$p$salt$hash`; compared with timingSafeEqual.

D12. Pages list: GET /api/pages?clientId&q&page&pageSize(<=50) -> { items, page, pageSize, total }. q matches p.url ILIKE OR an EXISTS over the page's keywords with term ILIKE, with %/_ escaped; GIN gin_trgm_ops indexes on pages.url and keywords.term (pg_trgm created in a drizzle-kit --custom migration before the indexes). Order: client name, then the page's position in its sitemap (pages.sitemap_position). A clientId the user does not own answers 404. List state lives in the URL search params.

D13. Page detail is two endpoints, both scoped: GET /api/pages/:id (page, keywords with latest positions, issues, last crawl) and GET /api/pages/:id/positions?from&to (calendar dates in the user's zone). History response: { from, to, timeZone, series: [{ keywordId, term, points: [{ capturedAt (UTC ISO), position }] }] }; a keyword with no points in range keeps an empty series. Range rules: default last 30 days in the user's zone; from <= to; at most 366 days, otherwise 400 INVALID_DATE_RANGE; a future `to` is clamped to today. One PK range scan. A DST-boundary e2e test pins the conversion.

D14. Blog sitemap discovery is a multi-signal score, no page fetches before selection. Discovery: robots.txt Sitemap lines, else well-known paths (/sitemap.xml, /sitemap_index.xml, /wp-sitemap.xml, /sitemap-index.xml, /sitemap/); indexes expanded recursively (depth <= 3, <= 50 fetches), .gz supported; only same-site_key sitemaps and URLs. Feed discovery: <link rel="alternate" type="application/rss+xml|atom+xml"> on the home page, else /feed/, /blog/feed/, /rss.xml. Score per candidate = name tokens (blog +3; post/article +2; news +1; page/product/category/tag/author/video/image/… -3) + share of URLs under a common /blog|news|articles/ segment (0..3) + share of feed URLs it contains (0..4, strongest). Numbered siblings (post-sitemap, post-sitemap2) form one group, concatenated in index order. Below the threshold the run fails with BLOG_SITEMAP_NOT_FOUND (SITEMAP_NOT_FOUND when no sitemap exists). crawl_runs records sitemap_url and selection_reason. Post selection, in sitemap order: skip the site root, non-HTML, and pages declaring themselves listings (JSON-LD CollectionPage/ItemList); unmarked pages count as posts; stop at 15 posts or 30 candidates. Rejected: name+path only, content sampling for selection, feed/HTML fallbacks without a sitemap (README next step).

D15. Keywords = field-weighted on-page phrases with a client-corpus IDF penalty and a declared-metadata bonus. Candidates: 1-3-grams from the main content (main/article; nav, header, footer, aside, script removed) that neither start nor end with a stop word (list by <html lang>; unknown language -> no stop words, short n-grams). Normalization: lower case, NFKC, collapsed whitespace, punctuation stripped. Field weights: title 5 (brand suffix after a separator removed), h1 4, URL slug 3, meta description 2, h2/h3 2, first paragraph 1.5, body 1; bonus for presence in several strong fields; small bonus when it matches JSON-LD keywords / article:tag; multiplied by an IDF penalty over the run's pages (site-wide terms fade). Subsumed duplicates removed; top 5-8 above a floor, stored with relevance 0..1 on page_keywords. Computed once per crawl run, after all its pages are fetched. Rejected: weights only, YAKE/RAKE, plain TF-IDF, LLM/SERP APIs.

D16. SEO issues: TITLE_MISSING (error), TITLE_LENGTH <30|>60 (warning), META_DESCRIPTION_MISSING (warning), META_DESCRIPTION_LENGTH <70|>160 (notice), H1_MISSING (error), H1_MULTIPLE (warning), HEADING_SKIP (notice), CANONICAL_MISSING (warning), CANONICAL_MISMATCH (notice), NOINDEX via meta or X-Robots-Tag (error), IMAGES_MISSING_ALT (warning), THIN_CONTENT <300 words (warning), LANG_MISSING (notice), OG_TAGS_MISSING (notice), NOT_HTTPS (error), REDIRECTED (notice), SLOW_RESPONSE TTFB>1.5s (notice), LARGE_PAGE HTML>1MB (notice), KEYWORD_NOT_IN_TITLE (notice, runs after keywords). Thresholds are named constants in the catalogue; each rule is a pure function with a table-driven test; details_json says what exactly is wrong. Rejected: network checks, Lighthouse/axe (README next steps).

D17. Positions: a deterministic mean-reverting random walk per (page, keyword). PRNG seeded from a hash of (page url, term); baseline from relevance (strongest keyword ~3-15, weak ~30-90); daily step pos = clamp(1..100, pos + revert*(base-pos) + noise ± rare jump). History length days = max(365, ceil(50_000 / pairs)), ending at the latest 12:00 UTC not in the future. Batched inserts (~5k rows) with ON CONFLICT DO NOTHING. A test asserts COUNT(*) >= 50_000 after the seed.

D18. The seed is idempotent, one command: (1) upsert the two users by email and their clients; (2) crawl a seed client only if it has no successful run, through the same crawl service the UI uses (trigger=seed); (3) generate positions for EVERY current page-keyword pair in the database, UI-added clients included — full history for new pairs, fill-up to today for existing ones, continuing each walk from its last stored position. Nothing is deleted. A --positions-only flag exists for debugging. Pinned by a test: re-running adds no duplicates and gives new pages a history.

D19. Crawl runs execute through a Postgres queue on crawl_runs itself: a worker loop inside the API process (CRAWL_WORKER_ENABLED, so it can move to its own container from the same image) claims work with UPDATE … WHERE id = (SELECT … WHERE status='queued' OR (status='running' AND locked_until < now()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *, renews locked_until as a heartbeat, runs at most 2 runs concurrently, polls every ~2 s and is woken immediately after a run is enqueued. attempts <= 3, then failed. Page writes are idempotent (UNIQUE(client_id, url) + upsert) because a reclaimed run may execute twice. New columns: crawl_runs.locked_until, crawl_runs.attempts. POST /clients creates the client and its queued run in one transaction. Rejected: fire-and-forget, pg-boss, BullMQ.

D20. Crawler stack: Node's built-in fetch (undici) with redirect:'manual' and a streamed body limit, cheerio for HTML, fast-xml-parser for sitemaps and feeds. Policies: 10 s timeout per request, <= 5 redirects, HTML <= 5 MB, sitemap <= 50 MB compressed / 10 MB-per-file parsed, DNS resolution on every hop with private/loopback/link-local addresses refused (SSRF), User-Agent "SeoKeywordTrackerBot/1.0 (+repo URL)", <= 3 parallel fetches per run, 2 retries with backoff on 429/5xx/network errors honouring Retry-After, robots.txt honoured (a disallowed URL is skipped with ROBOTS_DISALLOWED and the next candidate is tried).

D21. Only successfully fetched posts become pages. A failed candidate is skipped and the next one tried (<= 30 candidates). Run status: succeeded (15 posts), partial (1-14), failed (0 posts or discovery failed). Failures are recorded on the run as failures_json [{url, reason, httpStatus}] (<= 30 entries). [amended by D33]

D22. The FE learns crawl progress by polling GET /api/clients/:id (client + latestRun {status, pagesFound, pagesDone, errorCode, …}) every 2 s while queued/running, stopping at a terminal status and when the view unmounts; the pages list reloads after succeeded/partial. Rejected: SSE.

D23. The seed is a one-shot compose service `seed` (backend image, profiles: [tools], after migrate), run explicitly: `docker compose run --rm seed`; locally `pnpm seed`. It crawls through the same crawl service the worker uses (crawl_runs with trigger=seed) and waits for completion. An empty list shows a hint with the seed command.

D24. UI: Mantine (@mantine/core, @mantine/dates for the date range, @mantine/notifications) with SCSS modules for the app's own styles; Recharts for the position chart (inverted Y axis, position 1 on top). Needs the Mantine PostCSS preset (postcss-preset-mantine + postcss-simple-vars) and jsdom stubs (matchMedia, ResizeObserver) in tests.

D25. After adding a client the user lands on the pages list filtered to that client, with a crawl status banner that polls (D22): "Crawling semrush.com — 6 of 15 pages"; the list reloads on completion; partial/failed show the reason in plain words. The client filter shows each client's latest crawl status as a badge.

D26. Test strategy (TDD: every sub-phase starts with the failing tests it names). BE unit (Jest) for pure logic, written first: URL normalization, sitemap scoring, post selection, keyword extraction, SEO rules, position generator, user-zone date range -> UTC. Crawler tests are offline: snapshots of both sites' robots.txt, sitemap indexes, blog sitemaps, feeds and a few posts in be/test/fixtures, plus synthetic cases (no robots, gzip, root-level blog without a feed, unusual name, CollectionPage), served by a fixture transport — tests never touch the network. Repository integration and API e2e (supertest) run on a real Postgres: locally a seo_tracker_test database in the compose container with migrations applied first, in CI a postgres:18 service container; DB tests run in band with isolation between tests. API e2e covers auth, the isolation matrix, POST /clients 400/409/201, list filters and pagination, history across a DST boundary. FE (Vitest): ViewModels via gateway-prototype spies, services, key components. No browser e2e; the end-to-end path is verified by following the README on a clean clone. Playwright smoke is a README next step.

D27. Seed users: semrush.manager@example.com (client "Semrush", https://www.semrush.com) and yoast.manager@example.com (client "Yoast", https://yoast.com), time_zone America/Toronto; one password from SEED_USER_PASSWORD with a demo value in .env.example; the README lists both emails. No secret in the code.

D28. A fifth screen is added: Clients. [reversed by D34]

D29. Out of scope, each with its reason in the README "next steps": Postgres RLS, HTML/feed fallback without a blog sitemap, network SEO checks, Playwright smoke.

D30. A full re-crawl is available at any time (not while a run is active — the partial unique index from D5 forbids it).

D31. Re-crawl deletes nothing. pages and page_keywords carry last_seen_run_id; a re-crawl upserts the posts it finds (issues of a re-fetched page are replaced; keywords recomputed: new pairs inserted, surviving pairs get their relevance updated). What the user sees is "current": pages and pairs whose last_seen_run_id is the client's latest successful (or partial) run. Pages and pairs that dropped out keep their history but are hidden; the seed extends only current pairs. One condition in the owned repository methods, pinned by an integration test ("a page absent from the latest run is not listed").

D32. The backend is default-deny: a global session guard protects every route; only POST /api/auth/login and GET /api/health are @Public(). An e2e test enumerates the registered routes and asserts each answers 401 without a session, so a new unguarded route cannot pass silently. The README names the listing-page interpretation explicitly (the Yoast /seo-blog/ case).

D33. (amends D21) Every candidate a run considers is recorded, in sitemap order, with its outcome: crawl_run_items(run_id FK, sitemap_position int, url, status crawl_item_status_enum (crawled | skipped_listing | skipped_robots | skipped_not_html | skipped_other_site | failed), reason varchar, http_status smallint NULL, page_id FK NULL, PK(run_id, sitemap_position)). crawl_runs.failures_json is dropped in favour of it. The run log shows the items as an ordered list with status badges and reasons, so "the first 15 posts in sitemap order" is visible and verifiable, including why a listing page was skipped.

D34. (reverses D28) No fifth screen — exactly the brief's four. Screen 4 "Add a client" hosts the add form and, below it, the user's clients: name, website, page count, latest run status and time, a Re-crawl action (disabled while a run is active), "View pages" (the list filtered to that client), and an expandable run log of candidates in sitemap order with status badges and reasons (D33). The pages-list banner (D25) stays. The README notes the listing-page interpretation and points at the run log as its evidence.

D35. Screen layouts follow common data-table and rank-tracker conventions (sources: Semrush Position Tracking "Pages" report; Ahrefs Rank Tracker overview = filters + expandable graphs + data table; data-table UX guidance = filter bar above the table, instant search with result count, pagination with page-size select below; detail-page pattern = header with summary metrics, then sections; rank charts use an inverted Y axis so position 1 is on top).
 Shell: Mantine AppShell top bar — product name, nav (Pages, Clients), user menu (email, Sign out); every screen opens with a page header (title, one-line subtitle, primary action on the right).
 1 Sign in: centred card, email + password, one generic error, no sign-up; returns to the originally requested URL (`redirect` search param).
 2 Pages list: header "Pages" + "N pages across M clients" + primary action "Add client"; crawl banner (D25) under the header; filter bar above the table — client select with status badges, search "Search URL or keyword" (debounced ~300 ms), clear-filters, result count "Showing 21–40 of 47"; columns: Page (title, muted URL, client badge), Keywords (chips with positions, first 3-4 + "+N"), Best position (number + keyword, coloured by bucket 1-3 / 4-10 / 11-20 / 21+), Issues (count, red when any error), Last captured (date in the user's zone); whole row links to detail; pagination with page-size select (20/50) under the table; all state in URL search params. Empty states: no clients (CTA Add client), no matches (clear filters), no positions yet ("—" with "appears after the next seed run").
 3 Page detail: breadcrumb Pages / client / page (back keeps the list's search params); header with title, external URL link, client badge, last crawled; KPI cards — best position (+keyword), keywords tracked, issues by severity, last crawl status; section "Position history": range presets 7d / 30d / 90d / 12m + custom picker, keyword toggles as legend chips, Chart|Table segmented control; Recharts line chart with inverted Y (1..100), dates on X in the user's zone; table view per keyword: term, relevance, latest, change over the range (arrow), best/worst in range; range in URL; section "SEO issues" grouped Errors / Warnings / Notices with a human sentence and the details.
 4 Add a client / Clients: header "Clients"; add form card on top (Name, Website URL with helper "We'll find its blog sitemap and crawl the first 15 posts"; 400 -> field error, 409 -> field error with a link to the existing client); clients table (client + site, current pages, last crawl status badge + time + "6 / 15" while running, actions View pages / Re-crawl); a row expands into the run log — selected sitemap and selection reason, then candidates in sitemap order with status badges and reasons (D33). After adding, navigate to the filtered list (D25).
 Status colours everywhere: queued grey, running blue with loader, succeeded green, partial yellow, failed red.

**Notes on how the log is applied.** D20's item reason `ROBOTS_DISALLOWED` is the D33 item status
`skipped_robots` with the reason "Disallowed by robots.txt" — D33 superseded the vocabulary.
D14's `selection_reason` is a column D5's list omits; §3.4 adds it. D35's "409 -> link to the
existing client" is served by the shared `parseWebsiteUrl` in contracts plus `siteKey` on
`IClient`, so the error body stays `{ errorCode, message }`. D35's "last crawl status" on the page
detail and the clients table's latest run are `IPageDetail.lastCrawl` and `IClient.latestRun`
(§5, §6).

D36. The owner accepted every default: Q4 (tests, fixtures, support and e2e under `be/test/`), Q5
     (`fetch` and `Agent` from the `undici` package), Q6 (`robots-parser`), Q7 (`stopword` lists by
     primary language subtag), Q8 (`@nestjs/throttler`, in memory: login 10/min per IP + email,
     add client and re-crawl 10/min per user), Q9 (no User-Agent spoofing; a refusing site fails
     its run with the reason), Q10 (clients not paginated), Q11 (no client deletion), Q12 (Mantine
     v8). The planner's own choices are accepted as written: the cross-module join rule, results
     written once per attempt, LISTEN/NOTIFY wake-up with the 2 s poll as a fallback, the seed's
     in-process worker, and the sitemap score threshold of 2. Q4-Q12 are closed.

D37. After delivery the owner tried real sites, and two defaults were reopened. Q11 is reversed: a
     client can be deleted (`DELETE /api/clients/:id`, everything its crawls produced goes with
     it). Discovery gains the HTML fallbacks the first design deferred, because blog.google,
     blog.canada.ca, united24media.com, nit.bg and about.instagram.com all failed it: a blog host
     and a Google News sitemap score, relative and sibling-subdomain sitemaps are read, and with
     no confirmed sitemap the feed, then a blog index page, then the best sitemap are tried — the
     last two counting only pages that declare themselves articles. A site refusing every request
     fails with the new `SITE_BLOCKED` code; Q9 stands, so such sites stay uncrawlable.
