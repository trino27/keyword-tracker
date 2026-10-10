# Issue report, PageSpeed measurement and Core Web Vitals

A marketer opens **Issues**, picks a client, and reads every problem the tracker knows about
that client's site on one screen: what is wrong, why it costs traffic, what to do and whom to
ask, sorted so the worst comes first and grouped either by problem or by page. Behind it, every
crawled page is measured by Google PageSpeed Insights without anyone pressing a button: the crawl
queues the page, a background worker asks Google (mobile), keeps the last good answer, retries
politely when Google is slow or busy, and re-measures at most once a day. The three Core Web
Vitals — LCP, INP, CLS — appear as traffic-light badges beside each page's score and as a Speed
block on the page; any badge that is not green is also an issue in the report. Speed never moves
the SEO score. Without a PageSpeed key the app still runs from a clean clone and says plainly that
speed is not configured. Rank positions stay simulated: PageSpeed is the only thing that talks to
Google.

**Status:** active — branch `feat/issue-report-and-pagespeed`

**Changes:** issue-catalogue-owners, page-speed-measurement, core-web-vitals-display, client-issue-report

## How to read this

Present tense describes the intended state, not the current one. Names marked **new** do not exist
yet; every other path, symbol and script was read in the tree while this was written. What could
not be verified is written `VERIFY:` and is not a claim. §1–§12 are the specification; §13–§14 say
what pins it; §15 is the sequence. Each change's `tasks.md` is **generated from §15** and is
corrected through this document, never beside it. The requirement-id convention, the delta heading
form, the harvest rule and the task vocabulary are owned by `openspec/README.md` and
`openspec/config.yaml` and are not restated here. The decision log (§20) is verbatim; D21–D26 are
consequences the planner derived from it, marked so, and confirmed by the user on 2026-10-10;
D27 and D28 record how open questions O6 and O7 were resolved the same day; D29 records the
user's addition of Phase 6, which keeps this plan active after phases 1–5 closed.

---

## 1. User-visible behaviour

### 1.1 Navigation

The header reads **Pages · Issues · Clients**. Issues opens `/issues?clientId=<id>`; without a
`clientId` it opens the user's first client by name and writes that id into the URL (D18).

### 1.2 Issues (`/issues`) — new

**Header.** Title "Issues", a client selector (the user's clients by name), and a line naming
the snapshot: "From the crawl that finished Oct 9, 14:02" (the user's zone). Below it the
severity rubric, always visible, three lines (D9):

- **Critical** — the page will not appear in search, or drops out of it.
- **Important** — the page shows, but ranks or is clicked less than it could.
- **Improvement** — good practice; worth doing when the above are done.

The PageSpeed state (D27) adds one line. `notConfigured`: a grey notice, "Speed issues need a
PageSpeed key — see the README." `keyRejected`: a red notice, "Google rejected the PageSpeed key —
speed measurements are paused. See the README." `active`: a dimmed line, "Speed figures are
Google's mobile measurements; pages are re-measured at most once a day."

**Controls.** Group by: **By issue** (default) | **By page**. Filters: level checkboxes
Critical · Important · Improvement, with **Improvement unchecked by default** (D9); type
All · SEO · Speed · Site (D19); a URL search box. All of it lives in the URL.

**By issue (default).** One section per level, Critical first. Within a level, one card per
issue code, ordered by how many pages it affects, most first; a collapsed whole-site speed row
counts as its N pages (D19). Each card:

- the plain **what** as its title, a level badge, and "affects 6 pages" (or "Whole site");
- **Why it matters** — the plain *why*;
- **What to do** — the plain *fix*, which names who does it (CMS editor or developer);
- a collapsed **Technical details** with the catalogue label, hint, explanation and sources —
  the curated text, unchanged (D14);
- the affected locations: each page as a link to its detail with the finding's own sentence
  ("The title is 72 characters; aim for 30–60."), or **Whole site** for a site check, or
  **Whole site (15 pages)** for a speed figure Google only has for the whole site (D8).

A lab-sourced speed figure carries "lab test, may vary".

**By page.** One section per page — URL, title, link to detail — ordered by its count of
Critical, then Important, then Improvement findings, then URL. Above the pages, a **Whole site**
section holding site checks and whole-site speed rows. Inside each section the same cards,
condensed (what + sentence + level), Technical details collapsed.

**From the pages list.** Clicking a row's issue count opens `/issues?clientId=X&pageId=Y`: the
report filtered to that page, **with Whole site rows still shown** (D17), and a chip
"Page: <title> ×" that clears the filter.

**States.** Loading (skeleton cards). Error (the shared section error with Retry). No clients
("Add a client to see its issues", action Add client). Client not found — another user's or a
deleted id — ("This client was not found", link to Clients) (D18). No finished crawl yet ("No
crawl of this client has finished yet"). Nothing at all ("No issues on the latest crawl").
Nothing after filters ("No issues match these filters", action Clear filters). A `pageId` that is
not on the latest crawl ("That page is not on the latest crawl" above the site-wide rows).

### 1.3 Pages (`/pages`)

A **Core Web Vitals** column sits right of **Score** (D20). Each cell holds three small badges,
`LCP · INP · CLS`, coloured green (good), yellow (needs improvement), red (poor), grey (no data).
A badge's tooltip reads, for example, "LCP 3.1 s — needs improvement. Real visitors to this page,
measured Oct 9." Sources read "Real visitors to this page", "Real visitors to the whole site"
(origin) or "Lab test, may vary". A legend under the table: "Red = Important, yellow =
Improvement in Issues. Speed is scored separately from the SEO score."

Cell states: **Measuring…** (queued or running, nothing measured yet); **badges** (a measurement
exists); badges with a small warning icon whose tooltip reads "Couldn't refresh: Google could not
load the page. Showing the measurement from Oct 8." (the last attempt failed but an earlier one
succeeded); **Couldn't measure: <reason>** (failed, nothing ever measured); **Not measured** (the
page has no queue row — crawled before this feature and not re-crawled or seeded since). When
the PageSpeed state is `notConfigured` the column header carries "PageSpeed not configured" with a
tooltip pointing at the README, and the cells are empty dashes rather than grey badges (D12). When
it is `keyRejected` the header carries a red "PageSpeed key rejected" whose tooltip reads "Google
rejected the PageSpeed key — speed measurements are paused. See the README."; the cells keep any
measurement already stored, and a row that would read "Measuring…" reads "Paused" instead,
because nothing is measuring (D27).

The **SEO issues** count becomes a link to the report for that page (D18). Speed findings count
in it (D7). The **Score** column, its number and the list's order are unchanged (D7).

### 1.4 Page detail (`/pages/:pageId`)

A **Speed (Core Web Vitals, mobile)** block sits between the KPI cards and the position history
(D20). Three cards — LCP, INP, CLS — each with the value ("3.1 s", "180 ms", "0.12"), the band
in words and colour, the source in plain words, and the measurement date; INP without field data
reads "No data — Google has no real-visitor measurement of responsiveness for this page or
site." A caption reads "Lighthouse performance score (lab): 72/100 — a lab test, it may vary
between runs" (D26). The block's states are the cell states of §1.3, written as sentences;
under `keyRejected` the block opens with "Google rejected the PageSpeed key — speed measurements
are paused. See the README." above whatever measurement is stored (D27).

**How this score is calculated** gains a paragraph: "Speed is scored separately. Core Web Vitals
are shown in the Speed block and count as issues below, but they do not change this score — the
way Lighthouse keeps SEO and Performance apart." (D7)

**SEO issues** lists speed findings among the others, with their sentence: "LCP is 3.1 s for
this page's real visitors; good is 2.5 s or less."

### 1.5 Clients (`/clients`)

Each row gains **View issues** beside **View pages**, opening `/issues?clientId=<id>` (D18).

### 1.6 What the reader is told about severity names

The three levels are named Critical / Important / Improvement wherever severity is shown — the
report, the page's SEO issues section, the list's issue badges and the run log's site checks —
from one record (D28).

---

## 2. Principles

- **P1 — One writer per finding.** Every catalogue code names the one process that writes it, and
  a writer replaces only its own codes. *Consequence:* the crawl and the PageSpeed worker never
  delete each other's findings, and two concurrent writes cannot conflict.
- **P2 — One threshold, one place.** A CWV threshold exists once, in `@app/contracts`; the badge,
  the issue code and the catalogue bound are all derived from it. *Consequence:* a badge and its
  issue cannot disagree except across a threshold change, which §16 R7 names.
- **P3 — Google is never on the request path.** Screens read the database; only the worker talks
  to Google. *Consequence:* opening a screen costs no quota and never waits on Google.
- **P4 — A failure never erases knowledge.** A failed or interrupted attempt touches the job
  columns only. *Consequence:* the last good measurement survives every outage, and the screen
  says how old it is.
- **P5 — Absence is explained, never rendered as zero.** No key, a rejected key, no data, not yet
  measured and could not measure are five different sentences. *Consequence:* no grey badge means two things.
- **P6 — The score is the SEO score.** Speed has its own scale and never enters the crawl's
  counters. *Consequence:* the score formula, its explainer arithmetic and the list order are
  untouched by this work.
- **P7 — The report is one snapshot, filtered in memory.** One read per client; every grouping
  and filter is a pure function over it. *Consequence:* filters are instant and can never
  disagree with each other about the data.
- **P8 — Severity comes from the catalogue.** No code computes a level at run time.
  *Consequence:* two codes per metric (D10), and a level change is a catalogue edit with a test.
- **P9 — A declaration is executed.** Every catalogue (issue codes, PageSpeed error codes, plain
  copy) is read by the code that produces or renders it, and a test ties the two.

---

## 3. Data model

One new table, `page_speed`, owned by the pages module (D24). No column is added to an existing
table; `seo_issues` gains rows under six new codes and no schema change (D6).

```ts
// be/src/persistence/schema/tables/page-speed/page-speed.schema.ts — new
import { sql } from 'drizzle-orm';
import {
  bigint, check, index, integer, pgEnum, pgTable, real, smallint, timestamp, varchar,
} from 'drizzle-orm/pg-core';
import { CWV_SOURCES, PAGE_SPEED_STATUSES } from '@app/contracts';
import { auditTimestampColumns } from '../../_shared/columns/audit-timestamp-columns';
import { pages } from '../pages/pages.schema';

// Exported from this file: drizzle-kit emits CREATE TYPE only for enums it finds here.
export const pageSpeedStatusEnum = pgEnum('page_speed_status_enum', PAGE_SPEED_STATUSES);
export const cwvSourceEnum = pgEnum('cwv_source_enum', CWV_SOURCES);

/**
 * One row per page: its PageSpeed queue entry AND the cache of its last SUCCESSFUL
 * measurement. Nobody reads a history (like seo_issues), so there is none (D3).
 */
export const pageSpeed = pgTable(
  'page_speed',
  {
    // The page IS the key: a second row per page would be a second answer to one question.
    pageId: bigint('page_id', { mode: 'number' })
      .primaryKey()
      .references(() => pages.id, { onDelete: 'cascade' }),
    // queued → running → done | failed; a transient failure returns to queued.
    status: pageSpeedStatusEnum('status').notNull().default('queued'),
    // Claim counter AND fencing token, as on crawl_runs: only attempt N may write N's outcome.
    attempts: smallint('attempts').notNull().default(0),
    // Not before: the backoff after a transient failure, the pause after a 429.
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
    // The lease of the attempt in flight; a running row past it is reclaimable.
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    // A PAGE_SPEED_ERRORS key: why the last attempt did not produce a measurement.
    lastError: varchar('last_error', { length: 64 }),
    // ── The last successful measurement. All null = never measured (CHECK below).
    lcpMs: integer('lcp_ms'),
    lcpSource: cwvSourceEnum('lcp_source'),
    // Null with its source when Google has no field INP for the page or the site (D1).
    inpMs: integer('inp_ms'),
    inpSource: cwvSourceEnum('inp_source'),
    // Unitless; only compared against band thresholds, never for equality.
    cls: real('cls'),
    clsSource: cwvSourceEnum('cls_source'),
    // Lighthouse's lab performance score, 0..100 — a caption on the Speed block (D26).
    performanceScore: smallint('performance_score'),
    measuredAt: timestamp('measured_at', { withTimezone: true }),
    ...auditTimestampColumns(),
  },
  (t) => [
    // The claim's ORDER BY next_attempt_at over claimable rows.
    index('page_speed_claim_idx')
      .on(t.nextAttemptAt)
      .where(sql`${t.status} in ('queued', 'running')`),
    // 5 = PAGE_SPEED_MAX_ATTEMPTS; the int-spec refuses 6, which is what ties them.
    check('page_speed_attempts_range', sql`${t.attempts} between 0 and 5`),
    check('page_speed_running_is_leased',
      sql`${t.status} <> 'running' or ${t.lockedUntil} is not null`),
    check('page_speed_failed_says_why',
      sql`${t.status} <> 'failed' or ${t.lastError} is not null`),
    check('page_speed_done_is_measured',
      sql`${t.status} <> 'done' or ${t.measuredAt} is not null`),
    // A measurement is whole or absent: half of one would render a badge with no date.
    check('page_speed_measurement_whole', sql`
      (${t.measuredAt} is null) = (${t.lcpMs} is null)
      and (${t.measuredAt} is null) = (${t.lcpSource} is null)
      and (${t.measuredAt} is null) = (${t.cls} is null)
      and (${t.measuredAt} is null) = (${t.clsSource} is null)
      and (${t.measuredAt} is null) = (${t.performanceScore} is null)`),
    // INP may be absent inside a measurement, but never half-present or orphaned.
    check('page_speed_inp_pair', sql`
      (${t.inpMs} is null) = (${t.inpSource} is null)
      and (${t.inpMs} is null or ${t.measuredAt} is not null)`),
    // Lighthouse has no INP; a lab INP would be TBT under another name (D1).
    check('page_speed_inp_field_only', sql`${t.inpSource} is null or ${t.inpSource} <> 'lab'`),
    check('page_speed_values_range', sql`
      (${t.lcpMs} is null or ${t.lcpMs} >= 0)
      and (${t.inpMs} is null or ${t.inpMs} >= 0)
      and (${t.cls} is null or ${t.cls} >= 0)
      and (${t.performanceScore} is null or ${t.performanceScore} between 0 and 100)`),
  ],
);
```

Registered in `be/src/persistence/schema/database-schema/database-schema.ts`. The migration is
generated (`pnpm db:generate` → `be/drizzle/0014_*.sql`), read, then applied; it must contain
two `CREATE TYPE`, one `CREATE TABLE` with the FK `ON DELETE cascade`, eight CHECKs and one
partial index, and nothing else.

What nullability means: `locked_until` null = not leased; `last_error` null = the last attempt
did not fail; measurement columns null = never measured; `inp_ms` null inside a measurement = no
field INP. `band` is **not stored**: it is derived at read time from the value and
`CWV_THRESHOLDS` (D3).

**`seo_issues`** keeps its shape. A speed finding is a row under a `pageSpeed`-owned code with
`details_json` = `{ value, max, source }` — `max` the bound copied from the catalogue at
measurement time, as ANALYSIS-008 does for every bounded code (a lower CWV value is always
better, so no `min`). Unique `(page_id, code)` still holds; that a page has at most one code per
metric is held by `cwvIssuesOf` and its test, not by the database (§4 I17).

---

## 4. Invariants and their enforcement

| # | Invariant | Mechanism |
| --- | --- | --- |
| I1 | Every catalogue code has exactly one owner, `crawl` or `pageSpeed`; the two code sets are disjoint and cover the catalogue | required `owner: TIssueOwner` on `ISeoIssueDefinition` (a missing owner does not compile); `CRAWL_ISSUE_CODES` / `PAGE_SPEED_ISSUE_CODES` derived from it |
| I2 | Every crawl-owned code has exactly one check; no pageSpeed code has one | `TCheckRegistry = { [K in TCrawlIssueCode]: TCheck<K> }` — a missing crawl check and an extra pageSpeed key are both compile errors |
| I3 | A crawl's replace deletes and inserts only crawl-owned codes | `SeoIssuesRepository.replaceCrawlFindingsForWorker` deletes `code in CRAWL_ISSUE_CODES`; its rows are typed `TCrawlSeoIssue` |
| I4 | The PageSpeed worker's replace deletes and inserts only pageSpeed codes | `replacePageSpeedFindingsForWorker` deletes `code in PAGE_SPEED_ISSUE_CODES`; rows typed `TPageSpeedSeoIssue` |
| I5 | No speed finding changes a page's score or its place in the list | the score and the `ORDER BY` read only `checks_applicable`/`checks_failed`; `PageSpeedResultsService` has no method that writes `pages` |
| I6 | `checks_failed` equals the page's number of crawl-owned findings | `evaluateChecks` writes both from one loop (existing); the crawl e2e counts crawl-owned rows only |
| I7 | At most one `page_speed` row per page, gone with its page | PK `page_id`; FK `ON DELETE cascade` |
| I8 | A measurement is whole or absent; INP is paired with its source and never lab | CHECKs `page_speed_measurement_whole`, `page_speed_inp_pair`, `page_speed_inp_field_only`, `page_speed_done_is_measured` |
| I9 | A failed, released or abandoned attempt never touches the measurement | the failure/release/abandon repository methods take a `IPageSpeedJobWrite` type with no measurement keys and `set` only job columns |
| I10 | Only the attempt holding the row writes its outcome | every worker write carries `status = 'running' and attempts = N` |
| I11 | A row is claimed by one slot at a time | one `UPDATE … WHERE page_id = (SELECT … FOR UPDATE OF ps SKIP LOCKED LIMIT 1)` |
| I12 | At most five attempts, then `failed` | CHECK `page_speed_attempts_range`; claim requires `attempts < PAGE_SPEED_MAX_ATTEMPTS`; `failAbandonedForWorker` |
| I13 | A page is queued in the same transaction that makes it current; a rolled-back finalize queues nothing | `PageSpeedQueueService.enqueueForWorker(tx, …)` takes the finalize `Transaction` and is called inside it, before the run's status is written |
| I14 | A page is (re)queued iff it has no row, its last attempt failed, or its measurement is at least 24 h old | the upsert's `ON CONFLICT … DO UPDATE … WHERE` predicate, with `staleBefore` passed from TS |
| I15 | Only pages on their client's current run are claimed | the claim's join to the client's latest succeeded/partial run |
| I16 | Badge ⇔ issue: a metric outside the good band has exactly one speed finding, whose code matches its band; a good metric has none | `cwvIssuesOf` and the read-time band both call `cwvBandOf` from contracts |
| I17 | At most one speed code per metric per page | `cwvIssuesOf` returns at most one per metric — **not** a database constraint (a CHECK cannot see other rows) |
| I18 | The PageSpeed key never appears in a URL, a log line or a stored error | the key travels in the `x-goog-api-key` header (D23); `last_error` is a catalogue code, never a message |
| I19 | Without a key the worker never starts, rows stay queued, and every payload says `state: 'notConfigured'` | `PageSpeedWorker.onApplicationBootstrap` gate; `pageSpeedAvailabilityOf(settings, runtime)` — one function every read path calls |
| I20 | A 429 pauses every slot, and costs the row no attempt | `PageSpeedRateLimiter.pause()` shared by the slots; `releaseForWorker` sets `attempts = attempts - 1` under the fence (D25) |
| I21 | A rejected key halts claiming until restart; rows stay queued; every payload says `state: 'keyRejected'` until restart | `PageSpeedWorker.halt()` also calls `PageSpeedRuntimeState.markKeyRejected()`; the in-flight row is released, not failed; `pageSpeedAvailabilityOf` reads the runtime state |
| I22 | The report answers only the owner; a foreign or missing client is the same 404 | `IssueReportRepository` filters `clients.user_id = scope.userId` in each statement; `ClientNotFoundException` |
| I23 | The report reads only the current run: current pages' findings, and FAILED site checks of that run — never of a failed newer run | `current_run` CTE with `status in ('succeeded','partial')`, `site_checks.status = 'failed'` |
| I24 | Origin-sourced speed findings appear once per code per client, as "Whole site (N pages)" | `collapseOriginFindings` (pure) in the report service; `allPages` location typed only for `TPageSpeedSeoIssue` |
| I25 | Every catalogue entry — 56 page, 9 site — carries a plain what/why/fix without markup, within length bounds, whose fix names who does it | required `plain` on both definition types; contracts test |
| I26 | A page filter in the report never hides site or whole-site rows | `filterReport` (pure) treats `location.kind !== 'page'` as matching every page filter |
| I27 | The seed's backfill queues each current page without a row exactly once | `INSERT … ON CONFLICT (page_id) DO NOTHING` |
| I28 | Every PageSpeed error code in the catalogue is producible by the classifier, and the classifier produces no other | `classifyPsiResponse` returns `TPageSpeedErrorCode`; the spec iterates `PAGE_SPEED_ERROR_CODES` |
| I29 | The catalogue's CWV bounds are the thresholds | catalogue entries read `CWV_THRESHOLDS`; contracts test asserts equality |
| I30 | A speed finding's severity is its catalogue severity | `cwvIssuesOf` reads `SEO_ISSUE_CATALOGUE[code].severity` |
| I31 | Opening a screen never calls PageSpeed | read paths have no PSI dependency (the client lives only in `PageSpeedModule`); e2e asserts the transport log |
| I32 | Every id-taking route has an isolation-matrix row (ISO-005, existing) | the matrix's static check |

---

## 5. Wire contract (`@app/contracts`)

New files under `packages/contracts/src/domain/` (each listed in `src/index.ts`, one function per
file, tested units in their own folder — `skills/be-canonical-fe-mirror`):

```ts
// seo/issue-owner.enum.ts — new
export const ISSUE_OWNERS = ['crawl', 'pageSpeed'] as const;
export type TIssueOwner = (typeof ISSUE_OWNERS)[number];

// page-speed/cwv-metric.enum.ts, cwv-band.enum.ts, cwv-source.enum.ts — new
export const CWV_METRICS = ['lcp', 'inp', 'cls'] as const;
export const CWV_BANDS = ['good', 'needsImprovement', 'poor'] as const;
export const CWV_SOURCES = ['url', 'origin', 'lab'] as const;

// page-speed/cwv-thresholds.constant.ts — new. Google's published p75 thresholds; inclusive.
export const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // ms
  inp: { good: 200, poor: 500 },   // ms
  cls: { good: 0.1, poor: 0.25 },  // unitless
} as const satisfies Record<TCwvMetric, { good: number; poor: number }>;

// page-speed/cwv-band-of/cwv-band-of.util.ts — new, tested
export function cwvBandOf(metric: TCwvMetric, value: number): TCwvBand;

// page-speed/cwv-issue-codes.constant.ts — new: metric × non-good band → its one code
export const CWV_ISSUE_CODES = {
  lcp: { needsImprovement: 'CWV_LCP_NEEDS_IMPROVEMENT', poor: 'CWV_LCP_POOR' },
  inp: { needsImprovement: 'CWV_INP_NEEDS_IMPROVEMENT', poor: 'CWV_INP_POOR' },
  cls: { needsImprovement: 'CWV_CLS_NEEDS_IMPROVEMENT', poor: 'CWV_CLS_POOR' },
} as const satisfies Record<TCwvMetric, Record<Exclude<TCwvBand, 'good'>, TPageSpeedIssueCode>>;

// page-speed/cwv-measurement.interface.ts — new: a speed finding's details
export interface ICwvMeasurement extends ISeoMeasurement { source: TCwvSource }

// page-speed/page-speed-status.enum.ts — new
export const PAGE_SPEED_STATUSES = ['queued', 'running', 'done', 'failed'] as const;

// page-speed/page-speed-error.constant.ts — new: §8's catalogue
export const PAGE_SPEED_ERRORS = { /* code → { reason } */ } as const;

// page-speed/page-speed-summary.interface.ts — new
export interface ICwvReading { value: number; band: TCwvBand; source: TCwvSource }
export interface IPageSpeedMeasurement {
  measuredAt: string;            // ISO-8601 UTC
  lcp: ICwvReading;
  inp: ICwvReading | null;       // no field data for the page or the site
  cls: ICwvReading;
  performanceScore: number;      // Lighthouse lab, 0..100
}
export interface IPageSpeedSummary {
  status: TPageSpeedStatus;
  measurement: IPageSpeedMeasurement | null;  // null = never measured
  lastError: TPageSpeedErrorCode | null;      // non-null only when status is 'failed'
}
// page-speed/page-speed-availability-state.enum.ts — new (D27)
export const PAGE_SPEED_AVAILABILITY_STATES = ['notConfigured', 'active', 'keyRejected'] as const;
// page-speed/page-speed-availability.interface.ts — new (D27)
export interface IPageSpeedAvailability { state: TPageSpeedAvailabilityState }

// issue-report/client-issue-report.interface.ts — new
export type TPageLocation = { kind: 'page'; page: { id: number; url: string; title: string | null } };
export type TAllPagesLocation = { kind: 'allPages'; pageCount: number };
export type TSiteLocation = { kind: 'site' };
export type TReportIssue =
  | (TSeoIssue & { location: TPageLocation })
  | (TPageSpeedSeoIssue & { location: TAllPagesLocation })  // only speed findings collapse
  | { code: TSiteCheckCode; severity: TSeoIssueSeverity; details: Record<string, unknown>; location: TSiteLocation };
export interface IClientIssueReport {
  client: { id: number; name: string };
  generatedFrom: { runId: number; finishedAt: string } | null;  // null: no finished crawl yet
  pageSpeedAvailability: IPageSpeedAvailability;
  currentPages: number;
  issues: TReportIssue[];
}
```

Changed:

- `seo/seo-issue-catalogue.constant.ts` — `ISeoIssueDefinition.owner: TIssueOwner` (required;
  every existing entry `'crawl'`); six `pageSpeed` entries, severities per D10, `max` read from
  `CWV_THRESHOLDS`; derived `CRAWL_ISSUE_CODES`, `PAGE_SPEED_ISSUE_CODES`, `TCrawlIssueCode`,
  `TPageSpeedIssueCode`; `TRunIssueCode`, `TPageIssueCode` and `ACTIVE_ISSUE_CODES` are computed
  over crawl codes only. Phase 4 adds the required `plain: { what; why; fix }` (D14).
- `seo/seo-issue.interface.ts` — `TIssueDetails<K>` maps pageSpeed codes to `ICwvMeasurement`;
  new aliases `TCrawlSeoIssue`, `TPageSpeedSeoIssue`.
- `site/site-check-catalogue.constant.ts` — required `plain` (phase 4).
- `pages/page-check.interface.ts` — `IPageCheck.code: TCrawlIssueCode` (a check row for a speed
  code is contract drift).
- `pages/page-list-item.interface.ts` — `pageSpeed: IPageSpeedSummary | null` (null = no queue
  row). `pages/page-list-response.interface.ts` — `pageSpeedAvailability`.
  `pages/page-detail.interface.ts` — `pageSpeed`, `pageSpeedAvailability`.

D17 names the report's flag `pageSpeed {configured}`; it is `pageSpeedAvailability` here so the
list, the detail and the report use one name for one fact, and `pageSpeed` always means a page's
summary. D27 widens D12's boolean into a three-valued `state`: `notConfigured` (no key in the API
process), `active` (a key, and the worker has not halted), `keyRejected` (Google refused the key
and the worker halted until restart). A process with a key but `CRAWL_WORKER_ENABLED` off reports
`active` — it has a key and nothing has been rejected; nothing drains its queue, which is the
operator's configuration, not a fact about the key.

**What must ship together:** a contracts change, the backend that fills it and the frontend zod
schema that parses it land in the SAME commit — a field the backend sends against a stricter
schema is a thrown parse and an empty screen (`skills/fe-be-roundtrip` §4b). `pnpm typecheck`
builds contracts first and catches the type half; `satisfies z.ZodType<…>` in each schema
catches the parse half.

---

## 6. API surface

| Route | Change | Body | Authorization |
| --- | --- | --- | --- |
| `GET /api/clients/:id/issues` | **new** | `IClientIssueReport` | session; `scope.userId` in every statement; foreign/missing → 404 `CLIENT_NOT_FOUND`, identical body |
| `GET /api/pages` | changed | `IPageListResponse` + `pageSpeedAvailability`, items + `pageSpeed` | unchanged |
| `GET /api/pages/:id` | changed | `IPageDetail` + `pageSpeed`, `pageSpeedAvailability` | unchanged |

`:id` is parsed by the existing `ParseIdPipe` (400 on a non-integer). The new controller is
`IssueReportController`, `@Controller('clients')`, `@Get(':id/issues')`, so the isolation matrix
keys it `GET /api/clients/:id/issues`.

**Not added**, each deliberately: no endpoint to start a measurement — the brief forbids a
per-page button and the crawl is the enqueue point (D4/D5); no measurement history — nobody reads
one (D3); no server-side filters or pagination on the report — ≤ ~200 rows, one snapshot (D17);
no desktop strategy (D2); no endpoint revealing anything about the key but the boolean; no admin
"retry failed" — a re-crawl re-queues failed rows (D5).

---

## 7. Services and modules

**Pages module** (owns `page_speed` from now on, D24 — and already owns `seo_issues`):

- `repositories/page-speed/page-speed.repository.ts` — **new**. Scoped readers are not here (the
  list and detail join the table in their own repositories). `ForWorker` methods:
  `enqueueForWorker(tx, pageIds, staleBefore)`, `backfillCurrentForWorker()`,
  `notifyQueued(tx)`, `claimNextForWorker(leaseMs)`, `failAbandonedForWorker()`,
  `completeForWorker(tx, pageId, attempt, measurement)`,
  `recordFailureForWorker(pageId, attempt, write: IPageSpeedJobWrite)`,
  `releaseForWorker(pageId, attempt, notBefore)`.
- `repositories/seo-issues/seo-issues.repository.ts` — `replaceForPagesForWorker` becomes
  `replaceCrawlFindingsForWorker`; **new** `replacePageSpeedFindingsForWorker(tx, pageId, rows)`.
  Two named methods rather than an owner parameter: the code set each deletes is baked in, so no
  caller can pass the wrong one.
- `services/page-speed-queue/page-speed-queue.service.ts` — **new**, exported. What the crawl
  and the seed call: `enqueueForWorker(tx, pageIds, now)`, `backfillForWorker()`.
- `services/page-speed-results/page-speed-results.service.ts` — **new**, exported. What the
  worker calls: claim, abandon, complete (measurement + findings in one transaction), fail,
  release. It has no method that writes `pages` — I5 by absence.
- `page-list.repository.ts`, `page-detail.repository.ts`, `page-read.service.ts` — read the row
  (phase 3).

**Page-speed module** — **new**, `be/src/modules/page-speed/`, owns no table (like crawl).
Imported by `AppModule` only — never by `CrawlModule` or `SeedModule`, so the seed process never
holds a worker it would exit under (D21).

- `services/psi-client/psi-client.ts` — extends `RemoteApiCore` as `SiteHttpClient` does;
  `runPagespeed(url, signal)` builds the request URL deterministically (fixed parameter order) so
  fixtures key on it.
- `services/classify-psi-response/classify-psi-response.ts`,
  `services/extract-measurement/extract-measurement.ts`,
  `services/cwv-issues/cwv-issues-of.ts`, `services/retry-delay/retry-delay.ts` — pure, one
  function per file, each with its spec.
- `services/rate-limiter/page-speed-rate-limiter.ts` — in-process: minimum interval, shared
  pause, halt; injectable clock.
- `services/page-speed-executor/page-speed-executor.service.ts` — one claimed row from request to
  write.
- `workers/page-speed-worker/page-speed-worker.ts` — slots, poll, NOTIFY; its own
  `PgNotificationListener` (listed in this module's providers, so Nest gives it its own instance
  and connection — sharing the crawl's would overwrite that instance's single client).
- `constants/page-speed-worker.constant.ts` — §10's numbers.

**Issue-report module** — **new**, `be/src/modules/issue-report/`, owns no table: it is a read
model across three owners (pages, clients, site checks), and giving it to either side would make
that module's document describe the other's tables.
`controllers/issue-report/issue-report.controller.ts`,
`services/issue-report/issue-report.service.ts`,
`services/collapse-origin-findings/collapse-origin-findings.ts` (pure),
`repositories/issue-report/issue-report.repository.ts`. Throws the clients module's
`ClientNotFoundException`.

**Configuration** — `be/src/infrastructure/config/page-speed-settings/` **new**: the
`PAGE_SPEED_SETTINGS` token, `IPageSpeedSettings { apiKey: string | null }` (empty or
whitespace → null), and a global `PageSpeedSettingsModule` imported by `AppModule` and
`SeedModule`. A provider, not a `ConfigService` read at each site, so `createTestApp` can
override it per suite. The same module provides `PageSpeedRuntimeState` (**new**, in-process,
one boolean `keyRejected` with `markKeyRejected()`) and the pure
`pageSpeedAvailabilityOf(settings, runtime): IPageSpeedAvailability`. It lives in infrastructure,
not in the page-speed module, because the pages and issue-report read paths must see the worker's
halt without importing the module that holds the worker (D21) — the worker writes the state, the
readers only read it (D27).

**Shared** — `be/src/shared/page-speed-queue/page-speed-queue.constant.ts` **new**, beside
`crawl-queue.constant.ts`: `PAGE_SPEED_QUEUED_CHANNEL = 'page_speed_queued'`,
`PAGE_SPEED_FRESH_FOR_MS`, `PAGE_SPEED_MAX_ATTEMPTS`.

**Crawl module** — `CrawlRunExecutorService.finalize` calls
`PageSpeedQueueService.enqueueForWorker(tx, [...pageIds.values()], now)` after
`applyRunResultsForWorker` and before `finalizeForWorker` — inside the fence-locked transaction.

**Seed** — `SeedRunner` calls `backfillForWorker()` after the crawls and reports the count.

**Remote API** — `IRemoteGetOptions` gains `timeoutMs?`, `maxRetries?` and `headers?`; defaults
unchanged (REMOTE-002/003 amended in phase 2a).

---

## 8. Error catalogue

**HTTP.** One new path answers errors, all with existing codes: `GET /api/clients/:id/issues` →
404 `CLIENT_NOT_FOUND` for a foreign or missing client (the copy's job: the same "This client was
not found" whether it never existed or is someone else's — it must not confirm existence); 400
`BAD_REQUEST` for a non-integer id; 401 `SESSION_REQUIRED` without a session.

**PageSpeed row errors** — `PAGE_SPEED_ERRORS` in contracts, **new**. `last_error` stores the
code; the screen renders `reason` after "Couldn't measure:" / "Couldn't refresh:". The copy's job:
say what happened in a marketer's words, and imply the next step without naming an HTTP status.

| code | when | `reason` |
| --- | --- | --- |
| `PSI_UNAVAILABLE` | the 5th attempt ends in a timeout, a network error or a 5xx | Google's PageSpeed service did not answer after several tries. |
| `PAGE_LOAD_FAILED` | Lighthouse runtime error `FAILED_DOCUMENT_REQUEST` | Google could not load the page. |
| `PAGE_ERRORED` | Lighthouse runtime error `ERRORED_DOCUMENT_REQUEST` | The page answered Google with an error. |
| `PSI_REJECTED` | any other 4xx that is not a key or quota error | Google refused to test this address. |
| `NO_MEASUREMENT` | a 200 whose body yields no LCP or no CLS from any source | Google returned no usable measurement for this page. |
| `ABANDONED` | the lease of the 5th attempt expired (the process died mid-call) | The measurement was interrupted several times. |

Not row errors, by design: a 429 (pauses the queue, D11) and a rejected key (halts it, D11/D21).

**Declared and executed (P9).** `classifyPsiResponse` returns `TPageSpeedErrorCode`, so it
cannot produce a code the catalogue lacks; its spec iterates `PAGE_SPEED_ERROR_CODES` and
demands a fixture case producing each one, so the catalogue cannot hold a code nothing produces
— except `ABANDONED`, which only `failAbandonedForWorker` writes and whose case lives in the
repository int-spec; the classifier spec names that exclusion explicitly.

VERIFY: the exact PSI error shapes — the Lighthouse runtime code in a 400/500 body
(`"Lighthouse returned error: FAILED_DOCUMENT_REQUEST…"`), the key errors
(`400 API_KEY_INVALID`, `403 PERMISSION_DENIED`/`SERVICE_DISABLED`) and the quota error
(`429 RESOURCE_EXHAUSTED`, and whether a daily-quota exhaustion arrives as 403). The recorded
fixtures of phase 2e settle it; §10.5 is amended to what they show.

---

## 9. Background work

**What runs.** `PageSpeedWorker` in the API process when `CRAWL_WORKER_ENABLED === 'true'` AND
`PAGE_SPEED_SETTINGS.apiKey !== null` (D12, D21). Two slots, each: wait for the rate limiter →
fail abandoned rows → claim one row → measure → write → loop; sleep on an empty queue until the
poll interval or a `page_speed_queued` NOTIFY.

**When Google fails** (D11):

| Outcome | Row | Queue |
| --- | --- | --- |
| timeout (90 s), network, 5xx | `queued`, `next_attempt_at = now + 1 min × 4^(n−1)`, `last_error = PSI_UNAVAILABLE`; at attempt 5 → `failed` | continues |
| 429 (or quota 403, per VERIFY) | released: `queued`, `attempts − 1`, `next_attempt_at = pause end` | ALL slots pause for `Retry-After` or 60 s |
| permanent (FAILED/ERRORED document, other 4xx, no measurement) | `failed` with its code | continues |
| key rejected | released as above | halted until restart; `PageSpeedRuntimeState.markKeyRejected()`, so every payload says `state: 'keyRejected'`; one `error` log line naming the cause, never the key |

In every row of that table the measurement columns are untouched (P4, I9).

**When the process dies mid-call.** The lease (`PAGE_SPEED_LEASE_MS` = 3 min, longer than the
90 s timeout plus one transaction) expires; the next claim retakes the row as attempt n+1; past
attempt 5, `failAbandonedForWorker` fails it `ABANDONED`. No heartbeat: unlike a crawl, one
attempt is one bounded request.

**When the database fails mid-write.** The completion transaction rolls back whole — the row
stays `running` until its lease expires and is retried. A measurement and its findings are never
half-written: one transaction (SPEED-006; I8 and I16 hold across it).

**When there is no key.** The worker never starts; crawls keep enqueueing; adding the key and
restarting drains the backlog (D12). Every payload carries `state: 'notConfigured'`.

**When the key is rejected.** The worker halts, the runtime state flips to `keyRejected`, every
screen says "Google rejected the PageSpeed key" (§1), and the queue keeps every row. Fixing the key
in `.env` and restarting clears the state (it is in memory) and drains the backlog (D27).

**Known limitation (O1).** The 429 pause, the halt and the `keyRejected` state live in process
memory. Correct for the one API process docker-compose runs; a second process would not see the
first's pause or halt.

**The crawl does not depend on Google (D4).** Enqueue is one upsert inside the finalize
transaction; if it throws, the finalize rolls back like any other write — which is the price of
atomic enqueue, and §16 R4 watches it.

---

## 10. Algorithms

### 10.1 Band (`cwvBandOf`, contracts)

`value <= good → 'good'`; `value <= poor → 'needsImprovement'`; else `'poor'`. Inclusive at both
thresholds, as Google publishes them. Boundary cases in the test: LCP 2500 good, 2501 NI, 4000
NI, 4001 poor; INP 200/201/500/501; CLS 0.1/0.1001/0.25/0.2501.

### 10.2 Which value per metric (`extractMeasurement`, D1)

Input: the PSI v5 JSON. Output: `{ lcp, inp | null, cls, performanceScore }` with sources, or
`null` (→ `NO_MEASUREMENT`). Per metric, independently:

1. **url** — `loadingExperience.metrics.<KEY>.percentile`, when `loadingExperience` exists and
   is not an origin fallback;
2. **origin** — `originLoadingExperience.metrics.<KEY>.percentile`;
3. **lab** — `lighthouseResult.audits['largest-contentful-paint' | 'cumulative-layout-shift']
   .numericValue`. INP has no step 3.

Keys: `LARGEST_CONTENTFUL_PAINT_MS`, `INTERACTION_TO_NEXT_PAINT`,
`CUMULATIVE_LAYOUT_SHIFT_SCORE` (CrUX reports CLS × 100; divide). `performanceScore =
round(lighthouseResult.categories.performance.score × 100)`. The JSON is parsed by a zod schema
of exactly these paths; anything else in the body is ignored.

VERIFY: `loadingExperience.origin_fallback` is how PSI marks URL data that is really the
origin's; the CLS ×100 scaling; the metric key names. The three recorded fixtures (url, origin
only, lab only) pin them.

### 10.3 Which findings (`cwvIssuesOf`, D10)

For each metric with a value: `band = cwvBandOf(metric, value)`; good → nothing; otherwise one
finding `{ code: CWV_ISSUE_CODES[metric][band], severity: SEO_ISSUE_CATALOGUE[code].severity,
details: { value, max: SEO_ISSUE_CATALOGUE[code].max, source } }`. Source never changes the
level (D10). Output in catalogue order.

### 10.4 Enqueue eligibility (D5)

```sql
insert into page_speed (page_id) select unnest(:pageIds)
on conflict (page_id) do update
  set status = 'queued', attempts = 0, next_attempt_at = now(),
      locked_until = null, last_error = null
  where page_speed.status = 'failed'
     or (page_speed.status = 'done' and page_speed.measured_at <= :staleBefore)
```

`staleBefore = now − PAGE_SPEED_FRESH_FOR_MS` (24 h), computed in TS so the boundary is testable
with a fixed clock: measured exactly 24 h ago → re-queued; 24 h − 1 s → untouched. A row already
`queued` or `running` is untouched. The measurement columns are untouched in every branch, so a
re-queued page keeps showing its old figures until the new ones land. Then
`pg_notify('page_speed_queued', '')`.

### 10.5 Classification (`classifyPsiResponse`, D11)

Input: the transport's response or the thrown `RemoteApiError`. Output, in this precedence:

1. thrown timeout/network → `transient`;
2. status 429, or a body reason naming rate or quota → `rateLimited` with
   `Retry-After` (seconds or HTTP date) or `PAGE_SPEED_DEFAULT_PAUSE_MS`;
3. 400/403 whose body names the key (invalid, expired, API not enabled, referrer/IP restricted)
   → `keyRejected`;
4. a body naming a Lighthouse runtime error → `permanent` with `PAGE_LOAD_FAILED` /
   `PAGE_ERRORED` (any other runtime code → `PSI_REJECTED`);
5. 5xx → `transient`; other 4xx → `permanent PSI_REJECTED`;
6. 200 → `extractMeasurement`; null → `permanent NO_MEASUREMENT`; else `measured`.

### 10.6 Retry delay

`retryDelayMs(n) = PAGE_SPEED_BACKOFF_BASE_MS × PAGE_SPEED_BACKOFF_FACTOR^(n − 1)` for the n-th
failed attempt: 1, 4, 16, 64 minutes; the 5th failure is final.

### 10.7 Rate limiter

`acquire()` resolves when not halted, not paused, and at least `PAGE_SPEED_MIN_INTERVAL_MS`
after the previous `acquire()` resolved — serialised across slots. `pause(ms)` sets `pausedUntil
= max(pausedUntil, now + ms)`. `halt()` makes every pending and future `acquire()` resolve to
"stop". Slots call `acquire()` BEFORE claiming, so a paused slot holds no row.

### 10.8 Claim

```sql
update page_speed set status = 'running', attempts = attempts + 1,
       locked_until = now() + :lease
where page_id = (
  select ps.page_id from page_speed ps
  join pages p on p.id = ps.page_id
  where ((ps.status = 'queued' and ps.next_attempt_at <= now())
         or (ps.status = 'running' and ps.locked_until < now()))
    and ps.attempts < 5
    and p.last_seen_run_id = (
      select r.id from crawl_runs r
      where r.client_id = p.client_id and r.status in ('succeeded', 'partial')
      order by r.finished_at desc, r.id desc limit 1)
  order by ps.next_attempt_at, ps.page_id
  for update of ps skip locked limit 1)
returning page_id, attempts, (select final_url from pages where id = page_id)
```

A row whose page left the current run is never claimed and costs nothing; if a later crawl finds
the page again, its enqueue revives the row. The measured URL is `final_url` (D22). Served by
`page_speed_claim_idx` and `crawl_runs_client_id_finished_at_idx`; the table holds one row per
crawled page (≤ 15 per client), so no `EXPLAIN` gate is set.

### 10.9 Origin collapse (`collapseOriginFindings`, D8)

Input: the client's current-page speed findings. Every finding with `details.source = 'origin'`
is grouped by code; each group becomes ONE issue with `location { kind: 'allPages', pageCount }`
and the details of the most recently measured page in the group (ties by page id). URL- and
lab-sourced findings pass through with their page location. A code may therefore appear both as
an `allPages` row and as page rows; that is correct — some pages have their own field data.

### 10.10 Report views (frontend, pure)

- `filterReport(issues, { levels, type, pageId, query })` — level ∈ chosen levels; type by the
  code's catalogue (`seo` = crawl-owned page code, `speed` = pageSpeed code, `site` = site
  check); `pageId`/`query` match page rows by id / URL-or-title substring, and **every non-page
  row matches every page filter** (D17, I26).
- `groupByIssue(issues)` → levels in catalogue severity order → codes ordered by affected pages
  descending (`allPages` counts `pageCount`, `site` counts the client's `currentPages`), ties in
  catalogue order → locations.
- `groupByPage(issues)` → a "Whole site" group first (site + allPages rows), then pages ordered
  by Critical count, Important count, Improvement count (each descending), then URL.

---

## 11. Scenario walkthroughs

**A — a new client is measured.** The user adds `example.com`. The crawl finishes `succeeded`
with 15 pages; in its finalize transaction, after the pages are upserted, 15 `page_speed` rows
are inserted `queued` and `page_speed_queued` is notified — at commit, so a woken slot finds the
rows. Both slots wake; each waits on the limiter (1 s apart), claims a row (attempt 1), and calls
PSI for the page's `final_url` with the key in a header. Page 1 answers with URL field data: LCP
3100 ms (url), INP null at url but 180 ms at origin, CLS 0.02 (url). One transaction writes the
row `done` with the measurement and replaces page 1's pageSpeed findings with one:
`CWV_LCP_NEEDS_IMPROVEMENT { value: 3100, max: 2500, source: 'url' }` (notice). The pages list
now shows page 1 with a yellow LCP, green INP ("whole site"), green CLS; its issue count grew by
one notice; its score did not move. Pages 2–15 show "Measuring…" until their turn.

**B — Google is down, then busy.** Twenty-four hours later the user re-crawls. Page 1 is
re-queued (measured ≥ 24 h ago); its old figures stay on screen. PSI times out at 90 s: the row
returns to `queued`, `next_attempt_at` +1 min, `last_error PSI_UNAVAILABLE`, measurement intact.
Attempt 2 gets a 429 with `Retry-After: 120`: both slots pause 120 s, the row is released with
`attempts` back to 1. After the pause, attempts 2–5 time out (+4, +16, +64 min); the 5th failure
leaves the row `failed`. The list shows page 1's old badges with the warning icon: "Couldn't
refresh: Google's PageSpeed service did not answer after several tries. Showing the measurement
from Oct 9." The next crawl re-queues it (failed rows always are).

**C — the report from a list row.** On the pages list the user clicks page 4's issue count. The
report opens `/issues?clientId=7&pageId=42`, fetches the snapshot once, and the ViewModel
filters in memory: page 42's own findings, plus the site check "Sitemap lists URLs that are not
meant to be indexed" (Whole site) and "INP needs improvement — Whole site (15 pages)", which is
one row for the fifteen origin-sourced `CWV_INP_NEEDS_IMPROVEMENT` findings the database holds.
Improvement is hidden by default, so that INP row appears only when the user ticks Improvement.
They switch to By page; the Whole site group leads. A newer crawl of this client that failed
contributes no site checks — the report reads the run the list reads.

---

## 12. Frontend

**Routes** (`fe/src/App/Router/router.tsx`): **new** `/issues` under the `app` layout,
`validateSearch: issuesSearchSchema` (**new**,
`SearchSchemas/IssuesSearchSchema/issuesSearchSchema.ts`): `clientId?`, `pageId?`,
`group: 'issue' | 'page'` (default `'issue'`), `levels` (default critical+important, i.e.
`['error','warning']`), `type: 'all' | 'seo' | 'speed' | 'site'` (default `'all'`), `q?`; every
malformed value falls back to its default (`.catch`).

**Gateways.** `IssueReportGateway` **new** (`Gateways/IssueReportGateway/IssueReportGateway.ts`,
`Validation/IssueReportSchemas.ts`, one line in `gateways.ts`): `get(clientId)`; a 404
`CLIENT_NOT_FOUND` becomes `{ kind: 'notFound' }`, as `ClientGateway.create` maps its refusals.
`PageGateway/Validation/PageSchemas.ts`: speed-code variants with `cwvMeasurementSchema`
(phase 1), `pageSpeedSummarySchema`, `pageSpeedAvailabilitySchema` (`state: z.enum(PAGE_SPEED_AVAILABILITY_STATES)`, phase 3), the measured
variants exclude pageSpeed codes, `pageCheckSchema.code` over crawl codes.

**ViewModels.** `IssueReportViewModel` **new**: `clients`, `report`, `status`
(`idle|loading|ready|error|notFound`), `error`; actions `fetchClients()`, `fetchReport(clientId)`
with request identity so a superseded answer is dropped (`fe/skills/data-retrieval`
"Superseded answers"); reset on sign-out (SHELL-003). Services (pure, each tested):
`FilterReport/filterReport.ts`, `GroupByIssue/groupByIssue.ts`, `GroupByPage/groupByPage.ts`,
`IssueTypeOf/issueTypeOf.ts`. `PagesViewModel` and `PageDetailViewModel` carry the new fields
through. `ExplainScore/explainScore.ts` returns five paragraphs.

**Core.** `Helpers/DescribeIssue/describeIssue.ts` **new** — the `DESCRIBE` record moves here
from `groupIssues.ts` because a second ViewModel (the report) needs it
(`fe/skills/folder-structure`: a Service needed by a second ViewModel moves to `Core/Helpers/`).
`Helpers/DescribeCwv/describeCwv.ts` **new** — value formatting ("3.1 s", "180 ms", "0.12") and
the source phrase, read by the list tooltip and the detail cards. `Constants/severityLabel.ts`
**new** — `Record<TSeoIssueSeverity, { label; color }>` (Critical red, Important yellow,
Improvement grey); `Constants/cwvBandColor.ts` **new** — `Record<TCwvBand | 'noData', string>`.
`Constants/pageSpeedAvailabilityCopy.ts` **new** — `Record<TPageSpeedAvailabilityState, { tone;
headerLabel: string | null; notice: string | null }>`, the one place the three states' words live,
read by the list header, the Speed block and the report header (D27). All three are `Record`s, so
a new severity, band or availability state without its words or colour does not compile (as
SHELL-004 does for crawl statuses; the severity record is D28's single source).

**Modules.**

- `Modules/Issues/IssuesScreen.tsx` **new**, with `IssuesHeader/`, `SeverityRubric/`,
  `IssueFilters/`, `IssueCard/`, `IssuesByIssue/`, `IssuesByPage/`, `IssueLocation/`.
- `Modules/Pages/PagesTable/CwvBadges/CwvBadges.tsx` **new**; `PagesTable.tsx` gains the column
  and the legend; `IssueCounts.tsx` becomes a link and uses `severityLabel`.
- `Modules/PageDetail/SpeedSection/SpeedSection.tsx` **new**, placed after `KpiCards`;
  `IssuesSection.tsx` uses `severityLabel`; `ScoreExplainer.tsx`'s comment says five paragraphs.
- `Modules/Clients/ClientsTable/ClientsTable.tsx` gains **View issues**;
  `RunLog/SiteChecks/SiteChecks.tsx` uses `severityLabel`.
- `Modules/_Shared/AppLayout/AppLayout.tsx` — `NAVIGATION` gains Issues between Pages and
  Clients.

**Every state of the report** is listed in §1.2; the ViewModel exposes them as one
discriminated `view` (`loading | error | noClients | notFound | noRun | empty | filteredEmpty |
ready`) so the screen branches in one place in the order `fe/skills/data-retrieval` "Status
contract" fixes.

---

## 13. Invariants ↔ tests

| # | Pinned by |
| --- | --- |
| I1 | `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts` → "partitions the catalogue by owner: every code in exactly one writer's set" |
| I2 | `pnpm typecheck` over `TCheckRegistry`; `be/src/modules/page-analysis/services/checks/checks.registry.spec.ts` → "has exactly one check per crawl-owned code" and "has no check for a pageSpeed-owned code" |
| I3 | `be/src/modules/pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` (new) → "a crawl's replace leaves the page's speed findings" |
| I4 | same file → "a speed replace leaves the page's crawl findings" |
| I5 | `be/test/e2e/page-speed.e2e-spec.ts` (new) → "a speed finding counts among the issues and leaves the score and the order unchanged" |
| I6 | `checks.registry.spec.ts` → "keeps checksFailed equal to the number of issues" (existing); `be/test/e2e/crawl.e2e-spec.ts` amended to count crawl-owned rows |
| I7 | `be/src/modules/pages/repositories/page-speed/page-speed.repository.int-spec.ts` (new) → "deleting a page deletes its row"; the PK itself |
| I8 | same int-spec → "refuses a half measurement" (`it.each` over each CHECK), "refuses a lab INP" |
| I9 | same int-spec → "a failure, a release and an abandonment leave the measurement byte-for-byte" |
| I10 | same int-spec → "a stale attempt's completion and failure write nothing" |
| I11 | same int-spec → "two concurrent claims take two different rows (SKIP LOCKED)" |
| I12 | same int-spec → "refuses attempts 6" and "fails a row abandoned at attempt 5 with ABANDONED, and never claims it" |
| I13 | `be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.spec.ts` → "enqueues the run's pages in the finalize transaction" and "a superseded attempt enqueues nothing"; `be/test/e2e/page-speed.e2e-spec.ts` → "a crawl queues its pages" |
| I14 | `page-speed.repository.int-spec.ts` → "re-queues a measurement exactly 24 h old, not one 1 s younger", "re-queues a failed row", "leaves a queued or running row alone", "keeps the measurement when re-queued" |
| I15 | same int-spec → "never claims a page its client's current run no longer has" |
| I16 | `be/src/modules/page-speed/services/cwv-issues/cwv-issues-of.spec.ts` → "a metric outside the good band yields exactly its one code; a good one yields none" (`it.each` over §10.1's boundaries); `packages/contracts/src/domain/page-speed/cwv-band-of/cwv-band-of.util.test.ts`; `be/test/e2e/page-speed.e2e-spec.ts` → "every non-good badge in the list has its finding in the detail, and no good one does" |
| I17 | `cwv-issues-of.spec.ts` → "never yields two codes for one metric" — not pinned by the database, a CHECK cannot see sibling rows |
| I18 | `be/src/modules/page-speed/services/psi-client/psi-client.spec.ts` → "sends the key in a header and never in the URL"; `page-speed-executor.service.spec.ts` → "no log line and no stored error contains the key" (serialises every logger call) |
| I19 | `be/src/modules/page-speed/workers/page-speed-worker/page-speed-worker.spec.ts` → "does not start without a key", "does not start with the worker flag off"; `be/src/infrastructure/config/page-speed-settings/page-speed-availability-of.spec.ts` → "no key is notConfigured, a key is active, a rejected key is keyRejected"; `be/test/e2e/page-speed.e2e-spec.ts` → "without a key the rows stay queued and the list says notConfigured" |
| I20 | `page-speed-rate-limiter.spec.ts` → "a pause holds every slot"; `page-speed-executor.service.spec.ts` → "a 429 releases the row without spending an attempt"; int-spec → "a release gives back the attempt" |
| I21 | `page-speed-worker.spec.ts` → "a rejected key halts both slots, leaves the row queued and marks the runtime state keyRejected"; `be/test/e2e/page-speed.e2e-spec.ts` → "after Google rejects the key, the list, the detail and the report say keyRejected and every row is still queued" (fixture `key-invalid.json`) |
| I22 | `be/test/e2e/isolation-matrix.e2e-spec.ts` → row `GET /api/clients/:id/issues`; `be/test/e2e/issue-report.e2e-spec.ts` (new) → "another user's client is the same 404 as a missing one" |
| I23 | `be/src/modules/issue-report/repositories/issue-report/issue-report.repository.int-spec.ts` (new) → "reads site checks of the current run only — not of a newer failed run", "reads only failed site checks", "reads only current pages' findings" |
| I24 | `collapse-origin-findings.spec.ts` → "folds origin findings into one row per code with the page count", "keeps url and lab findings per page"; `issue-report.e2e-spec.ts` → "an origin speed finding on 15 pages is one Whole site row" |
| I25 | `packages/contracts/src/domain/seo/issue-plain-copy.test.ts` (new) → "every page and site entry carries what, why and fix", "no plain copy contains < or >", "plain copy stays within its bounds", "every fix says who does it" |
| I26 | `fe/src/ViewModels/IssueReportViewModel/Services/FilterReport/filterReport.test.ts` → "a page filter keeps site and whole-site rows" |
| I27 | `be/src/seed/seed-runner/seed-runner.int-spec.ts` → "the backfill queues each current page once, and a second run queues none" |
| I28 | `classify-psi-response.spec.ts` → `it.each(PAGE_SPEED_ERROR_CODES minus ABANDONED)` "produces %s from its fixture"; ABANDONED by the int-spec of I12 |
| I29 | `seo-issue-catalogue.test.ts` → "each CWV code's max is its metric's threshold for its band" |
| I30 | `cwv-issues-of.spec.ts` → "takes severity from the catalogue: poor is a warning, needs improvement a notice" |
| I31 | `be/test/e2e/page-speed.e2e-spec.ts` → "opening the list, the detail and the report requests nothing from PageSpeed" (asserts `FixtureHttpTransport.requests`) |
| I32 | the matrix's static case "covers every route that takes an id or a clientId" (existing) |

---

## 14. Test plan

Conventions: `practices/be/nestjs/testing-patterns/SKILL.md`, `practices/fe/react/testing/SKILL.md`,
`fe/skills/testing/SKILL.md`. Each test below states what makes it fail.

**Contracts (unit, vitest)** — `seo-issue-catalogue.test.ts` (owner partition; CWV bounds =
thresholds; fails if an entry's owner or bound drifts); `cwv-band-of.util.test.ts` (fails on `<`
for `<=`); `issue-plain-copy.test.ts` (fails on an empty, marked-up, overlong or audience-less
field); `site-check-catalogue.test.ts` unchanged.

**Backend unit (jest, beside source)** — `classify-psi-response.spec.ts`,
`extract-measurement.spec.ts` (fixture JSON read from disk — fixture kind), `cwv-issues-of.spec.ts`,
`retry-delay.spec.ts`, `page-speed-rate-limiter.spec.ts` (fake clock), `psi-client.spec.ts`
(FixtureHttpTransport; fails if the URL carries `key=` or a retry happens),
`page-speed-executor.service.spec.ts` (mocks at the results-service boundary; fails if a failure
path calls `completeForWorker`), `page-speed-worker.spec.ts` (fake listener and executor, as
`crawl-worker.spec.ts`), `page-speed-availability-of.spec.ts` (the three states; fails if a
rejected key with a key present reads `active`), `collapse-origin-findings.spec.ts`, `remote-api.core.spec.ts` (new
cases: per-call timeout, `maxRetries: 0`, extra headers — fails if a 503 is retried under
`maxRetries: 0`), `crawl-run-executor.service.spec.ts` (enqueue call with the finalize `tx`).

**Integration / DB (`*.int-spec.ts`, real Postgres)** — `page-speed.repository.int-spec.ts`
(CHECKs, SKIP LOCKED, fence, freshness boundary, current-run claim, cascade — all things only
the database decides); `seo-issues.repository.int-spec.ts` (owner-scoped deletes);
`issue-report.repository.int-spec.ts` (current-run CTE, scoping, failed-run exclusion);
`seed-runner.int-spec.ts` (backfill idempotence).

**e2e (API, `be/test/e2e/*.e2e-spec.ts`, run by `test:db`)** — `page-speed.e2e-spec.ts` (new:
crawl → queue → `PageSpeedWorker.runOnce()` against PSI fixtures → list/detail/issues agree;
no-key; no PSI call on read); `issue-report.e2e-spec.ts` (new: snapshot shape, collapse, 404,
page filter is not a server concern); `isolation-matrix.e2e-spec.ts` (one row);
`pages.e2e-spec.ts` (new fields present and parsed); `crawl.e2e-spec.ts` (I6 amended).
`createTestApp` gains `pageSpeedApiKey?` and ALWAYS overrides `PAGE_SPEED_SETTINGS` with
`{ apiKey: options.pageSpeedApiKey ?? null }` — unconditionally, so a developer's real key in
`.env` never reaches a test, whether or not the test asked for one; `db-env.ts` keeps
`CRAWL_WORKER_ENABLED=false`, so no test starts a loop either.

**Fixtures** — `be/test/fixtures/pagespeed/` **new**: recorded `url-field.json`,
`origin-only.json`, `lab-only.json`, `key-invalid.json`, `failed-document.json`; synthesized from
Google's documented error format and named so: `rate-limited.synthesized.json`,
`server-error.synthesized.json`. Manifest entries keyed by the exact PSI request URL.
`be/test/fixtures/record-pagespeed-fixtures.ts` **new** records them with a local key and
refuses to write a file containing the key. No test reaches the network.

**Frontend (vitest, beside the unit)** — `PageSchemas.test.ts` (speed variants; a summary with
an unknown band fails); `IssueReportSchemas.test.ts`; `IssueReportGateway.test.ts` (404 →
notFound); `issuesSearchSchema.test.ts` (defaults; Improvement off); `filterReport.test.ts`,
`groupByIssue.test.ts`, `groupByPage.test.ts`, `issueTypeOf.test.ts`;
`IssueReportViewModel.test.ts` (superseded answer dropped; reset on sign-out);
`describeCwv.test.ts`; `describeIssue.test.ts` (moved cases + six CWV sentences);
`CwvBadges.test.tsx` (each cell state, including "Paused" under `keyRejected`);
`PagesTable.test.tsx` (the header for each availability state); `SpeedSection.test.tsx` (each
state, including the key-rejected notice; lab note; INP no data); `explainScore.test.ts` (fifth paragraph); `IssuesScreen.test.tsx` (each view; rubric
shown; the notice for each availability state); `IssuesSection.test.tsx`, `PagesTable.test.tsx`, `ClientsTable.test.tsx` (new labels,
links); `router.test.tsx` (`/issues` guarded).

**Typecheck / lint** — I2 (`TCheckRegistry`), the `DESCRIBE` record over every code, the
`severityLabel`/`cwvBandColor` records, `satisfies z.ZodType<…>` on every schema; ESLint's
`ForWorker` ban keeps the new worker methods out of `IssueReportController`.

**Performance.** No large table is introduced. The list keeps its five statements
(`describe('cost')` asserts the count, unchanged); phase 3 re-runs
`be/test/explain/pages-list.explain.sql` on the seeded stack to confirm the `page_speed` join is
a PK probe or a hash on a ≤ 30-row table and adds nothing to the plan's cost class.

---

## 15. Work order

**TDD discipline.** In every sub-phase, the tests named "before" are written first and RUN, and
the run is observed failing for the reason stated. The test and the code that turns it green land
in one commit, so every commit on the branch is green — pre-push runs
`pnpm lint && pnpm typecheck && pnpm test`, and a bisect never stops on a red commit. Tests named
"after" pin behaviour whose failing form cannot be produced before the code exists (a screen with
no component yet).

**Between phases.** Each phase ends with `pnpm lint && pnpm typecheck && pnpm test && pnpm
test:db` green and `docker compose up -d --build` serving a working app, and with the named
change's tasks for that phase all ticked or carrying `AMENDED`/`VERIFIED, NOT BUILT` lines. A
phase does not close while its change has an open task.

**Order of the changes.** issue-catalogue-owners → page-speed-measurement →
{core-web-vitals-display, client-issue-report}. Phases 3 and 4 depend on phase 2 and not on each
other; the order below puts the badges first only because the report's speed rows are easier to
read against badges already on screen.

### Phase 1 — The catalogue knows two writers (change `issue-catalogue-owners`)

Nothing a user sees changes. After it, the catalogue holds 56 codes in two owner sets, the crawl
can only write its own, and the frontend can parse and describe a speed finding.

#### 1a. Ownership and the Core Web Vitals vocabulary

1. **Deliverables.** `packages/contracts/src/domain/seo/issue-owner.enum.ts` (new);
   `page-speed/cwv-metric.enum.ts`, `cwv-band.enum.ts`, `cwv-source.enum.ts`,
   `cwv-thresholds.constant.ts`, `cwv-issue-codes.constant.ts`, `cwv-measurement.interface.ts`,
   `cwv-band-of/{cwv-band-of.util.ts, cwv-band-of.util.test.ts}` (new);
   `seo/seo-issue-catalogue.constant.ts` (owner on all 50, six CWV entries with label, hint,
   explanation, sources — new `ISSUE_SOURCES` entries for web.dev LCP, INP, CLS and the PSI
   documentation, each opened and read on the day cited, per the file's own header —
   derived sets); `seo/seo-issue.interface.ts`; `pages/page-check.interface.ts`; `src/index.ts`.
   Backend: `page-analysis/services/checks/checks.registry.ts` (`TCheckRegistry` over
   `TCrawlIssueCode`; `ISeoEvaluation` lists typed crawl codes),
   `pages/services/crawl-results/crawl-results.service.ts` (`IRunPage` crawl-typed),
   `pages/services/page-checks/compose-page-checks.ts` (types), `be/test/support/seed-page.ts`
   (`ACTIVE_ISSUE_CODES` instead of `SEO_ISSUE_CODES`). Frontend:
   `Gateways/PageGateway/Validation/PageSchemas.ts` (speed variants, measured variants exclude
   them, `pageCheckSchema` over crawl codes), `Core/Helpers/DescribeIssue/describeIssue.ts`
   (new, `DESCRIBE` moved from `groupIssues.ts` plus six speed sentences),
   `ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts` (imports it).
2. **Pre-conditions.** `main` green. D6, D10, D3 (thresholds), D7.
3. **TDD points.** Before: `seo-issue-catalogue.test.ts` → "partitions the catalogue by owner"
   (fails: no `owner` export) and "each CWV code's max is its metric's threshold for its band";
   `cwv-band-of.util.test.ts` boundary `it.each` (fails: no module);
   `checks.registry.spec.ts` → "has exactly one check per catalogued code" is changed to "…per
   crawl-owned code" plus "has no check for a pageSpeed-owned code" (fails once the CWV entries
   exist and the registry is still keyed by every code — the typecheck fails first, which is the
   point). Before: `describeIssue.test.ts` → "describes CWV_LCP_NEEDS_IMPROVEMENT from its stored
   bound and source" (fails: no sentence). After: `PageSchemas.test.ts` → "parses a speed
   finding with its source; refuses one without".
4. **Acceptance.** `pnpm --filter @app/contracts test:ci`;
   `pnpm --filter be test:ci -- src/modules/page-analysis src/modules/pages`;
   `pnpm --filter fe test:ci -- PageSchemas describeIssue groupIssues`;
   `pnpm lint && pnpm typecheck && pnpm test`.
5. **Regression guard.** `ACTIVE_ISSUE_CODES` now means crawl codes: `crawl.e2e-spec.ts`'s
   `checksApplicable <= ACTIVE_ISSUE_CODES.length`, `pages.e2e-spec.ts` "the detail answers for
   every catalogue check, and the answers add up" and `ChecksSection.test.tsx` must stay green —
   a CWV code leaking into `composePageChecks` would show as six `notYetChecked` rows there. Run
   `pnpm test:db -- pages crawl`. The README's "50 page checks" stays true (the speed codes are
   not checks) — check it reads so.
6. **Rollback.** Revert the commits; nothing is stored under the new codes yet.
7. **Commit points.** `feat(contracts): every issue code names the writer that owns it` ·
   `feat(contracts): Core Web Vitals thresholds, bands and six speed codes` ·
   `refactor(page-analysis): checks are keyed by crawl-owned codes` ·
   `feat(fe): parse and describe a speed finding`.

#### 1b. A crawl replaces only what it owns

1. **Deliverables.** `be/src/modules/pages/repositories/seo-issues/seo-issues.repository.ts`
   (`replaceCrawlFindingsForWorker`, deletes `code in CRAWL_ISSUE_CODES`);
   `seo-issues.repository.int-spec.ts` (new); `crawl-results.service.ts` and its spec call the
   renamed method.
2. **Pre-conditions.** 1a green.
3. **TDD points.** Before: `seo-issues.repository.int-spec.ts` → "a crawl's replace leaves the
   page's speed findings": insert `CWV_LCP_POOR` for a page, run the crawl replace with an empty
   set, assert the row remains (fails: today's delete takes every code of the page).
4. **Acceptance.** `pnpm --filter be test:db -- seo-issues crawl-results crawl`;
   `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`; `docker compose up -d --build`
   then `curl -fsS http://localhost:8080/api/health`.
5. **Regression guard.** ANALYSIS-007's "replaces the issues of every re-fetched page, even a page
   with none now" (`crawl-results.service.spec.ts`) — a re-crawl must still clear stale crawl
   findings.
6. **Rollback.** Revert; the method rename is internal.
7. **Commit points.** `fix(pages): a crawl replaces only the findings it owns`.

### Phase 2 — Pages are measured (change `page-speed-measurement`)

After it, every crawl queues its pages, a configured stack measures them, and speed findings
appear in the issue counts and in the page's SEO issues section, described by phase 1's
sentences. No badge yet; nothing half-built is reachable.

#### 2a. Outbound requests declare their own bounds

1. **Deliverables.** `be/src/infrastructure/remote-api/remote-api.core.ts` (`timeoutMs?`,
   `maxRetries?`, `headers?` on `IRemoteGetOptions`; defaults from `REMOTE_API_LIMITS`; caller
   headers cannot override `user-agent`); `remote-api.core.spec.ts`.
2. **Pre-conditions.** Phase 1 closed. D11.
3. **TDD points.** Before: "honours a per-call timeout", "makes exactly one request with
   maxRetries 0 on a 503", "sends caller headers beside the User-Agent" (fail: options ignored).
4. **Acceptance.** `pnpm --filter be test:ci -- src/infrastructure/remote-api src/modules/crawl`.
5. **Regression guard.** Every crawl fixture spec — the defaults must be bit-for-bit today's:
   `pnpm --filter be test:ci -- src/modules/crawl && pnpm --filter be test:db -- crawl`.
6. **Rollback.** Revert; no caller uses the options yet.
7. **Commit points.** `feat(remote-api): a caller may declare its own timeout, retries and headers`.

#### 2b. The key, configured and optional

1. **Deliverables.** `env-keys.constant.ts` (`PAGESPEED_API_KEY`); `env.schema/env.schema.ts`
   (optional string) and its spec; `infrastructure/config/page-speed-settings/` (new: token,
   factory, `PageSpeedRuntimeState`, `pageSpeedAvailabilityOf`, global module); contracts
   `page-speed/page-speed-availability-state.enum.ts` and
   `page-speed/page-speed-availability.interface.ts` (new — `pageSpeedAvailabilityOf` returns
   the contract type, D27); `app.module.ts` and `seed.module.ts` import it; `.env.example`
   (`PAGESPEED_API_KEY=` with a comment naming the README section); `docker-compose.yml` (`be`:
   `PAGESPEED_API_KEY: ${PAGESPEED_API_KEY:-}`); `be/test/support/create-test-app.ts`
   (`pageSpeedApiKey?`, always overriding the token — §14).
2. **Pre-conditions.** 2a. D12, D27.
3. **TDD points.** Before: `env.schema.spec.ts` → "accepts an empty PAGESPEED_API_KEY";
   `page-speed-settings.spec.ts` → "an empty or blank key is null";
   `page-speed-availability-of.spec.ts` → "no key is notConfigured, a key is active, a rejected
   key is keyRejected" (both fail: no module).
4. **Acceptance.** `pnpm --filter be test:ci -- src/infrastructure/config`;
   `cp .env.example .env.check && grep -n "^PAGESPEED_API_KEY=$" .env.check && rm .env.check`;
   `docker compose config | grep PAGESPEED_API_KEY`.
5. **Regression guard.** A clean clone must still boot: `docker compose up -d --build` with the
   committed `.env.example`, then `curl -fsS http://localhost:8080/api/health`.
6. **Rollback.** Revert; an unread variable is harmless.
7. **Commit points.** `feat(config): an optional PageSpeed key, empty by default`.

#### 2c. The `page_speed` table and its queue

1. **Deliverables.** Contracts `page-speed/page-speed-status.enum.ts`,
   `page-speed/page-speed-error.constant.ts` (new); `be/src/shared/page-speed-queue/
   page-speed-queue.constant.ts` (new); `be/src/persistence/schema/tables/page-speed/
   page-speed.schema.ts` (new) and `database-schema.ts`; generated `be/drizzle/0014_*.sql` and
   its snapshot; `be/src/modules/pages/repositories/page-speed/page-speed.repository.ts` and
   `.int-spec.ts` (new); `seo-issues.repository.ts` (`replacePageSpeedFindingsForWorker`);
   `pages/services/page-speed-queue/` and `pages/services/page-speed-results/` (new);
   `pages.module.ts` (providers, exports).
2. **Pre-conditions.** 2b. D3, D5, D11, D24, D25.
3. **TDD points.** Before, all in `page-speed.repository.int-spec.ts`: the CHECK refusals
   (`it.each`), "refuses attempts 6", SKIP LOCKED concurrency, the stale-attempt fence, the 24 h
   boundary pair, "re-queues a failed row", "leaves a queued or running row alone", "keeps the
   measurement when re-queued", "never claims a page its client's current run no longer has",
   "a failure, a release and an abandonment leave the measurement byte-for-byte", "a release
   gives back the attempt", "fails a row abandoned at attempt 5", cascade on page delete — each
   fails first on the missing table. Before: `seo-issues.repository.int-spec.ts` → "a speed
   replace leaves the page's crawl findings".
4. **Acceptance.** `pnpm db:generate`, then read `be/drizzle/0014_*.sql`: two `CREATE TYPE`, one
   `CREATE TABLE "page_speed"` with `ON DELETE cascade`, eight `CHECK`s, one partial index —
   nothing touching another table; `pnpm db:migrate`;
   `pnpm --filter be test:db -- page-speed seo-issues`;
   `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
5. **Regression guard.** The migration must apply on a database holding the seed:
   `docker compose up -d --build` over the existing volume, then
   `docker compose exec postgres psql -U tracker -d seo_tracker -c "\d page_speed"`.
6. **Rollback.** Not by editing the migration (never hand-edited): remove the schema file and
   `pnpm db:generate` a forward `DROP TABLE`/`DROP TYPE` migration. The table is a cache a
   re-crawl rebuilds.
7. **Commit points.** `feat(db): a page_speed row per page, its queue and its last measurement` ·
   `feat(pages): the PageSpeed queue — enqueue, claim, fence, give back` ·
   `feat(pages): a speed replace touches only speed findings`.

#### 2d. The crawl and the seed queue pages

1. **Deliverables.** `crawl/services/crawl-run-executor/crawl-run-executor.service.ts` (enqueue
   in `finalize`); `crawl.module.ts` already imports `PagesModule`;
   `seed/seed-runner/seed-runner.service.ts` (backfill + report line); `seed/seed.ts` (prints
   `pagespeed  N pages queued`).
2. **Pre-conditions.** 2c. D4, D13.
3. **TDD points.** Before: `crawl-run-executor.service.spec.ts` → "enqueues the run's pages in
   the finalize transaction" (asserts the same `tx` object) and "a superseded attempt enqueues
   nothing" (fail: no call); `seed-runner.int-spec.ts` → "the backfill queues each current page
   once, and a second run queues none" (fail: zero rows).
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/crawl src/seed`;
   `pnpm --filter be test:db -- seed-runner crawl`; on the stack: `docker compose up -d --build
   && docker compose run --rm seed`, then `docker compose exec postgres psql -U tracker -d
   seo_tracker -c "select status, count(*) from page_speed group by status"` shows 30 queued
   (two seed clients), and a second `docker compose run --rm seed` prints `0 pages queued`.
5. **Regression guard.** CRAWL-003 (fence): `crawl-runs.queue.int-spec.ts` and
   `crawl-run-executor.service.spec.ts` "writes nothing when a newer attempt holds the fence".
   CRAWL-008 outcomes unchanged: `pnpm --filter be test:db -- crawl`.
6. **Rollback.** Revert; queued rows with no worker are inert.
7. **Commit points.** `feat(crawl): a finished crawl queues its pages for PageSpeed` ·
   `feat(seed): queue every current page that has never been queued`.

#### 2e. The PageSpeed client: request, classification, extraction

1. **Deliverables.** `be/src/modules/page-speed/` skeleton: `page-speed.module.ts`,
   `constants/page-speed-worker.constant.ts`, `services/psi-client/`,
   `services/classify-psi-response/`, `services/extract-measurement/`,
   `services/cwv-issues/`, `services/retry-delay/` (each with spec);
   `be/test/fixtures/pagespeed/*`, manifest entries, `be/test/fixtures/record-pagespeed-fixtures.ts`.
2. **Pre-conditions.** 2a, 2c (error catalogue). D1, D10, D11, D22, D23. A local PageSpeed key
   for recording — VERIFY: the person executing this has one; without it the error fixtures are
   synthesized and every success fixture is VERIFIED against the documentation instead, and the
   task says so.
3. **TDD points.** Before: `extract-measurement.spec.ts` → "takes URL field data when Google has
   it", "falls back to the origin per metric", "falls back to the lab for LCP and CLS, never for
   INP", "returns null without LCP or CLS" (fail: no module); `classify-psi-response.spec.ts` →
   §10.5's precedence cases and the `it.each` over the error catalogue; `cwv-issues-of.spec.ts`
   → §10.1 boundaries, "never two codes for one metric", "severity from the catalogue";
   `retry-delay.spec.ts` → "1, 4, 16, 64 minutes"; `psi-client.spec.ts` → "sends the key in a
   header and never in the URL", "one request, no retry, 90 s timeout".
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/page-speed`;
   `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing.
5. **Regression guard.** The fixture manifest is shared with the crawl: `pnpm --filter be test:ci
   -- src/modules/crawl && pnpm --filter be test:db -- crawl`.
6. **Rollback.** Revert; the module is not yet imported anywhere.
7. **Commit points.** `test(fixtures): recorded PageSpeed answers, without the key` ·
   `feat(page-speed): read a PageSpeed answer into a measurement, with its source` ·
   `feat(page-speed): classify what Google answered` ·
   `feat(page-speed): a PageSpeed client with the key in a header`.

#### 2f. The worker

1. **Deliverables.** `services/rate-limiter/`, `services/page-speed-executor/`,
   `workers/page-speed-worker/` (each with spec); `page-speed.module.ts` (its own
   `PgNotificationListener`); `app.module.ts` imports `PageSpeedModule`;
   `be/test/e2e/page-speed.e2e-spec.ts` (new); `crawl.e2e-spec.ts` (I6 counts crawl-owned rows).
2. **Pre-conditions.** 2d, 2e. D11, D12, D21, D25, D27.
3. **TDD points.** Before: `page-speed-rate-limiter.spec.ts` → "spaces requests by the minimum
   interval", "a pause holds every slot", "a halt stops every slot";
   `page-speed-executor.service.spec.ts` → one case per outcome row of §9, "a failure never
   calls completeForWorker", "a 429 releases the row without spending an attempt", "no log line
   and no stored error contains the key"; `page-speed-worker.spec.ts` → "does not start without
   a key", "does not start with the worker flag off", "a rejected key halts both slots, leaves
   the row queued and marks the runtime state keyRejected"; `page-speed.e2e-spec.ts` → "a crawl
   queues its pages", "a measured page has its speed findings in the detail", "a speed finding
   counts among the issues and leaves the score and the order unchanged", "without a key the rows
   stay queued", "after Google rejects the key every row is still queued and the runtime state
   is keyRejected" (fixture `key-invalid.json`; the payload half of that case is added in 3a,
   when the payloads carry the state), "opening the list and the detail requests nothing from
   PageSpeed" — each fails first because nothing drains the queue.
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/page-speed`;
   `pnpm --filter be test:db -- page-speed crawl pages`;
   `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`; on the stack without a key:
   `docker compose up -d --build`, `docker compose logs be | grep -i pagespeed` shows "not
   configured" once and no request; with a key in `.env`: `docker compose up -d --build`, wait,
   then `docker compose exec postgres psql -U tracker -d seo_tracker -c "select status,
   count(*), count(measured_at) from page_speed group by status"` shows `done` rows with
   measurements, and `… -c "select code, count(*) from seo_issues where code like 'CWV_%' group
   by code"` lists only the six speed codes.
5. **Regression guard.** The crawl worker shares the process: `crawl-worker.spec.ts` and
   `pnpm --filter be test:db -- crawl`; shutdown must stop both workers before the pool ends —
   `docker compose restart be` and `docker compose logs be` show "PageSpeed worker stopped"
   before exit with no "pool ended" error.
6. **Rollback.** Remove `PageSpeedModule` from `AppModule`: rows stop draining, nothing else
   changes. Speed findings already stored stay readable, because phase 1's catalogue entries
   stay (a retired code keeps its entry — `PAGE_ANALYSIS_MODULE.md`); to remove them from
   screens an operator runs `delete from seo_issues where code like 'CWV\_%'` by hand — data,
   not schema.
7. **Commit points.** `feat(page-speed): an in-process rate limiter with a shared pause` ·
   `feat(page-speed): measure one queued page and write it with its findings` ·
   `feat(page-speed): a worker that drains the queue, stopped by a missing or rejected key` ·
   `test(e2e): a crawl is measured, and reading never calls Google`.

#### 2g. The README says how to turn it on

1. **Deliverables.** `README.md`: "Run it from a clean clone" gains the optional key step; a new
   "PageSpeed Insights" subsection under Decisions (mobile and why — D2; automatic, cached,
   at most daily — D4/D5; failure behaviour — D11; no key — D12; a rejected key and its symptom,
   "PageSpeed key rejected" on every screen until the key is fixed and the API restarted — D27;
   the 429 pause is per process — O1; rank positions remain simulated, PageSpeed is the only
   Google call); "Not done" loses
   "the network ones (Lighthouse, Core Web Vitals)". `docs/decisions.md` gains the measured
   facts once known (quota used per crawl, typical PSI latency).
2. **Pre-conditions.** 2f.
3. **TDD points.** None — prose. The check is a reader following it from a clean clone.
4. **Acceptance.** In a fresh clone directory: `git clone <repo> /tmp/skt-clean && cd
   /tmp/skt-clean && git checkout feat/issue-report-and-pagespeed && cp .env.example .env &&
   docker compose -p skt-clean up -d --build && docker compose -p skt-clean run --rm seed`, then
   the README's own `curl` shows `"state":"notConfigured"` (from phase 3 on; in phase 2,
   `docker compose -p skt-clean logs be | grep -i "not configured"`). Then `docker compose -p
   skt-clean down` (never `-v` on a volume you need; this one is disposable but the rule holds).
5. **Regression guard.** README commands still match `package.json` scripts: `pnpm run` lists
   every script the README names.
6. **Rollback.** Revert.
7. **Commit points.** `docs(readme): PageSpeed — the optional key, mobile, and what failure looks like`.

### Phase 3 — Core Web Vitals per URL on screen (change `core-web-vitals-display`)

#### 3a. The list and the detail carry the speed summary

1. **Deliverables.** Contracts `page-speed/page-speed-summary.interface.ts` (new;
   `IPageSpeedAvailability` already exists from 2b); `page-list-item.interface.ts`,
   `page-list-response.interface.ts`, `page-detail.interface.ts`;
   `pages/repositories/page-list/page-list.repository.ts` (`left join page_speed` in
   `listSlice`, still five statements), `page-detail.repository.ts`,
   `pages/services/page-read/page-read.service.ts` (bands via `cwvBandOf`; `lastError` only when
   failed; availability from `pageSpeedAvailabilityOf(settings, runtime)`);
   `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` (summary and availability schemas) —
   same commit as the contracts.
2. **Pre-conditions.** Phase 2 closed. D3, D20, D27.
3. **TDD points.** Before: `page-read.service.spec.ts` → "a summary carries each metric's band
   from the thresholds", "a never-measured page has a null measurement", "lastError is null
   unless failed", "the availability state comes from pageSpeedAvailabilityOf";
   `page-list.repository.int-spec.ts` → the statement-count case still says five;
   `pages.e2e-spec.ts` → "the list and the detail carry the PageSpeed state" (fail: no field).
   `page-speed.e2e-spec.ts` → "every non-good badge in the list has its finding in the detail,
   and no good one does" (fails: no badge data), and the 2f key-rejected case gains its payload
   half: "the list and the detail say keyRejected".
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/pages`;
   `pnpm --filter be test:db -- page-list pages page-speed`; `pnpm --filter fe test:ci --
   PageSchemas`; on the seeded stack `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20'
   | grep -o '"pageSpeedAvailability":{[^}]*}'`; then `docker compose exec -T postgres psql -U
   tracker -d seo_tracker < be/test/explain/pages-list.explain.sql` and read the plan: the
   `page_speed` access is a PK probe or a hash on the small table.
5. **Regression guard.** PAGES-010 order and PAGES-011 spread: `page-list.repository.int-spec.ts`
   in full.
6. **Rollback.** Revert contracts, backend and schema together (one commit).
7. **Commit points.** `feat(pages): the list and the detail carry each page's Core Web Vitals`.

#### 3b. The list shows three badges

1. **Deliverables.** `fe/src/Core/Helpers/DescribeCwv/describeCwv.ts` (+test),
   `Core/Constants/cwvBandColor.ts`, `Core/Constants/pageSpeedAvailabilityCopy.ts`,
   `Modules/Pages/PagesTable/CwvBadges/CwvBadges.tsx` (+test), `PagesTable.tsx` (column, header
   state, legend), `PagesViewModel.ts`.
2. **Pre-conditions.** 3a. D27.
3. **TDD points.** Before: `describeCwv.test.ts` → "3100 ms reads 3.1 s", "0.123 reads 0.12",
   "origin reads 'Real visitors to the whole site'"; `CwvBadges.test.tsx` → one case per cell
   state of §1.3, including "a queued row reads Paused under keyRejected" (fail: no component).
   After: `PagesTable.test.tsx` → "the header says PageSpeed is not configured, and the cells
   are dashes" and "the header says the key was rejected, and stored badges stay".
4. **Acceptance.** `pnpm --filter fe test:ci -- describeCwv CwvBadges PagesTable`;
   `pnpm lint && pnpm typecheck && pnpm test`; `docker compose up -d --build`, sign in, open
   `/pages`: three badges or "Measuring…" per row, legend under the table, no console error.
5. **Regression guard.** PAGELIST-006 ("never re-sorts"), PAGELIST-002 cells:
   `PagesTable.test.tsx` in full.
6. **Rollback.** Revert.
7. **Commit points.** `feat(fe): Core Web Vitals badges beside the score`.

#### 3c. The page's Speed block, and the score explains itself

1. **Deliverables.** `Modules/PageDetail/SpeedSection/SpeedSection.tsx` (+test),
   `PageDetailScreen.tsx`, `ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.ts`
   (+test), `ScoreExplainer.tsx` (comment).
2. **Pre-conditions.** 3b (shares `describeCwv`).
3. **TDD points.** Before: `explainScore.test.ts` → "the fifth paragraph says speed is scored
   separately" (fail: four paragraphs); `SpeedSection.test.tsx` → each state, including "under
   keyRejected the block opens with the key-rejected notice"; "a lab value says it may vary"; "INP without data says why"; "shows the lab performance score as a
   caption" (fail: no component).
4. **Acceptance.** `pnpm --filter fe test:ci -- SpeedSection explainScore ScoreExplainer`;
   `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`; browser: a page detail shows the
   Speed block and the new paragraph; README "Decisions" gains one line on how to read a badge.
5. **Regression guard.** PAGEDETAIL-010's arithmetic tests (`explainScore.test.ts` existing
   cases) unchanged.
6. **Rollback.** Revert.
7. **Commit points.** `feat(fe): a Speed block on the page, scored apart from SEO` ·
   `docs(readme): how to read a Core Web Vitals badge`.

### Phase 4 — The issue report (change `client-issue-report`)

#### 4a. Every finding explained in plain words

1. **Deliverables.** `seo-issue-catalogue.constant.ts` and `site-check-catalogue.constant.ts`
   (required `plain` on all 56 + 9 entries); `packages/contracts/src/domain/seo/
   issue-plain-copy.test.ts` (new) with named bounds `PLAIN_COPY_LIMITS` and the
   `FIX_AUDIENCE_WORDS` list (CMS, editor, developer, plugin, hosting, …) beside it.
2. **Pre-conditions.** Phase 1 closed (the six speed entries exist). D14, O4 (the five CWV-risk
   heuristics say they are risks, not measurements).
3. **TDD points.** Before: the four `issue-plain-copy.test.ts` cases (fail: no `plain`).
4. **Acceptance.** `pnpm --filter @app/contracts test:ci`; `pnpm typecheck`; and a reading pass —
   the copy is read aloud against §1.2's voice: consequence in traffic or clicks, no jargon
   without a gloss, fix names who acts.
5. **Regression guard.** `label`/`hint`/`explanation`/`sources` untouched:
   `git diff main -- packages/contracts/src/domain/seo/seo-issue-catalogue.constant.ts | grep
   -E "^[-+]\s+(label|hint|explanation):"` prints nothing.
6. **Rollback.** Revert; nothing reads `plain` yet.
7. **Commit points.** `feat(contracts): what, why and fix in plain words for every finding`.

#### 4b. The report endpoint

1. **Deliverables.** Contracts `issue-report/client-issue-report.interface.ts` (new);
   `be/src/modules/issue-report/` (module, controller, service, pure collapse with spec,
   repository with int-spec); `app.module.ts`; `be/test/e2e/isolation-matrix.e2e-spec.ts` (row);
   `be/test/e2e/issue-report.e2e-spec.ts` (new).
2. **Pre-conditions.** Phase 2 closed (speed findings carry `source`). D15, D16, D17.
3. **TDD points.** Before: write the matrix row first and watch the static case "covers every
   route that takes an id or a clientId" fail — the row names a route the app does not register
   yet. (The row's own comparison would NOT fail: with no route, the owned id and the missing id
   both answer the same `NOT_FOUND`, which is exactly why the static case exists.) Before:
   `collapse-origin-findings.spec.ts`
   (fail: no module); `issue-report.repository.int-spec.ts` → the three I23 cases;
   `issue-report.e2e-spec.ts` → "returns one snapshot of page, speed and site findings",
   "an origin speed finding on 15 pages is one Whole site row", "a client with no finished crawl
   has generatedFrom null and no issues", "the report carries the PageSpeed state" (D27).
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/issue-report`;
   `pnpm --filter be test:db -- issue-report isolation-matrix default-deny`; on the seeded stack:
   `curl -s -b c.txt http://localhost:8080/api/clients/1/issues | head -c 600` and, as the other
   seed user, the same id answers `404` with the body of `…/clients/2000000000/issues`.
5. **Regression guard.** ISO-001 default-deny (`default-deny.e2e-spec.ts`); ESLint's `ForWorker`
   ban over the new controller: `pnpm --filter be lint`.
6. **Rollback.** Revert; read-only.
7. **Commit points.** `feat(issue-report): one snapshot of a client's findings, scoped to its owner`.

#### 4c. The report screen

1. **Deliverables.** `fe/src/Gateways/IssueReportGateway/` (+schemas, tests), `gateways.ts`;
   `ViewModels/IssueReportViewModel/` (+services, tests); `App/Router/SearchSchemas/
   IssuesSearchSchema/` (+test), `router.tsx`; `Modules/Issues/**` (+`IssuesScreen.test.tsx`);
   `Core/Constants/severityLabel.ts`; `Modules/_Shared/AppLayout/AppLayout.tsx` (nav).
2. **Pre-conditions.** 4a, 4b. D9, D17, D18, D19, D27, D28.
3. **TDD points.** Before: `filterReport.test.ts` → "a page filter keeps site and whole-site
   rows", "Improvement is hidden by the default levels", "type speed keeps only pageSpeed codes";
   `groupByIssue.test.ts` → "orders codes by affected pages, a Whole site row counting its N";
   `groupByPage.test.ts` → "Whole site first, then pages by Critical, Important, Improvement";
   `issuesSearchSchema.test.ts` → "defaults to By issue without Improvement";
   `IssueReportViewModel.test.ts` → "drops a superseded answer", "a 404 is notFound, not an
   error" (all fail: no module). After: `IssuesScreen.test.tsx` → each view of §12, "the rubric
   is always shown", "Technical details are collapsed", "shows the notice of each PageSpeed
   state" (copy from `pageSpeedAvailabilityCopy`, which phase 3b created — or this sub-phase
   creates it if phase 4 runs first); `router.test.tsx` → "/issues requires a
   session".
4. **Acceptance.** `pnpm --filter fe test:ci -- IssueReport filterReport groupBy issuesSearch
   IssuesScreen router`; `pnpm lint && pnpm typecheck && pnpm test`; browser walk of §11 C.
5. **Regression guard.** SHELL-003 (sign-out resets every ViewModel): `SessionViewModel.test.ts`
   — the new ViewModel must be in the reset list.
6. **Rollback.** Revert; remove the nav entry.
7. **Commit points.** `feat(fe): the issue report — by issue or by page, filtered in memory` ·
   `feat(fe): Issues in the navigation`.

#### 4d. Entry points and one severity vocabulary

1. **Deliverables.** `PagesTable/IssueCounts/IssueCounts.tsx` (link, labels),
   `ClientsTable.tsx` (View issues), `IssuesSection.tsx` and `SiteChecks.tsx` (labels from
   `severityLabel`); README ("Decisions": the severity rubric, verbatim from §1.2; the report).
2. **Pre-conditions.** 4c. D9, D18, D28.
3. **TDD points.** Before: `PagesTable.test.tsx` → "the issue count opens the report filtered to
   this page"; `ClientsTable.test.tsx` → "View issues opens the client's report";
   `IssuesSection.test.tsx` → "groups read Critical, Important, Improvement" (fail: old labels).
4. **Acceptance.** `pnpm --filter fe test:ci`; `pnpm lint && pnpm typecheck && pnpm test &&
   pnpm test:db`; `docker compose up -d --build`; browser: list row → report filtered with Whole
   site rows; Clients → View issues; page detail groups read Critical/Important/Improvement.
5. **Regression guard.** PAGEDETAIL-005 scenarios (stored-bound sentences) and PAGEDETAIL-008
   ("on 5 of 15 pages") in `IssuesSection.test.tsx`.
6. **Rollback.** Revert.
7. **Commit points.** `feat(fe): reach the report from a page row and from a client` ·
   `feat(fe): one name per severity — Critical, Important, Improvement` ·
   `docs(readme): the issue report and its severity rubric`.

### Phase 5 — Harvest, archive, deposit

1. **Deliverables.** The harvest of §18 into the owning documents; each change archived
   (`/opsx:archive`), its headings rewritten into the `[ID]` form, MODIFIED blocks folded into
   the existing requirements by hand; deposits; this plan moved to `docs/_plans-archive/` with
   its header.
2. **Pre-conditions.** Phases 1–4 closed; every browser walk run.
3. **TDD points.** None.
4. **Acceptance.** `pnpm exec openspec validate --specs`; `git grep -n "Requirement \[" openspec/specs`
   lists every new id exactly once; `git grep -n "invariant: " -- '*.md'` lists every deposited
   id; `git grep -rn "issue-report-and-pagespeed" -- ':!docs/_plans-archive' ':!openspec/changes'`
   prints nothing.
5. **Regression guard.** No module document or skill links into `docs/_plans/`.
6. **Rollback.** An archive is reversed by moving the change back and restoring `specs/` from git.
7. **Commit points.** `docs: harvest the PageSpeed and issue-report work into its owners` ·
   `docs(openspec): archive the four changes and deposit their requirements` ·
   `docs(plans): archive issue-report-and-pagespeed`.

Closed 2026-10-10 except its last deliverable. The four changes are archived under
`openspec/changes/archive/2026-10-10-*`. The plan's move to `docs/_plans-archive/` is deferred to
Phase 6 step 8 (D29): a plan archived while its success path rests on synthesized answers would
claim a finished present it does not have.

### Phase 6 — Verified against the live API (no change; plan-only)

Phases 1–5 shipped every PageSpeed behaviour pinned against fixtures, but the success-path
answers — `be/test/fixtures/pagespeed/{url-field,origin-only,lab-only,failed-document,
errored-document,server-error}.synthesized.json` — were written from Google's documentation,
because no key was available (D29). The brief requires a real PageSpeed call. This phase makes the
fixtures real, settles the VERIFY items of §8, §10.2 and D23, and watches the stack drain against
Google.

**No OpenSpec change carries this phase.** Its requirements (SPEED-001..013 and the rest) are
already approved truth. This phase changes no requirement; it replaces test inputs and records
measurements. The four archived changes are not reopened. Where a test NAME changes, the archived
`tasks.md` and the deposit line that cite it are amended in step 8, with an `AMENDED` line — and
nowhere else. The items below are this phase's work list. They are ticked here, because no
`tasks.md` holds them.

**Who does what.** The user does steps 1–2. The session does steps 3–8. The session never asks
for the key, never reads `.env` aloud, and never prints a line that could contain the key. It
learns the key is in place only from the user's word and from the worker's own log line.

**Steps.**

- [ ] 6.1 **User:** create a Google Cloud project; enable the PageSpeed Insights API; create an
  API key restricted to that API (the README's "Run it from a clean clone" lists the steps). Put
  it in the local `.env` as `PAGESPEED_API_KEY` — `.env` is git-ignored and is never committed.
  Then run `docker compose up -d`.
- [ ] 6.2 **User:** tell the session the key is in place.
- [ ] 6.3 **Record real fixtures** with `be/test/fixtures/record-pagespeed-fixtures.ts`:
  url-field, origin-only and lab-only. Add a real failed-document answer if a URL exists that
  PageSpeed cannot load and that the crawler's address guard is not involved in. Replace the
  `*.synthesized.json` success fixtures read by `extract-measurement.spec.ts`,
  `classify-psi-response.spec.ts`, `page-speed-executor.service.spec.ts`,
  `be/test/e2e/page-speed.e2e-spec.ts` and `be/test/e2e/issue-report.e2e-spec.ts` (through
  `be/src/modules/page-speed/_testing/read-page-speed-fixture.ts` and the manifest) with the
  recorded ones. Keep a synthesized file only where no real answer can be produced on demand — a
  5xx, and a quota error unless one occurs — and keep its `.synthesized.json` name.
  VERIFY: whether `rate-limited.json` and `key-invalid.json`, which carry no `.synthesized` suffix,
  were recorded or written by hand. Rename whichever was written by hand.
  Then settle the VERIFY items, amending §8, §10.2, §10.5 and D23 to what the answers show:
  - `loadingExperience.origin_fallback` semantics;
  - the CLS ×100 scale — check the `distributions` bounds against the percentile;
  - the metric key names;
  - header authentication (`x-goog-api-key`) working at all;
  - the quota-error shape with a real key.
  If the recorded answers contradict an assertion, the code is corrected first. Then a
  `fix(page-speed): …` commit names the defect a synthesized fixture had hidden.
- [ ] 6.4 **Live end-to-end on the docker stack.**
  - `docker compose logs be | grep "PageSpeed worker started"` prints the line.
  - The queued rows (834 at the time of writing) drain at least 1 s apart:
    `docker compose logs be` request timestamps are ≥ `PAGE_SPEED_MIN_INTERVAL_MS` apart.
  - `docker compose exec postgres psql -U tracker -d seo_tracker -c "select status, count(*), count(measured_at) from page_speed group by status"`
    shows `done` rows with measurements.
  - `… -c "select code, count(*) from seo_issues where code like 'CWV\_%' group by code"` lists
    only the six speed codes.
  - The list, detail and report payloads (`curl -b` after sign-in) carry measurements and
    `"state":"active"`.
  - For one URL, the stored LCP, INP and CLS are compared with pagespeed.web.dev, mobile.
    Field values must match for the same CrUX window. Lab values are only expected to be close,
    and the comparison says which source each value came from.
- [ ] 6.5 **Failure behaviour against the real API.**
  - Put a deliberately wrong key in `.env` and run `docker compose up -d` (the container is
    recreated with the changed environment).
  - Every payload says `"state":"keyRejected"`.
  - `select status, count(*) from page_speed group by status` shows the queued rows unchanged.
  - `docker compose logs be | grep -c "Google rejected PAGESPEED_API_KEY"` prints 1.
  - Restore the key and run `docker compose up -d` again: the state returns to `active` and the
    rows drain.
- [ ] 6.6 **Record measured facts** in `docs/decisions.md`, and the cost per crawl in
  `PAGE_SPEED_MODULE.md` (§18):
  - PSI calls per crawl (≤ 15 per client);
  - typical latency (median and slowest of the drain, from the log);
  - quota headroom against the default daily quota (25 000/day — VERIFY in the Cloud console for
    this project);
  - the time to drain the seed's backlog.
- [ ] 6.7 **Browser walk.**
  - `/pages`: badges, legend, tooltips with source and date.
  - `/pages/:id`: Speed block with sources and dates; the fifth score paragraph.
  - `/issues`: By issue and By page, level filters with Improvement hidden by default, the Speed
    type, Whole site rows kept under a page filter.
  - No console error on any screen. Screenshots are optional.
- [ ] 6.8 **Close.**
  - Tick 6.1–6.8.
  - Amend the archived `openspec/changes/archive/2026-10-10-*/tasks.md` lines and the module
    deposit lines only where a cited test name changed, each with an `AMENDED` line.
  - Move this plan to `docs/_plans-archive/` with its header: branch, what was harvested where,
    what was left open.

1. **Deliverables.** Recorded `be/test/fixtures/pagespeed/*.json` and their manifest entries.
   Specs pointed at the recorded files. Amended §8/§10.2/§10.5/D23 text in this plan.
   `docs/decisions.md` and `PAGE_SPEED_MODULE.md` facts. The archived plan.
2. **Pre-conditions.** Phases 1–5 closed. A key the user created (6.1–6.2). D29.
3. **TDD points.** The recorded fixtures replace the synthesized ones under the existing
   assertions. Every assertion that fails on a real answer is a finding: read it before changing
   it. If the code was wrong, fix the code under the unchanged assertion. If the assertion encoded
   a wrong reading of the documentation, change the assertion. Either way, record which it was in
   the commit body. No new test is written before a real answer shows what it must say.
4. **Acceptance.**
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db` green on the recorded fixtures.
   - `git grep -n -E "AIza|key=" -- be/test/fixtures` prints nothing.
   - 6.4's and 6.5's queries and log greps answer as stated.
5. **Regression guard.**
   - The crawl shares the fixture manifest: `pnpm --filter be test:ci -- src/modules/crawl && pnpm --filter be test:db -- crawl`.
   - The key must not escape: `git status --porcelain` shows no `.env`; the 6.3 grep above;
     `docker compose logs be | grep -c AIza` prints 0.
6. **Rollback.**
   - Fixtures: `git revert` restores the synthesized files.
   - Key: delete the key in the Google Cloud console, then empty `PAGESPEED_API_KEY` in `.env`.
     Measurements already stored stay and age out — a re-crawl re-queues rows at least 24 h old.
7. **Commit points.** `test(fixtures): PageSpeed answers recorded from the live API` ·
   `fix(page-speed): …` (only if 6.3 finds a defect; one commit per defect) ·
   `docs(plans): settle the PageSpeed VERIFY items against recorded answers` ·
   `docs: PageSpeed cost, latency and quota as measured` ·
   `docs(plans): archive issue-report-and-pagespeed`.

---

## 16. Risks

| # | Risk | The check that catches it |
| --- | --- | --- |
| R1 | PSI's real JSON differs from §10.2 (origin fallback flag, CLS scale, key names) | the recorded fixtures of 2e and `extract-measurement.spec.ts`; the live acceptance of 2f compares a stored value with the PSI web UI for one URL |
| R2 | PSI error shapes differ from §10.5 (quota as 403, runtime errors as 500) | recorded `key-invalid` / `failed-document` fixtures; amend §10.5 and the task with `AMENDED` |
| R3 | The key leaks through an error message or a log | `psi-client.spec.ts` and the executor's log-serialisation case; `git grep -n "AIza"` in 2e's acceptance |
| R4 | The enqueue upsert fails and takes a crawl's finalize with it | `crawl-run-executor.service.spec.ts` covers the call; `crawl.e2e-spec.ts` runs the real finalize with enqueue on every crawl case |
| R5 | Adding speed codes makes a crawl-only list include them (checks list, seed-page, schemas) | 1a's regression guard: `ChecksSection.test.tsx`, `pages.e2e-spec.ts` "answers add up", `crawl.e2e-spec.ts` |
| R6 | Two workers in one process race the pool on shutdown | 2f's `docker compose restart be` log check |
| R7 | A threshold changes and stored findings disagree with read-time badges until re-measured | stated in `PAGE_SPEED_MODULE.md`; I29 forces the catalogue and thresholds to move together; the next crawl re-queues measurements ≥ 24 h old |
| R8 | The report's "type" filter files the five HTML CWV-risk checks under SEO, surprising a reader looking under Speed | O4's reopen trigger; `issueTypeOf.test.ts` pins today's answer so a change is deliberate |
| R9 | MODIFIED deltas are not folded by the tool against `[ID]`-form specs | VERIFY in each proposal; phase 5 folds them by hand and `openspec validate --specs` checks the result |
| R10 | Quota: 30 seed pages + re-crawls exceed the daily limit | VERIFY the default quota; `docs/decisions.md` records calls per crawl measured in 2f; the 429 pause degrades to one call per minute rather than failing pages |
| R11 | Recording live fixtures, or the live walk, leaks the key into a file, a commit or a log | Phase 6 acceptance `git grep -n -E "AIza\|key=" -- be/test/fixtures`; the recorder refuses to write a file containing the key; `git status --porcelain` shows no `.env`; `docker compose logs be \| grep -c AIza` prints 0 |

---

## 17. Cross-workspace touchpoints

| Workspace | Changes | Ships with |
| --- | --- | --- |
| `packages/contracts` | owner, CWV enums/thresholds/band, six codes, error catalogue, summary/availability/report interfaces, plain copy | the be code that fills each and the fe schema that parses it, same commit |
| `be` | catalogue-typed checks; owner-scoped replaces; `page_speed` + migration 0014; queue services; crawl enqueue; seed backfill; `page-speed` module; `issue-report` module; RemoteApiCore options; settings provider | — |
| `fe` | schemas; `describeIssue` move; badges; Speed block; explainer; Issues screen, route, nav, links; severity vocabulary | the contracts change it parses |
| docker | `docker-compose.yml` passes `PAGESPEED_API_KEY` to `be` (2b); no new service | `.env.example` |
| CI | no workflow change: `cp .env.example .env` gives an empty key, so CI never calls Google; `test:db` already runs the new int- and e2e specs | — |
| docs | README (2g, 3c, 4d), `docs/decisions.md`, module documents (§18) | the phase that makes them true |

---

## 18. README and harvest

**The final README says:** that the app measures every crawled page with Google PageSpeed
Insights automatically, mobile only and why (mobile-first indexing, half the calls); how to get a
key (Google Cloud console → enable the PageSpeed Insights API → create an API key, restrict it to
that API) and that it goes in `.env` as `PAGESPEED_API_KEY`, never in the repository; that without
a key everything else works and the UI says "PageSpeed not configured"; the symptom of a key Google
refuses — "PageSpeed key rejected" on every screen, measurements paused, nothing lost — and the
cure: fix the key in `.env` and restart the API (D27); that measurements are
cached and refreshed at most daily, on crawl; what happens when Google fails (retries 1/4/16/64
min, a shared pause on 429, last good measurement kept, the screen says how old); the source
fallback (this page → whole site → lab) and why INP has no lab value; that speed is scored apart
from the SEO score and why; the severity rubric verbatim; that rank positions are still
simulated and PageSpeed is the only call to Google; the per-process pause as a known limitation.

**Harvest (before archiving), each fact to its owner:**

- `be/src/modules/page-speed/PAGE_SPEED_MODULE.md` — **new**: the worker's lifecycle, §10.2–§10.8,
  the failure table, why no heartbeat, why the key is in a header (D23), the per-process pause
  (O1), R7, the measured quota cost per crawl.
- `be/src/modules/pages/PAGES_MODULE.md` — owns `page_speed` (D24); "the list is four
  statements" corrected to five (stale today); speed findings count in issues and never in the
  score (D7).
- `be/src/modules/crawl/CRAWL_MODULE.md` — finalize enqueues the run's pages (D4); also correct
  the stale "retries for 429/5xx/network only" to include 408 and timeouts (O5).
- `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` — the `owner` field and why (D6); speed
  codes are catalogue entries without checks, so ANALYSIS-002's "one `<code>.check.spec.ts` per
  catalogued code" applies to crawl-owned codes only and speed codes are pinned by
  `cwv-issues-of.spec.ts` (O5); the plain copy and its test (D14); the five CWV-risk checks stay
  and say they are risks (O4). The ANALYSIS-002 deposit line is also corrected: the five
  CWV-risk checks share `cwv-risks.check.spec.ts` (O5).
- `be/src/modules/issue-report/ISSUE_REPORT_MODULE.md` — **new**: why a module with no table,
  the current-run rule (D15), origin collapse (D8), why no server-side filters (D17).
- `be/src/modules/clients/CLIENTS_MODULE.md` — site checks are now also read by the report.
- `skills/fe-be-roundtrip/SKILL.md` — nothing; `fe/skills/` — nothing new beyond what the
  folder-structure rule already says about a Service moving to `Core/Helpers`.
- `docs/decisions.md` — D1–D28 condensed with their measurements.
- OpenSpec — the requirements of the four deltas, deposited after archive into the module
  documents above (the page-speed ids into `PAGE_SPEED_MODULE.md`, the report ids into
  `ISSUE_REPORT_MODULE.md`, ANALYSIS-012/013 into `PAGE_ANALYSIS_MODULE.md`, PAGES-013/014 into
  `PAGES_MODULE.md`, SEED-006 into `PAGES_MODULE.md` beside SEED-003, REMOTE-002/003 into
  `CRAWL_MODULE.md` beside the outbound-HTTP bullet). The frontend ids have no module document
  to receive them, as `_root/data-isolation` had none; phase 5 decides where they land and says
  so in the archive header.

---

## 19. Out of scope

- **Desktop measurements** — D2: doubles calls and duplicates every issue; README says why.
- **Measurement history and trends** — D3: nobody reads a history; one row per page.
- **A per-page "measure now" button** — the brief forbids it; a re-crawl re-queues.
- **CWV in the SEO score** — D7: no industry precedent; the score stays the share of checks.
- **A computed priority** (weights × pages × position) — D9: built on simulated positions.
- **Real rank positions from Google** — the original brief; positions stay simulated.
- **Server-side report filtering, pagination, export** — D17 and O3.
- **A DB-held pause for several API processes** — D11/O1: no such deployment exists.
- **Replacing the five HTML CWV-risk heuristics with measurements** — O4: they stay as notices.
- **Fixing ANALYSIS-002's deposit wording and CRAWL_MODULE.md's retry list beyond the harvest
  lines in §18** — O5.

---

## 20. Open questions and the decision log

### Open questions

- **O1.** 429 pause held per process. *Default:* in-memory. *Reopens when* more than one
  API/worker process runs.
- **O2.** Mobile only. *Default:* mobile. *Reopens when* desktop is requested.
- **O3.** Report not paginated. *Default:* one snapshot. *Reopens when* `CRAWL_POST_LIMIT` grows
  beyond ~100.
- **O4.** The 5 HTML "CWV risk" heuristics stay at notice; their plain copy says they are risks,
  not measurements; the report files them under SEO. *Default:* as stated. *Reopens when*
  marketers confuse them with real CWV.
- **O5.** Doc/code mismatches found during inventory — ANALYSIS-002 (`PAGE_ANALYSIS_MODULE.md:342`)
  requires one `<code>.check.spec.ts` per code but the 5 CWV-risk checks share
  `cwv-risks.check.spec.ts`; `CRAWL_MODULE.md:72-74` says retries "429/5xx/network only" while
  code also retries 408 and timeouts. *Default:* out of scope except the harvest lines in §18,
  which state how ANALYSIS-002 applies to pageSpeed-owned codes (they have no check; they are
  pinned by `cwv-issues-of.spec.ts`). *Reopens when* either document is next edited for another
  reason.
- **O6 — RESOLVED 2026-10-10 by D27.** A rejected key halts the queue (D11) while the wire's only
  flag was `configured` (D12/D17), so the screen would have kept showing "Measuring…" under a key
  Google refuses. Resolved as recommended: the flag is widened to
  `state: 'notConfigured' | 'active' | 'keyRejected'`.
- **O7 — RESOLVED 2026-10-10 by D28.** D9 named the levels Critical / Important / Improvement
  without saying where. Resolved as the default: everywhere severity is shown, from one `Record`;
  PAGEDETAIL-005 is modified accordingly.

### Decision log (verbatim; append-only)

D1. CWV per metric: field URL → field origin → lab (Lighthouse); INP is field-only (url → origin → "no data"). Each value carries source ∈ {url, origin, lab}. Why: only this gives all three metrics for every page with an honest source. Options rejected: field-only (most low-traffic blog pages collapse to identical origin values / no data — can't tell which page is in trouble); lab-only (no INP, TBT is not INP, lab values flap between runs).

D2. strategy=mobile only. Why: mobile-first indexing, half the calls, brief allows picking one with a README explanation. Rejected: both (doubles calls, duplicates issues per strategy, 6 badges); mobile with unused strategy column (a field without a reader).

D3. Table page_speed: one row per page, PK page_id (FK pages ON DELETE CASCADE). Job columns (status queued|running|done|failed, attempts, locked_until, next_attempt_at, last_error) and the last SUCCESSFUL measurement as columns (lcp_ms + lcp_source, inp_ms + inp_source (inp_source url|origin only), cls + cls_source, performance_score 0..100, measured_at) with an all-or-none CHECK for the measurement (INP may be null within a measurement when no field data). Band (good/needsImprovement/poor) is derived at read time from thresholds in contracts (LCP 2500/4000 ms, INP 200/500 ms, CLS 0.1/0.25) — not stored. A failed attempt never touches measurement columns — pinned by a test. Why: one row is both cache and queue; nobody reads history (like seo_issues). Rejected: jobs+append-only results (history no one reads, distinct-on on every screen, retention needed); metrics in jsonb (no CHECKs, jsonb filters).

D4. PSI enqueue happens inside the crawl finalize transaction (upsert page_speed status=queued + NOTIFY page_speed_queued); a separate PageSpeedWorker claims rows with SKIP LOCKED under its own lease (same lease/attempts/fencing pattern as crawl_runs; PgNotificationListener is generic and reusable). The worker skips pages that are no longer in their client's current run (don't burn quota on dead URLs). Why: atomic enqueue; crawl does not depend on Google. Rejected: synchronous in crawl pipeline (crawl lease 60 s / 3 attempts break, Google outage fails crawls → CRAWL_ABANDONED); periodic sweeper (no guaranteed enqueue point, silent gaps).

D5. Crawl enqueues a page for PSI when it has no row, its last attempt failed, or measured_at is older than PAGE_SPEED_FRESH_FOR_MS = 24 h. No scheduler. Why: field data changes at most daily; repeat crawls don't burn quota. Boundary test at 24 h (< vs <=).

D6. CWV issues are codes in the shared catalogue (owner: 'pageSpeed') stored in seo_issues, details = {value, min, max, source}. Crawl replaces only crawl-owned codes; the PSI worker replaces only pageSpeed-owned codes (catalogue gains an owner field: 'crawl' | 'pageSpeed'). Invariant "crawl never touches pageSpeed codes" pinned by a test; the code sets are disjoint so concurrent writes don't conflict. Why: thresholds live in one place (TS); pages-list counts, page-detail IssuesSection and the report all agree with no extra read path. Rejected: SQL view computing issues at read (thresholds duplicated SQL/TS → badge/issue mismatch); separate page_speed_issues table (every reader must UNION).

D7. CWV do NOT enter the SEO score: pageSpeed-owned codes are excluded from pageScoreOf, the SQL sort expression in page-list.repository.ts, and ChecksSection's check list (pages.checks_* columns are written only by the crawl and untouched). CWV get their own traffic-light column next to Score in the pages list and a separate "Speed" block on page detail. CWV issues DO appear in the issue counts and in the report. ScoreExplainer gains "speed is scored separately". Why: this is how Lighthouse (separate SEO vs Performance), Google Search Console (separate CWV report), Semrush (separate CWV thematic report) do it; the scale is familiar to marketers; formula and sort unchanged. Rejected: CWV in score at read time (no industry precedent, costlier); worker writing pages.checks_* (two writers on CHECK-constrained columns, crawl would wipe the contribution).

D8. Invariant "badge ⇔ issue": any metric not in the good band, from ANY source, produces an issue; details.source ∈ {url, origin, lab}. The report collapses source=origin issues into one row "whole site (N pages)". Lab values get a "may vary" note in UI. Why: literal brief requirement; duplicates handled by collapsing (the pages-list siteWide count already groups codes shared across pages). Rejected: URL-field-only issues (red badge with no issue = misinformation); origin as site-level storage (new store, badge/count mismatch).

D9. Severity = the catalogue's three levels (error/warning/notice), displayed as "Critical / Important / Improvement". Rubric: Critical — the page will not appear in or drops out of search; Important — it shows or ranks worse; Improvement — good practice. Rubric in README and in the report header. Within a level the report sorts by number of affected pages. Filter "hide improvements" (on by default). Why: the scale is already curated (archived change seo-check-catalogue-correction) and runs through the product; a computed priority would rest on simulated positions. Rejected: computed priority (weights × pages × simulated position — unexplainable and built on noise); new 4-level rubric (enum migration across seo_issues and site_checks, re-audit of a curated catalogue).

D10. Two codes per metric: CWV_{LCP,INP,CLS}_POOR (warning) and CWV_{LCP,INP,CLS}_NEEDS_IMPROVEMENT (notice), owner 'pageSpeed', each with min/max bounds. At most one code per metric per page; source does not change the level. Badge legend in UI (red badge = "Important" in report). Why: rubric D9 — "Critical" only for falling out of search; a slow site must not drown real noindex problems. Project rule (check.interface.ts): severity comes from the catalogue, never from the check — hence two static codes per metric rather than one code with dynamic severity.

D11. Own PSI client on RemoteApiCore: timeout 90 s, no in-call retries. Transient errors (5xx, timeout) → next_attempt_at = now + 1 min × 4^attempts (1/4/16/64 min), PAGE_SPEED_MAX_ATTEMPTS = 5, then failed. 429 → pause ALL worker slots for Retry-After (or 60 s), held in process memory. Permanent errors (PSI 400 FAILED_DOCUMENT_REQUEST / ERRORED_DOCUMENT_REQUEST etc.) → failed immediately with an error code. Invalid key (400/403 key errors) → log and stop the queue until restart; rows stay queued. 2 slots + a minimum interval between requests (in-process rate limiter). A failure never touches the stored measurement. Known limitation: the 429 pause is per process (single API process today, matches docker-compose). User-facing states: "Measuring…", "Measured <date>", "Couldn't refresh: <plain reason>, showing measurement from <date>", "Couldn't measure: <plain reason>". Why: no lost work, quota protected. Rejected: in-call retries only (thundering herd on 429, transient outage leaves pages failed until manual recrawl); pause in DB (extra table/query for a multi-process case that doesn't exist).

D12. Empty PAGESPEED_API_KEY: PSI worker does not start; crawl still enqueues rows (status queued) so adding a key + restart drains them. API exposes a "PageSpeed not configured" flag; UI shows it instead of empty badges. README explains how to get a key. .env.example: PAGESPEED_API_KEY= (empty). Env validated in envSchema (optional string), EnvKeys gains the key. Why: clean clone runs; absence of data is explained. Rejected: keyless calls (near-constant 429, indistinguishable from overload); key required at boot (breaks clean clone).

D13. Seed idempotently enqueues current-run pages that have no page_speed row; seed does not wait for measurements. Why: an old dev DB is fixed with one command, without a hidden second enqueue point in the worker. No data migration (migrations are never hand-written).

D14. Catalogue (contracts) gains plain: { what, why, fix } for ALL 65 entries (50 page checks + 9 site checks + 6 CWV): English, marketer voice, consequence in traffic/clicks terms, fix = what to do and whom to ask (CMS vs developer). label/hint/explanation/sources stay and are shown as "Technical details". Contracts test: all three fields non-empty, no '<' or '>', length bounds. Why: marketer voice without losing curated precision. Rejected: rewriting hint/explanation (undoes curated catalogue precision); FE-only dictionary (copy in two places, silent gaps).

D15. Failed site_checks of the client's current run (status succeeded/partial — same "current run" definition as the pages list CTE) are included in the report with location "Whole site". Must not read site checks from a failed run.

D16. The report is per single client, with a client selector. Why: brief wording "a client's pages"; origin collapsing only makes sense within one site.

D17. GET /api/clients/:clientId/issues → IClientIssueReport, one snapshot: client {id,name}, generatedFrom {runId, finishedAt}, pageSpeed {configured}, issues[]. Each issue: code, severity, details (typed by code), location as a discriminated union { kind:'page', page:{id,url,title} } | { kind:'site' } | { kind:'allPages', pageCount }. Origin CWV collapsed on the server. FE takes copy from the catalogue by code (contract carries no copy). Query scoped by scope.userId; another user's or missing client → 404. Filters and groupings are pure functions in the ViewModel; site and allPages rows are not lost under a page filter (ViewModel test). Why: ≤ ~200 rows (CRAWL_POST_LIMIT = 15 pages per client), one consistent snapshot, instant filters. Rejected: server-side filters + pagination (grouping across pages, many param combos for 200 rows); summary + details endpoints (two reads can diverge).

D18. Nav item "Issues" → /issues?clientId= (client in URL; default first client). Links: issue count in a pages-list row → /issues?clientId=X&pageId=Y; "View issues" on the Clients screen. Other user's / deleted client → "client not found" state.

D19. Default grouping "By issue": level → issue card (plain what/why/fix, "affects N pages", collapsible Technical details) → pages. Toggle "By page". Filters: level (Improvement hidden by default), type (SEO / Speed / Site), URL search. A collapsed origin row counts as N pages for sorting.

D20. (derived) Pages list: "Core Web Vitals" column next to Score: three badges LCP·INP·CLS (green/yellow/red/grey "no data"), tooltip = value, source ("this page" / "whole site" / "lab test, may vary"), measured date; "Measuring…"; "PageSpeed not configured" on the column header; legend. Page detail: block "Speed (Core Web Vitals, mobile)" with three cards (value, band, source, date) and failure state. ScoreExplainer: "speed is scored separately". IPageListItem and IPageDetail gain a pageSpeed summary (status, metrics with value/band/source, measuredAt, lastError plain code).

D21. (derived by the planner, from D4 and D12) The PageSpeed worker starts only in a process with `CRAWL_WORKER_ENABLED=true` and a non-empty key, and lives in a `PageSpeedModule` that only `AppModule` imports. Why: tests force that flag off to drive workers through `runOnce()` (`be/test/support/db-env.ts`), so a developer's real key in `.env` cannot start a loop under test; and the seed process, which imports `CrawlModule` and `PagesModule`, must not start a worker it exits under mid-call.

D22. (derived, from D1) PSI measures the page's `final_url`, not the sitemap URL. Why: field data is keyed by the URL visitors land on; measuring a URL that redirects measures the redirect.

D23. (derived, from D11/D12) The key travels in the `x-goog-api-key` request header, never in the query string. Why: `RemoteApiCore` and the transport put the request URL into error messages (`RemoteApiTimeoutError(url)`), and the URL is what fixtures and logs record — a key in the URL would reach `last_error`, the logs and the fixture files. VERIFY: PSI v5 accepts the header (Google APIs document it for API keys).

D24. (derived, from D3/D4) `page_speed` is owned by the pages module (table, queue repository, `ForWorker` services); the new `page-speed` module executes and owns no table. Why: it mirrors clients-owns-the-queue / crawl-executes, and the list and detail read the row in their own repositories without a cross-module service.

D25. (derived, from D11) A 429 or a rejected key returns the in-flight row to `queued` with `attempts − 1`, under the fence. Why: neither is the page's failure; spending attempts on them would fail every page during a quota outage. The fence still holds: the release is written by the attempt that owns the row, and a newer claim cannot be undone by it.

D26. (derived, from D2's "a field without a reader") `performance_score` is shown on the page-detail Speed block as a lab caption, never as a badge or an issue. Why: D3 stores it, and a stored column nobody reads is the defect D2 rejected.

D27. (2026-10-10, resolves O6; widens D12's flag and D17's `pageSpeed {configured}` — those lines stay as written) PageSpeed availability is `IPageSpeedAvailability { state: 'notConfigured' | 'active' | 'keyRejected' }`, carried by the pages list, the page detail and the issue report. `notConfigured` = no key in the API process; `active` = a key, and the worker has not halted; `keyRejected` = Google refused the key and the worker halted until restart (D11). The worker records the halt in an in-process `PageSpeedRuntimeState` (infrastructure, beside `PAGE_SPEED_SETTINGS`, so read paths see it without importing the worker's module — D21), and one function, `pageSpeedAvailabilityOf(settings, runtime)`, answers every read path. UI copy for `keyRejected`: "Google rejected the PageSpeed key — speed measurements are paused. See the README."; a row that would read "Measuring…" reads "Paused"; stored measurements stay visible. The README names the symptom and the cure (fix the key in `.env`, restart). Why: under a boolean the screen would say "Measuring…" indefinitely for a key Google refuses — exactly the unexplained absence D12 exists to prevent; the API process already knows, and it is one field. Rejected: keeping the boolean and relying on the log (a marketer never reads the log); storing the rejection in the database (the halt is per process and ends at restart, O1 — a stored flag would outlive the cause).

D28. (2026-10-10, resolves O7; settles the scope D9 left open) The severity names Critical / Important / Improvement replace Errors / Warnings / Notices everywhere severity is shown — the issue report, the page detail's SEO issues section, the pages list's issue badges, and the run log's site checks — from one `Record<TSeoIssueSeverity, { label; color }>` in `fe/src/Core/Constants/severityLabel.ts`, so a severity without a name does not compile. PAGEDETAIL-005 and SHELL-004 are modified to say so. Why: one scale under two sets of names on two screens reads as two scales. Rejected: the new names in the report only (a reader moving from a page to the report would meet "Warning" and "Important" for one level).

D29. (2026-10-10, added by the user after phases 1–5 closed) A Phase 6, "Verified against the live API", is added. It records real PageSpeed answers as fixtures, settles the VERIFY items, watches the docker stack drain against Google, exercises a rejected key against the real API, and records the measured cost and latency. The plan stays active until it closes; Phase 5's move of the plan to the archive is deferred to Phase 6 step 8. The phase is plan-only: no OpenSpec change is created and the archived changes are not reopened, because no requirement changes — only test inputs and measured facts do. Why: the brief requires a real PageSpeed call, and the success-path fixtures (`url-field`, `origin-only`, `lab-only`) were synthesized from Google's documentation for lack of a key (task 5.1 of `page-speed-measurement`). The behaviour is pinned, but against answers nobody has seen Google give. The user creates the key and puts it in `.env`; the session never asks for it or prints it.
