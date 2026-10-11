<!-- ARCHIVED. Present tense below describes what this plan intended, not what is true. -->

# ARCHIVE HEADER

**Status:** archived 2026-10-11. **Branch:** `feat/issue-report-and-pagespeed`, the branch the
user kept for the whole work. Phases 1, 3, 4, 5 and 6 executed; phase 2 dropped by D33. The
four changes are archived under `openspec/changes/archive/2026-10-11-*`. The body below was not
edited, apart from the decisions appended while the work ran (D38–D51), so it still reads as
the plan that was executed.

**Built, and where it is pinned.** Every phase was implemented test-first, in sub-phase order.
The final full run (at 4664d77, the last code commit) was lint and typecheck clean, with 794
contracts, 1380 backend, 446 frontend and 226 database/e2e tests. The stack was rebuilt and
migrated through `0018`, and every new check passed a live field audit at 0 wrong:
- markup checks: 56 sites, 256 posts;
- link checks: 32 sites, 99 firings;
- the image finding: 32 firings, each confirmed by a fresh PageSpeed answer.

Desktop field values matched Google's live answer exactly.

**Harvested into:**

| fact | now lives in |
| --- | --- |
| the inclusion bar, the rejected candidates with their reasons, `CANONICAL_CHANGED`'s drop, the step-asides, the markup audit tally | `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` |
| the four outbound checks, the link verdict rule (D3, D38), their audit tally, the image-delivery tally | the same document |
| the `outbound` stage, its budgets, robots per host, why no queue, its measured cost | `be/src/modules/crawl/CRAWL_MODULE.md` |
| a row per page and device, the three-step migration and its one hand edit, Lighthouse mobile-only, the claim order, desktop's measured cost, image delivery and why it is a pageSpeed code | `be/src/modules/page-speed/PAGE_SPEED_MODULE.md` |
| every join names its device; the detail carries both | `be/src/modules/pages/PAGES_MODULE.md` |
| only Core Web Vitals findings fold into a whole-site row | `be/src/modules/issue-report/ISSUE_REPORT_MODULE.md` |
| the decisions condensed, with their measurements | `docs/decisions.md` ("Closing the gap to Ahrefs' checks") |
| both devices, links checked, the score weighed by severity | `README.md` |
| ANALYSIS-014…021, 023…027, CRAWL-011…013, REMOTE-005, SPEED-015, SPEED-020 (new); SPEED-001/002/005/007/014, PAGES-014, SEED-006, PAGEDETAIL-011 (modified) | `openspec/specs/**`, deposited beside each owning document's invariants (REMOTE-005 in `practices/be/remote-api-core/SKILL.md`, PAGEDETAIL-011 in `fe/skills/AGENTS.md`) |

**Left open, for a person:**

1. **D37 was never confirmed by the user.** It was implemented in phase 1, with a spec, and is
   pinned. SITEMAP_LISTS_NON_INDEXABLE also reads CANONICAL_TO_HTTP and CANONICAL_TARGET_BROKEN
   findings, so the step-asides lose no sitemap entry.
2. **O1, O6 and O7 stay open with their defaults.** O1: TITLE_YEAR_OUTDATED never fired in the
   audit, so its patterns were never contradicted. O6: react.dev reached the outbound deadline
   with one link unchecked; whether its external robots.txt fetches caused it was not
   separated. O7: RDFa breadcrumbs.
3. **`lighthouse-checks`**, another plan's change, is merged here but not archived by this plan.
4. ANALYSIS-022 and PAGES-015 were allocated to the dropped `CANONICAL_CHANGED` work and are
   never to be reused.

---

# Closing the gap to Ahrefs' checks without losing precision

Our check catalogue now covers what Ahrefs' blog tells a site owner to fix, and every new finding
is held to the same standard as the old ones. When a marketer opens a page, it says whether the
page's canonical points to plain HTTP or to a URL that redirects, is broken, is noindexed or is
itself canonicalised elsewhere. It says whether og:url names another URL, and whether the hreflang set leaves out this page or is not
returned by the pages it names. It also reports a title still selling last year, a description
that only repeats the title, missing breadcrumb markup, and links in the text that are broken or
redirect. A link the crawl could not check is never presented as fine. Per site it says how many
posts show their text only after JavaScript runs. In the Speed block a marketer can switch
between mobile and desktop Core Web Vitals. Lighthouse's image-delivery audit becomes a finding
when it can save at least 100 KiB. An industry-only recommendation never ranks above an
Improvement, and every new check stays only if each firing in a live field audit is correct.
No new check reports a fact an existing check already reports: where two meet on one fact, the
more specific one keeps it and the other steps aside (D32–D36).

**Status:** archived — see the header above — branch `feat/issue-report-and-pagespeed` (the user's instruction: the work
stays on the current branch; no new branch). Phases 1 and 3 are closed: at `adc8887` every task of
`markup-gap-checks` and `crawl-outbound-checks` is ticked except 7.2 in each, which is the
archive-and-deposit step and belongs to phase 6. Phases 4 and 5 have not started. They were
re-derived on 2026-10-11 against the tree at `adc8887`, after `feat/lighthouse-checks` was merged
in (D39–D50), and their two changes were regenerated from §15.

**Changes:** markup-gap-checks, crawl-outbound-checks, desktop-core-web-vitals, image-delivery-finding

(`canonical-change-tracking` was dropped by D33. Its directory is removed with
`git rm -r openspec/changes/canonical-change-tracking`. The requirement ids it had allocated,
PAGES-015 and ANALYSIS-022, are not reused.)

The change `lighthouse-checks` is not this plan's, but phases 4 and 5 are built on it: it moved
the catalogue into a registry of owners, added the Lighthouse columns to `page_speed` and made
Lighthouse's verdicts part of the score. Its design D16 decides that Lighthouse's SEO and
accessibility audits are mobile-only, which phase 4 applies (D42). Its tasks are all ticked, but
it is not archived yet, so its requirements (SPEED-016…019, PAGES-016/017, PAGEDETAIL-013,
REPORT-005) still live under `openspec/changes/lighthouse-checks/`. SPEED-016 already says a
desktop request asks for performance only; phase 4c is what makes that scenario true, and pins it.

## How to read this

The present tense describes the intended state, not the current one. Names marked **new** do not
exist yet. Every other path, symbol and script was read in the tree on 2026-10-11 while this was
written. Anything not verified is marked `VERIFY:` and is not a claim. §1–§12 are the
specification. §13–§14 say what pins it. §15 is the sequence. Each change's `tasks.md` is
**generated from §15**. Correct it through this document, never beside it. The requirement-id
convention, the delta heading form, the harvest rule and the task vocabulary belong to
`openspec/README.md` and `openspec/config.yaml` and are not repeated here.

The decision log (§20) holds D1–D13 verbatim from the plan-interview. D14–D30 are consequences
the planner derived while checking the decisions against the tree. Each is marked "derived" and
names the decision and the file it follows from. The user confirmed D14–D29 as written on
2026-10-11 (D31). The "to be confirmed" marks on those lines stay, because the log is
append-only, and D31 supersedes them. Several of them exist because the tree already does part
of what a decision asked for (D14, D15). D32–D36 are the user's decisions of 2026-10-11 that no
new check may duplicate an existing one; they supersede D7, D27 and O4 and drop phase 2. D37 is
a planner-derived consequence of D32 and D34 and is **not confirmed by the user**. D38 is the
phase-3 field audit's outcome. D39–D50 are consequences the planner derived on 2026-10-11 when
the tree moved under phases 4 and 5 (the merged `lighthouse-checks`, migration `0015`, the fair
claim, the requirement id SPEED-014 taken by that claim). The user confirmed D39–D50 as written
on 2026-10-11 (D51); their "not confirmed" marks stay because the log is append-only.
Where one replaces part of an earlier section, the earlier text was rewritten and the D-line
names what it supersedes. The paths of phases 4 and 5 were read in the tree at commit `adc8887`.

---

## 1. User-visible behaviour

### 1.1 Page detail (`/pages/:pageId`) — SEO issues

New findings appear in the existing **SEO issues** section, each with its plain what / why / fix,
its level and its sentence. Severity names follow SHELL-004 (Critical / Important / Improvement).

| Finding (code) | Level | The sentence a reader sees (example) |
| --- | --- | --- |
| `CANONICAL_TO_HTTP` | Important | "The canonical names http://a.example/post/, this page's own address over plain HTTP." |
| `OG_URL_MISMATCH` | Improvement | "og:url names https://a.example/other/; the page's canonical is https://a.example/post/." |
| `HREFLANG_NO_SELF_REFERENCE` | Improvement | "None of the 3 hreflang alternates names this page." |
| `TITLE_YEAR_OUTDATED` | Improvement | "The title says 2024; it is 2026." |
| `META_DESCRIPTION_REPEATS_TITLE` | Improvement | "The meta description repeats the title word for word." |
| `BREADCRUMB_MISSING` | Improvement | "The page declares no BreadcrumbList." |
| `CANONICAL_TARGET_BROKEN` | Important | "The canonical https://a.example/old/ redirects (301) to https://a.example/new/." |
| `BROKEN_LINKS` | Improvement | "2 links in the text are broken. Checked 38 of 40 links." |
| `LINKS_TO_REDIRECTS` | Improvement | "3 links to this site's pages redirect." |
| `HREFLANG_NOT_RECIPROCAL` | Important | "https://a.example/fr/post/ does not link back to this page with hreflang." |
| `CWV_*_DESKTOP` (six) | as mobile | "LCP on desktop is 2.9 s for this page's real visitors; good is 2.5 s or less." |
| `IMAGE_DELIVERY_INEFFICIENT` | Improvement | "Images could be about 240 KiB smaller (Lighthouse, mobile); 4 images listed." |

Each finding quotes its evidence under **Technical details**, as every finding does today
(PAGE_ANALYSIS_MODULE "Every finding shows its proof"). A finding that rests on a sample says so.
The link findings carry "Checked N of M links" whenever N < M. The text names why the rest went
unchecked: the crawl's link budget, robots.txt, or no conclusive answer.

A fact is reported once (§10.13). A page whose canonical is its own http:// twin shows
`CANONICAL_TO_HTTP` and not `CANONICAL_MISMATCH`. A page whose canonical target is broken
shows `CANONICAL_TARGET_BROKEN` and not `CANONICAL_MISMATCH`. Links to a development host are
`DEVELOPMENT_HOST_REFERENCES`'s and are never counted as broken or redirecting. On the
**Checks** list the check that stepped aside reads "not applicable", with its skip reason
naming the check that reports the fact.

**Checks** (ChecksSection) lists each new crawl-owned code with its four-status outcome
(PAGES-012). A page last crawled before a code existed reads "not yet checked" for it until its next
crawl. The score's denominator grows by the new codes that apply. The score formula is unchanged.

### 1.2 Page detail — Speed block

The block's title changes from **Speed (Core Web Vitals, mobile)** to **Speed (Core Web
Vitals)**. A two-option switch, **Mobile | Desktop**, sits beside it and opens on Mobile. Each
option shows that strategy's measurement exactly as the mobile block shows it today
(PAGEDETAIL-011, PAGEDETAIL-013):

- the three cards, each with its share-of-visits bar where the value comes from real visitors;
- the time-to-first-byte line;
- the LCP breakdown, labelled as a lab figure;
- the lab performance score caption.

The Lighthouse SEO and accessibility score captions appear on **Mobile only**. A desktop
measurement asks Google for the performance category alone, so it has none (D42).

The states, per strategy, are the ones the mobile block has today: In queue for measurement
(clients take turns), Measuring…, Couldn't refresh, Couldn't measure, Not measured, and PageSpeed
not configured or key rejected. Each option reads its own row's status, so Mobile can read
"Measuring…" while Desktop reads "In queue". The key-rejected notice stands above both options.
For a page crawled before this work, Desktop reads "Not measured on desktop yet: this page was
crawled before desktop measurement existed. The next crawl or seed run queues it." (D13, D20,
D49). Switching requests nothing.

The checks section's Lighthouse column and the score explanation keep reading the mobile
measurement, whichever option the Speed block shows (D49).

### 1.3 Pages list (`/pages`)

Nothing changes on screen. The Core Web Vitals badges stay mobile, and the legend already says so
(`PagesTable.tsx:191`). The score and the list's order keep Lighthouse's share from the mobile
measurement only (D43). The SEO issues count now includes the new findings, desktop speed findings
and the image-delivery finding (PAGES-013).

### 1.4 Issues (`/issues`)

New codes appear under their level. Desktop CWV codes and `IMAGE_DELIVERY_INEFFICIENT` are
type **Speed** (`issueTypeOf` reads `PAGE_SPEED_ISSUE_CODES`). Their labels name the device: the
six mobile labels gain "on mobile" and the desktop labels end "on desktop" (D48). A desktop CWV
finding from the site's data is folded into one whole-site row per code, as a mobile one is.
`IMAGE_DELIVERY_INEFFICIENT` is a lab estimate about one page's images, so it is always shown at
its page (D47).
`CONTENT_NEEDS_JAVASCRIPT` is type **Site**, located "Whole site". The `active` PageSpeed line
changes from "Speed figures are Google's mobile measurements…" (`IssuesScreen.tsx:141`) to "Speed
figures are Google's mobile and desktop measurements; pages are re-measured at most once a day."

### 1.5 Clients → run log (site checks)

The run log's site checks gain **Posts render their content with JavaScript**: "3 of 18 posts the
crawl read render their content with JavaScript", with the URLs as evidence. The posts stay
skipped in the item log, with today's reason "Rendered by JavaScript: …" (D8).

---

## 2. Principles

- **P1 — Each firing must be correct, not just plausible.** A check ships only after every live
  firing has been read and judged correct (D12). *Consequence:* each phase that adds a check ends
  with a field-audit tally. A check with one wrong firing is reworked or retired with
  `enabled: false`.
- **P2 — The source sets the level.** First-party guidance may set any severity. An industry-only
  recommendation is at most a notice (D1). *Consequence:* the rule is a test over the catalogue's
  sources (D24), not a reviewer's memory.
- **P3 — One fact, one finding.** A fact already reported under one code is not reported again
  under a new one. Where two checks meet on one fact, the more specific keeps it and the other
  steps aside (answers "not applicable"), the repository's rule (`PAGE_ANALYSIS_MODULE.md:349-354`,
  PREVIEW_IMAGE_IS_LOGO over PREVIEW_IMAGE_TOO_SMALL). *Consequence:*
  - the self-reference arm leaves `HREFLANG_INVALID` (D14);
  - `CANONICAL_MISMATCH` steps aside for `CANONICAL_TO_HTTP` (D32) and for
    `CANONICAL_TARGET_BROKEN` (D34);
  - `CANONICAL_CHANGED` is dropped, because every state it could report is already reported
    (D33);
  - the outbound checks skip what `DEVELOPMENT_HOST_REFERENCES`, `INTERNAL_LINK_VARIANTS` and
    `HREFLANG_INVALID` report (D29, D36);
  - the sitemap/canonical extension is already built (D15) and keeps naming canonical
    contradictions whichever canonical check carries them (D37);
  - every step-aside has a spec case named for the check it defers to (§10.13).
- **P4 — What was not checked is said.** No finding and no pass implies a link, an alternate or a
  target the crawl did not check (D6). *Consequence:* outcomes are raw facts with an explicit
  `unchecked` kind. A page whose links could not be checked is "not applicable", never "passed".
- **P5 — Checks stay pure.** Every request happens in the crawl before the transaction, and the
  checks read the facts as input (D4). *Consequence:* the network reaches checks only through
  `ICheckInput`. An ESLint rule keeps `services/checks/**` and `services/site-checks/**` from
  importing the HTTP client (D28).
- **P6 — A bound is a constant with its reason.** Every budget, threshold and status list lives
  in one `*.constant.ts` or catalogue entry. The prose that explains it is tied to it by a test
  (D25). *Consequence:* nobody can quietly add 403 to the external-broken rule.
- **P7 — One row, one answer.** A `page_speed` row is one page's measurement on one device (D9).
  *Consequence:* the key is `(page_id, strategy)`. Every reader that joins the table names the
  strategy it wants, or it multiplies rows.
- **P8 — Absence is not a measurement error.** An audit missing from a PageSpeed answer means no
  data (D10). *Consequence:* the image-delivery extractor cannot turn a good CWV answer into
  `NO_MEASUREMENT`.
- **P9 — Lighthouse speaks for mobile only.** Its SEO and accessibility verdicts come from the
  view Google indexes (lighthouse-checks D16, D42). *Consequence:* a desktop request asks for
  performance alone. A desktop row cannot hold a verdict (a CHECK refuses it), and a desktop
  measurement never touches the page's Lighthouse findings. Every read that feeds the score names
  the mobile row.

---

## 3. Data model

One table changes: `page_speed`. No table is added. `seo_issues.code` and `site_checks.code`
are `varchar(64)`, so the new codes need no migration.

### 3.1 `pages` — unchanged (D33)

The `pages.canonical_url` / `canonical_recorded` columns that D7 introduced are not built.
`CANONICAL_CHANGED`, their only reader, was dropped (D33), and a column nobody reads is the
defect D2 of the prior plan rejected. `pages.schema.ts` and its comment at `:52-55` stay as
they are.

### 3.2 `page_speed` — one row per page and strategy (two generated migrations, `0016` and `0017` as the tree stands at `adc8887`)

**The table today** (`be/src/persistence/schema/tables/page-speed/page-speed.schema.ts`, after
`0014_third_maverick.sql` and `0015_modern_wrecker.sql`):

- `page_id` is the primary key. Postgres named the constraint `page_speed_pkey`, because 0014
  declared it inline.
- The job columns: `status`, `attempts`, `next_attempt_at`, `locked_until`, `last_error`.
- The measurement: `lcp_*`, `inp_*`, `cls*`, `performance_score`, `measured_at`.
- From 0015 (lighthouse-checks):
  - Lighthouse's record: `lighthouse_judged`, `lighthouse_not_applicable`, `lighthouse_failed`,
    `seo_score`, `accessibility_score`;
  - `ttfb_ms` and `ttfb_source`;
  - the eight `*_good_share` / `*_poor_share` columns;
  - `lcp_breakdown_json`.
- The partial index `page_speed_claim_idx` on `next_attempt_at`.
- Nineteen CHECKs: the eight of 0014 and the eleven of 0015.

**What changes:**

```ts
// packages/contracts/src/domain/page-speed/psi-strategy.enum.ts — new
/**
 * The device PageSpeed Insights emulates; its query parameter `strategy`. The order is the
 * Postgres enum's order, and the claim takes a client's mobile rows first by it (D44).
 */
export const PSI_STRATEGIES = ['mobile', 'desktop'] as const;
export type TPsiStrategy = (typeof PSI_STRATEGIES)[number];

// be/src/persistence/schema/tables/page-speed/page-speed.schema.ts — changed
// Exported from this file: drizzle-kit only emits CREATE TYPE for enums it finds here.
export const psiStrategyEnum = pgEnum('psi_strategy_enum', PSI_STRATEGIES);

/**
 * One row per page AND device: its PageSpeed queue entry and the cache of its last
 * successful measurement on that device. …(the rest of today's comment)…
 */
export const pageSpeed = pgTable(
  'page_speed',
  {
    // No longer the key alone: page and device together are one question (D9).
    pageId: bigint('page_id', { mode: 'number' })
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    // The device the answer is for. NOT NULL with no default once 0017 runs: an insert that
    // forgets it is refused rather than silently queued as mobile, where the desktop row
    // would never appear (D22). 0016 is generated with `.default('mobile')`, which fills
    // every existing row — they were all mobile answers (D9).
    strategy: psiStrategyEnum('strategy').notNull(),
    // …every other column unchanged, the 0015 columns included…
  },
  (t) => [
    // A second row for one page and device would be a second answer to one question.
    // Named as the repository names composite keys (rank_snapshots_pk, page_keywords_pk).
    primaryKey({ name: 'page_speed_pk', columns: [t.pageId, t.strategy] }),
    // …page_speed_claim_idx and the nineteen CHECKs unchanged…
    // Lighthouse's SEO and accessibility verdicts are taken from mobile alone
    // (lighthouse-checks D16): the desktop request asks for performance only, so a desktop
    // row with a verdict or a category score is a writer's bug, refused here (D42).
    check(
      'page_speed_lighthouse_mobile_only',
      sql`${t.strategy} = 'mobile' or (
        ${t.lighthouseJudged} is null and ${t.lighthouseNotApplicable} is null
        and ${t.lighthouseFailed} is null
        and ${t.seoScore} is null and ${t.accessibilityScore} is null)`,
    ),
  ],
);
```

**What each new piece means.**

- `strategy`: which device the row's job and measurement are for. It is never null; there is no
  "unknown device".
- The composite key: at most one row per page and device. The cascade still removes both rows
  with their page (I16).
- `page_speed_lighthouse_mobile_only`: on a desktop row every Lighthouse column is null. Null
  there means "not asked", not "not measured yet". On a mobile row the columns keep 0015's
  meaning: all null means the answer had no such categories.
- TTFB, the shares and the breakdown are untouched. They are per row, so a desktop row stores
  its own (D42).

The two-step generation (D22, D41). drizzle-kit numbers the files; with `0015_modern_wrecker.sql`
the latest at `adc8887`, they are `0016` and `0017`. If another migration lands first, the numbers
move and nothing else does:

1. **`0016`.** The schema declares:
   - `strategy … .notNull().default('mobile')`;
   - the composite key;
   - the new CHECK.

   `pnpm db:generate` writes the migration. Read the SQL. It must hold, and hold nothing else:
   - `CREATE TYPE "public"."psi_strategy_enum"`;
   - `ADD COLUMN "strategy" … DEFAULT 'mobile' NOT NULL`;
   - the drop of `page_speed_pkey`;
   - `ADD CONSTRAINT "page_speed_pk" PRIMARY KEY("page_id","strategy")`;
   - `ADD CONSTRAINT "page_speed_lighthouse_mobile_only"`.

   The CHECK holds on every existing row, because every existing row becomes `mobile`. Postgres
   validates a new CHECK against the existing rows when it is added, so a row that broke it would
   fail the migration rather than slip in.
2. **`0017`.** The schema drops `.default('mobile')` and `pnpm db:generate` writes the second
   migration. Read the SQL. It must hold exactly `ALTER COLUMN "strategy" DROP DEFAULT`.

VERIFY: two things about drizzle-kit 0.31:

- that it generates the change from an inline primary key to a named composite one on an
  existing table without an interactive prompt;
- that it drops the old constraint under its Postgres name `page_speed_pkey`.

If it prompts or names the dropped constraint differently, follow its prompt to keep the
generation honest, and record what it did as an `AMENDED` line on task 2.2 of
`desktop-core-web-vitals`. Never hand-edit the SQL or `drizzle/meta/_journal.json`.

`page_speed_claim_idx` (on `next_attempt_at`, `where status in ('queued','running')`) is
untouched: it still serves the claim's `due` filter, and the new ORDER BY keys (§10.14) sort a
handful of due rows. The nineteen CHECKs are untouched. Every CHECK is per row, and a row is
still one whole measurement.

---

## 4. Invariants and their enforcement

| # | Invariant | Mechanism |
| --- | --- | --- |
| I1 | A catalogue entry whose every source is an industry source has severity notice | `inclusionBarViolations(catalogue)` (contracts, reads `INDUSTRY_SOURCE_HOSTS`) returns the offenders; a contracts test asserts `[]` over the flattened issue catalogue (every owner) and the site catalogue (D24) |
| I2 | Every new crawl code has exactly one check, and no pageSpeed code has one | `TCheckRegistry = { [K in TCrawlIssueCode]: TCheck<K> }` (existing, `checks.registry.ts:85`) |
| I3 | Every new code, page or speed, has its sentence on the frontend | `DESCRIBE: Record<Exclude<TSeoIssueCode, TLighthouseIssueCode>, …>` (existing, `describeIssue.ts:50-53`; Lighthouse codes share one sentence) — a missing key does not compile |
| I4 | A page whose hreflang set omits itself is reported once, under `HREFLANG_NO_SELF_REFERENCE`, never also under `HREFLANG_INVALID` | `HREFLANG_INVALID` no longer computes `selfReferenced`; two specs assert each side (D14) |
| I5 | A post skipped as client-rendered stays a skipped item and never becomes a page; the site check reads a flag, never the reason text | `ISelectedItem.clientRendered: boolean` and `IFetchedEntry.clientRendered: boolean` (new, required); the skip path in `post-selection.service.ts:186-194` is unchanged apart from setting it |
| I6 | A canonical that is the page's own http:// twin is `CANONICAL_TO_HTTP`'s alone; an http canonical naming any other address is `CANONICAL_MISMATCH`'s alone | one predicate, `isHttpTwin(canonical, finalUrl)` (`_shared/http-twin.ts`), read by both checks. `CANONICAL_TO_HTTP` is not applicable unless it holds, and `CANONICAL_MISMATCH` is not applicable when it does (D32) |
| I7 | When a page's canonical target is broken, `CANONICAL_MISMATCH` steps aside for `CANONICAL_TARGET_BROKEN` | one predicate, `canonicalTargetProblemOf(page)` (new, `_shared/canonical-target.ts`), read by both checks. `CANONICAL_MISMATCH` reads `linkStatuses` for it from phase 3 on (D34) |
| I8 | Every outbound request of a crawl happens before its transaction | the new `outbound` stage is not `opensTransaction`; `assertRunPipeline` (existing, `run-pipeline.ts:31`) refuses any other order |
| I9 | One crawl checks at most 300 link URLs and reads at most 30 HTML documents. At most 8 requests are in flight, at most 2 per host. Each request has 5 s, no retry and at most 5 redirect hops. The stage stops at 60 s | `OUTBOUND_CHECK_LIMITS` (new, `crawl/constants/outbound-checks.constant.ts`) is read by `OutboundChecksService`, and its spec drives each bound with a fake transport and a fake clock |
| I10 | No URL is requested that its host's robots.txt disallows; each host's robots.txt is fetched at most once per crawl | `HostRobotsCache` (new) is keyed by origin. The run's own origin is answered by the run's `RobotsPolicy`, never re-fetched |
| I11 | A link, alternate or target that was not checked is never reported broken, never counted as fine, and the finding names how many were checked | `TOutboundOutcome` has an `unchecked` kind; `linkVerdictOf` maps it to `unknown`; the checks build "Checked N of M" from it |
| I12 | An external link is broken only on 404, 410 or a nonexistent domain | `EXTERNAL_BROKEN_STATUSES = [404, 410]` and the `nxdomain` failure kind, read by `linkVerdictOf`. A test ties the constant to the `BROKEN_LINKS` explanation (D25) |
| I13 | No check performs I/O | ESLint `@typescript-eslint/no-restricted-imports` over `src/modules/page-analysis/services/{checks,site-checks}/**` bans `@infrastructure/remote-api/**` and `@modules/crawl/**` (D28) |
| I14 | A status-only request reads no body and frees its connection | `SiteHttpClient.checkLink` asks with `maxBytes: 0, overflow: 'truncate'`; `readCapped` destroys the stream at the first chunk (`undici-http-transport.ts:101-107`) |
| I15 | Outbound checking never fails, delays past its deadline, or changes the outcome of a run | `OutboundChecksService` turns every `RemoteApiError` into an outcome per URL, as `SiteProbeService.ask` does. The stage deadline is an `AbortSignal.any([run, timeout])` |
| I16 | At most one `page_speed` row per page and strategy, gone with its page | PK `(page_id, strategy)`; FK `ON DELETE cascade` |
| I17 | A `page_speed` row cannot be inserted without a strategy | `strategy` NOT NULL with no default after the second migration of §3.2 |
| I18 | A measurement replaces only its own strategy's speed findings | `replacePageSpeedFindingsForWorker(tx, pageId, strategy, rows)` deletes `code in PAGE_SPEED_CODES_BY_STRATEGY[strategy]`; its rows are typed `TPageSpeedSeoIssueOf<S>`, so a mobile code passed for desktop does not compile |
| I19 | Every pageSpeed code declares exactly one strategy; no crawl or Lighthouse code declares one | `IPageSpeedIssueDefinition` gains a required `strategy: TPsiStrategy`; `ICrawlIssueDefinition` and `ILighthouseIssueDefinition` have no such field, so `as const satisfies Record<string, …>` refuses it as an excess property (typecheck, D39). `TPageSpeedIssueCodeOf<S>` and `PAGE_SPEED_CODES_BY_STRATEGY` are derived from the entries |
| I20 | Badge ⇔ issue holds per strategy: a metric outside the good band yields exactly its strategy's one code | `cwvIssuesOf(strategy, measurement)` reads `CWV_ISSUE_CODES[strategy][metric][band]`, whose type requires each leaf to be a `TPageSpeedIssueCodeOf<strategy>`; the band comes from `cwvBandOf` (existing) |
| I21 | `IMAGE_DELIVERY_INEFFICIENT` comes only from a mobile answer, and an answer without the audit is a CWV measurement with no image finding, never an error | the entry declares `strategy: 'mobile'`, so the code is a `TPageSpeedIssueCodeOf<'mobile'>`; `speedIssuesOf<S>(…)` returns `TPageSpeedSeoIssueOf<S>[]` and its desktop arm takes no image input, so a desktop result holding the code does not compile (typecheck). `extractImageDelivery` returns `null` on absence through its own zod schema; `classifyPsiResponse` calls it beside `extractMeasurement`, `extractDiagnostics` and `extractLighthouse`, and `measured` never depends on it (D46) |
| I22 | No read multiplies a page by its strategies, and the score never reads a desktop row | the list's `left join page_speed ps on ps.page_id = p.id and ps.strategy = 'mobile'`, which `LIGHTHOUSE_SCORE_POINTS_LATERAL` and the ORDER BY read through `ps`; the detail joins `ps` the same way (Lighthouse lists, points, score, mobile summary) and, from 4d, `psd … and psd.strategy = 'desktop'` (desktop summary only); the report joins the strategy of `i.code`; the claim's CTEs join on `(page_id, strategy)` (D43) |
| I23 | A check stays enabled only while every live firing in its field audit is correct | **not pinned by a test** — a reader judges each firing against the live page (D12). The tally is recorded in `PAGE_ANALYSIS_MODULE.md`, and the phase does not close without it |
| I24 | Every query over a user's data stays scoped to that user | no new route; `findPreviousCrawlsForWorker` stays client-scoped (`pages.repository.ts:98-112`); the isolation matrix is unchanged (ISO-005) |
| I25 | No new check reports a fact an older check reports: a development host is `DEVELOPMENT_HOST_REFERENCES`'s, an invalid hreflang code and a canonical naming another URL on an hreflang page are `HREFLANG_INVALID`'s, an http-twin canonical is `CANONICAL_TO_HTTP`'s | each new check reads the older check's own predicate: `isDevelopmentHost` for og:url, canonical targets and alternates, and `isOwnDevelopmentHost` for content links, exactly as `development-host-references.check.ts:35-43` splits them; the hreflang code validator moved to `_shared/hreflang-code.ts`; `isHttpTwin`. The new check then answers not applicable or skips the item. One spec case per deference, named for the older check (§10.13, D36) |
| I26 | A sitemap entry whose page names another canonical is named by `SITEMAP_LISTS_NON_INDEXABLE` whichever canonical check carries the fact | `contradictionOf` (`sitemap-checks.ts:29-49`) reads `CANONICAL_MISMATCH`, `CANONICAL_TO_HTTP` and `CANONICAL_TARGET_BROKEN` findings (D37) |
| I27 | A desktop row never holds a Lighthouse record, and a desktop measurement never touches the page's Lighthouse findings | CHECK `page_speed_lighthouse_mobile_only` (§3.2). `TPageSpeedCompletion` is a union on `strategy`: its desktop arm types the five Lighthouse fields as `null` and has no Lighthouse findings, and `PageSpeedResultsService.completeForWorker` calls `replaceLighthouseFindingsForWorker` only in the mobile arm (D42) |
| I28 | A claim takes, and an outcome fences, exactly one row | the claim's `next` returns `(page_id, strategy)` and the UPDATE matches both columns; `ownedBy(pageId, strategy, attempt)` on every completion, failure and release (D44) |
| I29 | A user or client is served by a claim of any of its rows, whatever the device; within one client, mobile rows go first | the `served` CTE groups by user and client with no strategy; the ORDER BY puts `d.strategy` after the two served-at keys and before `next_attempt_at`, relying on the enum's declaration order (`PSI_STRATEGIES`) (D44, O9) |
| I30 | Until the worker can ask for desktop, no desktop row is queued | `PAGE_SPEED_QUEUED_STRATEGIES = ['mobile'] as const satisfies readonly TPsiStrategy[]` (4b only, in `be/src/shared/page-speed-queue/page-speed-queue.constant.ts`), which `PageSpeedQueueService` passes to the repository's `enqueueForWorker` and `backfillCurrentForWorker`. The repository takes the strategies as an argument and has no default. 4c deletes the constant and the service passes `PSI_STRATEGIES` (D45) |
| I31 | `IMAGE_DELIVERY_INEFFICIENT` is never folded into a whole-site report row | the report's `allPages` row is typed `TCwvSeoIssue & { location: IAllPagesLocation }` (contracts), and `collapseOriginFindings` folds through `isCwv`, a guard over `TCwvIssueCode`. An image-delivery whole-site row does not compile, and its details have no `source` to read (D47) |
| I32 | `IMAGE_DELIVERY_INEFFICIENT` never moves the score and is never listed as a check | it sits in the `pageSpeed` owner, whose registry entry is `scored: false`, so `SCORED_ISSUE_OWNERS` and `composePageChecks` never reach it; the score laterals count only codes in `checks_judged` / `lighthouse_judged`, which no writer puts it in (D50) |

---

## 5. Wire contract (`@app/contracts`)

**New**, each listed in `packages/contracts/src/index.ts`:

```ts
// seo/industry-source-hosts.constant.ts — new (D24)
/** Hosts whose guidance is an industry opinion, not a first-party statement (D1). */
export const INDUSTRY_SOURCE_HOSTS = ['ahrefs.com', 'vercel.com'] as const;

// seo/inclusion-bar/inclusion-bar.util.ts — built in phase 1, tested beside it
/** Codes above notice whose every source sits on an `INDUSTRY_SOURCE_HOSTS` host. */
export const inclusionBarViolations = (
  catalogue: Readonly<Record<string, { severity: TSeoIssueSeverity; sources: readonly ISeoIssueSource[] }>>,
): string[] => …;

// page-speed/psi-strategy.enum.ts — new in 4a (§3.2)

// page-speed/image-delivery-measurement.interface.ts — new in 5b (D23)
export interface IImageDeliveryMeasurement extends ISeoMeasurement {
  /** Total savings Lighthouse estimates, in bytes; `min` is the catalogue's 102 400. */
  value: number;
  /** Up to 10, largest saving first. */
  images: { url: string; savingsBytes: number }[];
}
```

**Changed — the catalogue registry** (`seo/catalogue/`, D39). The registry
(`issue-catalogues.constant.ts`, `ISSUE_CATALOGUES = { crawl, pageSpeed, lighthouse }`, each
`{ scored, entries }`) is unchanged: no owner is added, and an entry still does not name its
owner.

- `catalogue/issue-definition.interface.ts`: `IPageSpeedIssueDefinition` stops being an alias of
  `ISeoIssueDefinition` and declares the device its finding is about:

  ```ts
  /**
   * A finding the PageSpeed worker writes from one device's answer. `strategy` is required:
   * the worker's replace deletes one strategy's codes, so a code with no strategy would be
   * deleted by neither replace — or, written as a default, by the wrong one (D39).
   */
  export interface IPageSpeedIssueDefinition extends ISeoIssueDefinition {
    strategy: TPsiStrategy;
  }
  ```

  `ICrawlIssueDefinition` and `ILighthouseIssueDefinition` have no `strategy`, so an entry of
  theirs that declares one is an excess property under the catalogue's `as const satisfies`.
- `catalogue/page-speed/page-speed-catalogue.constant.ts`:
  - 4a: `strategy: 'mobile'` on the six CWV entries, whose labels gain "on mobile" (D48); six
    `CWV_{LCP,INP,CLS}_{NEEDS_IMPROVEMENT,POOR}_DESKTOP` entries with `strategy: 'desktop'`, the
    severity and `max` of their mobile twin, labels ending "on desktop", `plain` copy about
    computers rather than phones, and the twin's sources;
  - 5b: `IMAGE_DELIVERY_INEFFICIENT` with `strategy: 'mobile'`, severity notice,
    `min: 102_400` and a Lighthouse source (D10, D50).
- `catalogue/issue-catalogues.constant.ts`, derived beside `PAGE_SPEED_ISSUE_CODES`, so neither
  can drift from the entries:
  - `TPageSpeedIssueCodeOf<S extends TPsiStrategy>`: the pageSpeed codes whose entry declares
    `strategy: S`;
  - `PAGE_SPEED_CODES_BY_STRATEGY: { [S in TPsiStrategy]: TPageSpeedIssueCodeOf<S>[] }`, filtered
    from `PAGE_SPEED_CATALOGUE` by `strategy`.
- `page-speed/cwv-issue-codes.constant.ts`: `CWV_ISSUE_CODES` becomes
  `{ [S in TPsiStrategy]: Record<TCwvMetric, Record<'needsImprovement' | 'poor', TPageSpeedIssueCodeOf<S>>> }`.
  `TCwvIssueCode` (new) is the union of its leaves, so image delivery is a pageSpeed code and not
  a CWV code.
- `seo/seo-issue.interface.ts`:
  - `TIssueDetails<K>` maps a `TCwvIssueCode` to `ICwvMeasurement` and, from 5b,
    `IMAGE_DELIVERY_INEFFICIENT` to `IImageDeliveryMeasurement`;
  - new `TCwvSeoIssue = TIssueOver<TCwvIssueCode>` and
    `TPageSpeedSeoIssueOf<S> = TIssueOver<TPageSpeedIssueCodeOf<S>>`.
- `issue-report/client-issue-report.interface.ts` (5b): the `allPages` arm of `TReportIssue`
  narrows from `TPageSpeedSeoIssue` to `TCwvSeoIssue` (D47, I31).
- `pages/page-detail.interface.ts` (4d): `pageSpeed: IPageSpeedSummary | null` is replaced by
  `pageSpeedByStrategy: Record<TPsiStrategy, IPageSpeedSummary | null>` (D21).
  `IPageListItem.pageSpeed` keeps its type and its comment gains "mobile".

**Changed in phases 1 and 3 (closed), recorded for the harvest:** ten crawl entries in
`catalogue/crawl/crawl-catalogue.constant.ts` (`CANONICAL_TO_HTTP`, `OG_URL_MISMATCH`,
`HREFLANG_NO_SELF_REFERENCE`, `TITLE_YEAR_OUTDATED`, `META_DESCRIPTION_REPEATS_TITLE`,
`BREADCRUMB_MISSING`, `CANONICAL_TARGET_BROKEN`, `BROKEN_LINKS`, `LINKS_TO_REDIRECTS`,
`HREFLANG_NOT_RECIPROCAL`; not `CANONICAL_CHANGED`, D33); `CANONICAL_MISMATCH`'s widened
`skipReason` (D32, D34); `HREFLANG_INVALID`'s copy without the self-reference clause (D14);
`CONTENT_NEEDS_JAVASCRIPT` in `site/site-check-catalogue.constant.ts`.

**What must ship together.**

- A new code, its writer, its `DESCRIBE` sentence and, where details are typed, its frontend
  schema variant land in ONE commit. `pnpm typecheck` builds contracts first and fails a code
  without its sentence (`DESCRIBE` is a `Record` over every non-Lighthouse code).
- A label change ships with the frontend tests that read the label (`git grep -n "Largest
  Contentful Paint is" -- fe/src` before the commit).
- The detail's `pageSpeedByStrategy` ships with `page-read.service.ts`, `PageSchemas.ts`,
  `PageDetailViewModel.ts`, `PageDetailScreen.tsx` and `SpeedSection.tsx` in one commit. A field
  the backend sends against a stricter schema is a thrown parse and an empty screen
  (`skills/fe-be-roundtrip`).
- The `allPages` narrowing ships with `collapse-origin-findings.ts` and `IssueReportSchemas.ts`.

---

## 6. API surface

| Route | Change | Authorization |
| --- | --- | --- |
| `GET /api/pages/:id` | `IPageDetail.pageSpeed` → `pageSpeedByStrategy` | unchanged |
| `GET /api/pages` | shape unchanged; `pageSpeed` is the mobile row, the join says so (I22) | unchanged |
| `GET /api/clients/:id/issues` | shape unchanged; carries the new codes; the speed join names the strategy | unchanged |

**Not added, each on purpose:**

- No endpoint to re-check links or to trigger a desktop measurement. The crawl is the only
  trigger, as it is for PageSpeed (prior plan D4/D5).
- No stored per-link table. Link outcomes live for one crawl, inside the run, and land as findings
  (D4).
- No desktop column on the pages list (D21).
- No new route, so the isolation matrix gains no row.

---

## 7. Services and modules

**Crawl module** (`be/src/modules/crawl/`):

- `constants/outbound-checks.constant.ts` — **new**. `OUTBOUND_CHECK_LIMITS = { maxLinkUrls: 300,
  maxDocuments: 30, concurrency: 8, perHost: 2, timeoutMs: 5_000, deadlineMs: 60_000 }` (D6, D11).
  Each number carries its reason in a comment. Redirect hops stay `REMOTE_API_LIMITS.maxRedirects`
  (5), which D6 matches.
- `services/outbound-checks/outbound-checks.service.ts` — **new**, `@Injectable`. It takes the
  selection, the run's `RobotsPolicy` and the signal, and returns `IOutboundFacts`. It owns
  selection under budget (§10.2), scheduling (§10.3), robots per host (§10.4) and the document
  reads (§10.5). It never throws a `RemoteApiError`. Same shape as `SiteProbeService`, which is
  why it sits beside it.
- `services/outbound-checks/host-robots-cache.ts` — **new**, pure plus one injected fetch.
- `services/site-http-client/site-http-client.ts`:
  - `checkLink(url, signal)` — **new**: `maxBytes: 0, overflow: 'truncate', accept: 'text/html,
    */*;q=0.5', maxRetries: 0, timeoutMs: 5_000`.
  - `readDocument(url, signal)` — **new**: `getHtml`'s cap and decoding with `maxRetries: 0,
    timeoutMs: 5_000`.
  - No method field and no HEAD: the transport interface is unchanged (D5).
- `pipelines/run-pipeline/run-stages.ts`: `CRAWL_STAGES` gains `'outbound'` between `'fetch'` and
  `'analysis'` (D26).
- `pipelines/run-pipeline/run-step.interface.ts`: `IRunContext.outbound: IOutboundFacts | null`.
- `services/crawl-run-executor/crawl-run-executor.service.ts`:
  - the new stage;
  - `analyse()` passes `outbound` and `target.timeZone` into each analysis input, and
    `clientRendered` into each `IFetchedEntry`.
- `services/post-selection/post-selection.service.ts`: the JS skip sets `clientRendered: true`. The
  `reason` string is unchanged. Every other item sets `false`.
- `interfaces/crawled-page.interface.ts`: `ISelectedItem.clientRendered: boolean`.

**Page-analysis module** (`be/src/modules/page-analysis/`):

- `interfaces/outbound-facts.interface.ts` — **new**. It sits here because checks read it, and
  crawl already imports page-analysis interfaces (`crawled-page.interface.ts:2-6`).

  ```ts
  /** What one URL answered when the crawl asked for its status (D5). */
  export type TOutboundOutcome =
    // The redirect shape is restated, not imported: checks read this file, and checks may
    // not reach @infrastructure/remote-api even for a type (D28).
    | { kind: 'answered'; status: number; redirects: readonly { url: string; status: number }[]; finalUrl: string }
    | { kind: 'failed'; failure: 'nxdomain' | 'timeout' | 'network' | 'forbiddenAddress' | 'tooManyRedirects' }
    | { kind: 'unchecked'; reason: 'budget' | 'deadline' | 'robots' };

  /** A page the crawl read whole: an in-run page, or one fetched under the document budget. */
  export interface IDocumentFacts {
    url: string;
    outcome: TOutboundOutcome;
    /** Present only for a 200 HTML answer. */
    page: { noindex: boolean; canonical: string | null; alternates: readonly IAlternateLink[] } | null;
  }

  export interface IOutboundFacts {
    links: ReadonlyMap<string, TOutboundOutcome>;
    documents: ReadonlyMap<string, IDocumentFacts>;
  }
  ```
- `services/checks/check.interface.ts`:
  - `ICheckInput` gains `linkStatuses: IOutboundFacts` (D4's name, holding both maps) and
    `timeZone: string` (D18).
  - `IPreviousCrawl` is unchanged (D33).
  - `make-check-input.ts` defaults are empty maps and `'America/Toronto'`. An empty map makes every outbound check not applicable, so the
    recorded-corpus test in `checks.registry.spec.ts:386-434` keeps its bounds.
- `services/checks/_shared/link-verdict.ts` — **new**: `EXTERNAL_BROKEN_STATUSES` and
  `linkVerdictOf(outcome, internal)` (§10.1).
- `services/checks/_shared/link-variants.ts` — **new**: `variantsOf` is moved out of
  `internal-link-variants.check.ts:14-31` unchanged, so `LINKS_TO_REDIRECTS` can skip what that
  check reports (D29).
- `services/checks/_shared/document-facts.ts` — **new**: `documentFactsOf(parsed, headers)` →
  `{ noindex, canonical, alternates }`, built from `robots-directives.ts` and
  `declaredCanonicals`. The crawl calls it for in-run pages and fetched documents alike, so both
  are judged by one function.
- Ten new check directories (`<code-kebab>/<code-kebab>.check.ts` + `.check.spec.ts`) are
  registered in `checks.registry.ts`.
- `services/checks/_shared/http-twin.ts` — `isHttpTwin` (already written by the phase 1
  implementation): read by `CANONICAL_TO_HTTP`, `CANONICAL_MISMATCH` and `CANONICAL_TARGET_BROKEN`
  (D32, D36).
- `services/checks/_shared/canonical-target.ts` — **new** in phase 3:
  `canonicalTargetProblemOf(page)` → the target's problem (`redirects`, `status`, `noindex`,
  `chain`) or null. It is read by `CANONICAL_TARGET_BROKEN` to fail and by `CANONICAL_MISMATCH`
  to step aside (D34), so the two cannot disagree about whether the target is broken.
- `services/checks/_shared/hreflang-code.ts` — **new** in phase 3: the language/region
  validator (`problemWith`, today private at `hreflang-invalid.check.ts:71-100`) moves here
  unchanged, so `HREFLANG_NOT_RECIPROCAL` skips exactly the alternates `HREFLANG_INVALID`
  reports (D36).
- `canonical-mismatch.check.ts` steps aside for the http twin (phase 1, D32) and for a broken
  target (phase 3, D34). `og-url-mismatch.check.ts` steps aside for a development host (D36).
  Each new check reads the same predicate `DEVELOPMENT_HOST_REFERENCES` applies to that kind of
  address (`development-host-references.check.ts:35-43`): `isDevelopmentHost` for what names the
  page itself (og:url, the canonical target, hreflang alternates), `isOwnDevelopmentHost` for
  content links.
- `services/site-checks/sitemap-checks.ts` `contradictionOf` also reads `CANONICAL_TO_HTTP`
  (phase 1) and `CANONICAL_TARGET_BROKEN` (phase 3) findings (D37).
- `hreflang-invalid.check.ts` loses its self-reference arm and its comment's "reciprocity is
  deliberately not checked" (D14; phase 3 replaces that sentence with a pointer to
  `HREFLANG_NOT_RECIPROCAL`).
- `services/site-checks/`: `content-checks.ts` — **new** (`contentNeedsJavascript`), registered in
  `site-checks.registry.ts`; `IFetchedEntry.clientRendered`.

**Clients module:**

- `repositories/crawl-runs/crawl-runs.repository.ts:277` `getRunTargetForWorker` joins `users` for
  `time_zone`.
- `IRunTarget.timeZone: string` (D18).

**Pages module** (`be/src/modules/pages/`, the owner of `page_speed` and `seo_issues`):

- `pages.repository.ts` and `crawl-results.service.ts`: unchanged (D33).
- `interfaces/page-speed.interface.ts`:
  - `IClaimedPageSpeed` gains `strategy: TPsiStrategy`;
  - **new** `TPageSpeedCompletion`, a union on `strategy` (D42, I27):

    ```ts
    /**
     * What one successful measurement writes. Lighthouse speaks for mobile alone
     * (lighthouse-checks D16), so the desktop arm cannot carry a Lighthouse record: a
     * desktop answer that cleared the page's Lighthouse findings would erase mobile's.
     */
    export type TPageSpeedCompletion =
      | {
          strategy: 'mobile';
          measurement: IPageSpeedMeasurementWrite;
          speedFindings: TPageSpeedSeoIssueOf<'mobile'>[];
          lighthouseFindings: TLighthouseSeoIssue[];
        }
      | {
          strategy: 'desktop';
          measurement: IPageSpeedMeasurementWrite & {
            lighthouseJudged: null; lighthouseNotApplicable: null; lighthouseFailed: null;
            seoScore: null; accessibilityScore: null;
          };
          speedFindings: TPageSpeedSeoIssueOf<'desktop'>[];
        };
    ```
- `repositories/page-speed/page-speed.repository.ts`, every method keyed by page and strategy:
  - `enqueueForWorker(tx, pageIds, strategies, staleBefore)` inserts one row per page and given
    strategy (`cross join unnest(strategies)`) with `on conflict (page_id, strategy) do update`,
    under today's freshness rule per row (SPEED-002);
  - `backfillCurrentForWorker(strategies)` the same, `on conflict (page_id, strategy) do nothing`
    (D20);
  - `claimNextForWorker` returns the strategy and keeps the fair order (§10.14, D44);
  - `completeForWorker(tx, pageId, strategy, attempt, measurement)`, `recordFailureForWorker` and
    `releaseForWorker` fence on `ownedBy(pageId, strategy, attempt)`;
  - `failAbandonedForWorker` is per row already and does not change.
- `repositories/seo-issues/seo-issues.repository.ts`:
  `replacePageSpeedFindingsForWorker<S>(tx, pageId, strategy: S, rows: (TPageSpeedSeoIssueOf<S> & { pageId: number })[])`
  deletes `code in PAGE_SPEED_CODES_BY_STRATEGY[strategy]`. `replaceLighthouseFindingsForWorker`
  is unchanged.
- `services/page-speed-results/page-speed-results.service.ts`:
  `completeForWorker(claim, completion: TPageSpeedCompletion)`. One transaction, under the
  fence: the measurement, that strategy's speed replace, and in the mobile arm only the
  Lighthouse replace.
- `services/page-speed-queue/page-speed-queue.service.ts` passes `PAGE_SPEED_QUEUED_STRATEGIES`
  (4b) and then `PSI_STRATEGIES` (4c) to both repository methods (D45).
- `repositories/page-list/page-list.repository.ts:141`: `left join page_speed ps on ps.page_id =
  p.id and ps.strategy = 'mobile'` (D43).
- `repositories/page-detail/page-detail.repository.ts:142`: the same join (4b). In 4d a second
  `left join page_speed psd on psd.page_id = p.id and psd.strategy = 'desktop'`, and
  `ICurrentPageRecord.pageSpeed` becomes `pageSpeedByStrategy`. `scoreOf` in
  `page-read.service.ts` keeps reading `.mobile`.
- `repositories/page-speed/page-speed-read.ts` (4d): `PAGE_SPEED_COLUMNS` becomes
  `pageSpeedColumns(alias: 'ps' | 'psd')`, prefixing each column with the alias. The alias is a
  literal union, so the `sql.raw` it builds from cannot carry input. `pageSpeedRowOf(row, alias)`
  reads it back. The desktop read leaves out `cardinality(lighthouse_judged)` and
  `lighthouse_failed`, which only the score reads.
- `services/page-read/page-read.service.ts` (4d) builds `pageSpeedByStrategy`.

**Issue-report module:**

- `repositories/issue-report/issue-report.repository.ts:124` (4b): `left join page_speed ps on
  ps.page_id = p.id and ps.strategy = case when i.code = any(${desktopCodes}) then 'desktop' else
  'mobile' end::psi_strategy_enum`, with `PAGE_SPEED_CODES_BY_STRATEGY.desktop` passed as one
  array parameter. A crawl or Lighthouse code joins mobile and ignores its `measured_at` (I22).
- `services/collapse-origin-findings/collapse-origin-findings.ts` (5b): `isSpeed` becomes
  `isCwv`, a guard over `TCwvIssueCode`, so image delivery stays at its page (D47, I31). A
  desktop CWV origin finding folds into its own row per code, as a mobile one does.

**Page-speed module:**

- `services/psi-client/psi-client.ts` (4c): `requestUrl(pageUrl, strategy)` and
  `runPagespeed(pageUrl, strategy, apiKey, signal)`. Parameters stay in a fixed order (`url`,
  `strategy`, `category`) so fixtures key on the URL. Mobile asks for
  `category=performance&category=seo&category=accessibility`. Desktop asks for
  `category=performance` only (D42, SPEED-016).
- `services/cwv-issues/cwv-issues-of.ts` (4a): `cwvIssuesOf<S>(strategy: S, measurement)`
  returns `TPageSpeedSeoIssueOf<S>[]`.
- `services/page-speed-executor/page-speed-executor.service.ts` (4b): builds the
  `TPageSpeedCompletion` arm of `claim.strategy` from the `measured` outcome. The desktop arm
  writes the five Lighthouse fields as null and passes no Lighthouse findings. 4c passes
  `claim.strategy` to `runPagespeed`.
- `services/classify-psi-response/classify-psi-response.ts` (5b): the `measured` outcome gains
  `imageDelivery: IExtractedImageDelivery | null` from `extractImageDelivery(json)`. It is
  never a condition of `measured` (D46).
- `services/extract-image-delivery/extract-image-delivery.ts` — **new** in 5b, pure, with spec
  (§10.12).
- `services/speed-issues/speed-issues-of.ts` — **new** in 5b: `speedIssuesOf` is `cwvIssuesOf`
  plus, in the mobile arm only, the image-delivery finding (§10.11). The executor calls it in
  place of `cwvIssuesOf`.
- `be/test/fixtures/record-pagespeed-fixtures.ts`: a target gains `strategy?: 'desktop'` (4c),
  which records with `strategy=desktop&category=performance`; `KEPT_AUDITS` gains the
  image-delivery audit id (5a).

**Infrastructure:** `remote-api/remote-failure-kind/remote-failure-kind.ts` — **new**, pure.
`remoteFailureKindOf(error)` → `'timeout' | 'nxdomain' | 'network' | 'forbiddenAddress' |
'tooManyRedirects' | 'tooLarge'`. `nxdomain` is a `RemoteApiUnavailableError` whose cause chain
carries `code === 'ENOTFOUND'`. `EAI_AGAIN` is `network`, a temporary DNS failure, never
"nonexistent". VERIFY: undici surfaces the lookup's `ENOTFOUND` on `error.cause` (or one level
deeper). The spec drives it through `createGuardedLookup` with a `resolveAll` that rejects with
an `ENOTFOUND` errno, so the answer is observed, not assumed.

---

## 8. Error catalogue

**HTTP:** nothing new. No route is added or changes its error contract.

**Crawl run errors (`CRAWL_RUN_ERRORS`): nothing new.** The outbound stage never fails a run
(I15). A host that refuses every connection only produces outcomes. A stage that hits its deadline
records the rest as `unchecked: deadline`, and the run continues to analysis.

**PageSpeed row errors (`PAGE_SPEED_ERRORS`): nothing new.** An answer without the image audit is
a measurement with no image finding (P8). A desktop answer is classified by the same
`classifyPsiResponse`, so `PAGE_LOAD_FAILED` and the rest mean the same per strategy.

**Copy whose job is to say what was NOT checked** (a finding's `evidence`, written by the check):

| Situation | Evidence line | Its job |
| --- | --- | --- |
| a page with M content links, N < M checked | "Checked N of M links; the rest were not checked: <k> over the crawl's link budget, <k> disallowed by robots.txt, <k> without a conclusive answer." | the report never implies the rest are fine (D6) |
| an external link answered 403 | (no line; not a finding) | D3: refusals are "could not check" |
| a canonical target outside the run over the document budget | finding not raised; the check is not applicable with skip reason "The canonical target could not be read within the crawl's budget." | a skipped judgement is shown as skipped (PAGES-012) |

---

## 9. Background work

**The crawl's `outbound` stage.** It runs inside the crawl worker's attempt, after `fetch` and
before `analysis`, holding no database connection (I8). The worker's lease is 60 s and is renewed
every 10 s by the heartbeat (`crawl-worker.constant.ts`), so a 60 s stage cannot lose the lease by
itself. The stage's own deadline is `AbortSignal.any([run signal, AbortSignal.timeout(60_000)])`:

- a lost lease or a shutdown aborts every request in flight, and the run ends as aborted, as today;
- the deadline aborts only the stage, records what it did not reach as `unchecked: deadline`, and
  returns normally.

**When an external fetch fails:**

| What happened | Outcome recorded | Effect on findings |
| --- | --- | --- |
| robots.txt of an external host answers 4xx (not 429) | that host allows all (`RobotsPolicy.allowAll`) | links are checked |
| robots.txt answers 5xx or 429, times out, or cannot connect | every link on that host is `unchecked: robots` (RFC 9309: unreachable means disallow) | "not checked" |
| a link times out, cannot connect, or resolves to a private address | `failed` with its kind | never broken except `nxdomain` on an external link |
| too many redirects | `failed: tooManyRedirects` | internal: broken (a loop is a broken link); external: could not check |
| the stage deadline passes | the rest `unchecked: deadline` | "not checked" |

**PageSpeed worker.** It runs the same slots, lease and limiter as today, over twice the rows
(D9). From 4c a crawl queues both strategies in its finalize transaction (SPEED-001 modified);
in 4b it still queues mobile only (D45). Quota use and drain time double, which was accepted in
D9. The claim keeps SPEED-014's turns: users, then clients, then the oldest row, where a claim of
either device serves its user and client, and within a client mobile goes first (§10.14, D44).
The 429 pause, the halt and the key-rejected state are per process and unchanged: a 429 on a
desktop call pauses mobile calls too, because the quota is one key's. A failed desktop attempt
touches only the desktop row's job columns (SPEED-006 applies per row). A desktop measurement
writes the desktop row and the desktop speed findings, and nothing of Lighthouse (D42).

---

## 10. Algorithms

### 10.1 Link verdict (`linkVerdictOf`, D3)

Input: an outcome and whether the link is internal (`sameSite(link, page.finalUrl)`). Output:
`'fine' | 'broken' | 'redirects' | 'unknown'`.

| Outcome | Internal | External |
| --- | --- | --- |
| answered, no redirect, 2xx | fine | fine |
| answered, redirected, final 2xx | **redirects** | fine (D19) |
| answered, final 4xx/5xx (redirected or not) | **broken** | **broken** if final status ∈ `EXTERNAL_BROKEN_STATUSES` (404, 410), else unknown |
| failed: nxdomain | broken | **broken** |
| failed: tooManyRedirects | broken | unknown |
| failed: timeout / network / forbiddenAddress | unknown | unknown |
| unchecked | unknown | unknown |

Statuses 401, 403, 429, 999, 5xx and timeouts on external links are unknown, never broken. The
`BROKEN_LINKS` explanation says this in words, and a test ties the sentence to the constant
(D25). The internal 4xx/5xx row follows D3 literally. Open question O3 names the one place where
this might cost precision.

**What the link checks skip before any verdict** (D29, D36). Both `BROKEN_LINKS` and
`LINKS_TO_REDIRECTS` drop a link whose host is this site's development host
(`isOwnDevelopmentHost`, `DEVELOPMENT_HOST_REFERENCES`'s fact). `LINKS_TO_REDIRECTS` also drops
a link `variantsOf` reports (`INTERNAL_LINK_VARIANTS`'s fact). A skipped link counts in neither
N nor M of "Checked N of M".

### 10.2 Which links are checked, under the budget (D6)

1. Take the run's pages in sitemap order. For each page, take `parsed.links` in document order and
   drop links to the same document (`sameDocument(href, page.finalUrl)`). Strip the fragment and
   de-duplicate across the run, first occurrence wins. This gives M_run unique URLs.
2. A URL that is one of the run's own pages (by `url` or `finalUrl`) is not requested. Its outcome
   is built from the page's own fetch: `answered`, its status, its redirects.
3. Take the first `maxLinkUrls` (300) remaining URLs in that order. The rest are
   `unchecked: budget`.
4. Before each request, ask the host's robots (§10.4). A disallowed URL is `unchecked: robots`.

The order is deterministic, so two crawls of an unchanged site check the same links. Neither
internal nor external links are favoured (D30). Every outcome goes into `IOutboundFacts.links`
keyed by the fragment-free URL.

### 10.3 Scheduling

There is one shared queue. At most `concurrency` (8) requests are in flight, at most `perHost`
(2) to one host. When a host is saturated the scheduler takes the next URL of another host and
does not wait. Each request is `checkLink` (5 s, no retry). Redirect hops are followed by
`RemoteApiCore`, each hop checked by the address guard. The stage has its deadline (§9). robots.txt
fetches are made under the same concurrency and per-host bounds. They count against neither the
300 nor the 30 (open question O6).

### 10.4 robots.txt per host (D6)

`HostRobotsCache.policyFor(origin)`:

- the run's own origin (`target.siteKey`'s served origin) → the run's `RobotsPolicy`, never
  fetched again;
- any other origin → one `getRobots(origin)` per crawl, with the outcomes of §9's table;
- answers are cached by origin for the run, and concurrent asks for one origin share one promise.

Disallowed means "not checked", using `RobotsPolicy.isAllowed` (our user agent token).

### 10.5 Documents and `CANONICAL_TARGET_BROKEN` (D2, D11)

**Which documents are wanted**, in this priority (D11's 30 is shared):

1. every page's first declared canonical when it is not the page itself (`sameDocument`);
2. every page's hreflang alternates, excluding `x-default` and the page itself.

URLs are de-duplicated. A URL that is one of the run's pages is built from that page (no request,
not counted). The rest are read by `readDocument` (5 s, `SITE_FETCH_LIMITS.htmlBytes`, no retry)
in priority order up to 30. Anything after that is `unchecked: budget`. robots.txt applies (§10.4).
`page` is filled only for a 200 HTML answer, through `documentFactsOf`.

**The check.** `CANONICAL_TARGET_BROKEN` judges a page's first declared canonical when it is not
the page itself. The rules are `canonicalTargetProblemOf(page)` (`_shared/canonical-target.ts`),
which `CANONICAL_MISMATCH` reads too (D34):

- no such canonical → not applicable;
- the canonical is the page's http:// twin (`isHttpTwin`) → not applicable, it is
  `CANONICAL_TO_HTTP`'s (D36);
- the target's host is a development host (`isDevelopmentHost`) → not applicable, it is
  `DEVELOPMENT_HOST_REFERENCES`'s (D36);
- target not checked, or an inconclusive failure → not applicable ("could not be read within the
  crawl's budget");
- the target redirected → **fails** (`redirects`, quoting the hops);
- the target answered 4xx/5xx → **fails** (`status`). Refusal statuses are open question O3.
- the target answered 200 and `noindex` → **fails** (`noindex`);
- the target answered 200 and declares a canonical that is not itself → **fails** (`chain`,
  quoting both hops);
- otherwise → pass.

Every failure quotes the page's own declaration (`quoteCanonical`) and what the target answered.

**`CANONICAL_MISMATCH` steps aside** (D34): when `canonicalTargetProblemOf(page)` returns a
problem, `CANONICAL_MISMATCH` answers not applicable. The broken target is the more specific
finding, and a page told both "your canonical points elsewhere" and "your canonical points at a
broken page" is told one fact twice. When the target was not read (budget, robots, no answer),
`CANONICAL_TARGET_BROKEN` is not applicable and `CANONICAL_MISMATCH` judges as it does today, so
the canonical fact is never lost to a budget.

### 10.6 `HREFLANG_NOT_RECIPROCAL` (D2)

Not applicable when the page has no alternates, or when its first declared canonical names
another URL: that page has declared itself a duplicate and left its own hreflang set, which is
`HREFLANG_INVALID`'s canonical-elsewhere arm (D36).

Otherwise each alternate other than itself and `x-default` is first filtered, then looked up in
`documents`:

- an alternate whose code `HREFLANG_INVALID` reports (the validator in `_shared/hreflang-code.ts`)
  → skipped, `HREFLANG_INVALID`'s (D36);
- an alternate on a development host (`isDevelopmentHost`) → skipped,
  `DEVELOPMENT_HOST_REFERENCES`'s (D36);
- not checked, failed, redirected, or not a 200 HTML answer → excluded (unknown; another code's
  business);
- a 200 answer whose `alternates` contains no `href` that is `sameDocument` with this page's
  `finalUrl` → non-reciprocal.

The check fails when one or more alternates are non-reciprocal, quoting each. It is not
applicable when none could be checked. The evidence adds "Checked K of A
alternates" when K < A.

### 10.7 The page-scoped markup checks

| Code | Not applicable when | Fails when |
| --- | --- | --- |
| `CANONICAL_TO_HTTP` | no declared canonical; the page is served over `http:` (NOT_HTTPS's); or the http canonical names a different address (CANONICAL_MISMATCH's) | the first declared canonical is the page's own http:// twin: `isHttpTwin(canonical, finalUrl)`, i.e. the same document once its scheme is https (D32) |
| `CANONICAL_MISMATCH` (changed) | as today, plus: the canonical is the page's http:// twin (CANONICAL_TO_HTTP's, D32); and from phase 3, the target is broken (CANONICAL_TARGET_BROKEN's, D34) | as today |
| `OG_URL_MISMATCH` | no `og:url`, or og:url names a development host (`isDevelopmentHost`, DEVELOPMENT_HOST_REFERENCES's, D36) | `og:url`, resolved against the page, is not `sameDocument` with the first declared canonical, or with `finalUrl` when none is declared |
| `HREFLANG_NO_SELF_REFERENCE` | no alternates | no alternate's `href` is `sameDocument` with `finalUrl` (moved from `hreflang-invalid.check.ts:128-130`) |
| `META_DESCRIPTION_REPEATS_TITLE` | no title or no description | `normalise(description) === normalise(titleWithoutBrand)`, or `=== normalise(title)`. `normalise` = NFKC, lower case, punctuation removed, whitespace collapsed. `titleWithoutBrand` = the title's first part split on `\s[|•·–—-]\s` (the same split `post-selection.service.ts:171` uses) |
| `BREADCRUMB_MISSING` | never (always judged) | neither `parsed.jsonLd.types` nor `parsed.microdata.types` contains `BreadcrumbList`. The extractor reads `@graph` (`extract-page.ts`), so Yoast's graph breadcrumbs count. RDFa is not read (open question O7) |
| `TITLE_YEAR_OUTDATED` | no title | §10.8 |

An http canonical is reported once (D32, superseding O4): the page's own http:// twin by
`CANONICAL_TO_HTTP` alone, any other http address by `CANONICAL_MISMATCH` alone.

`META_DESCRIPTION_REPEATS_TITLE` and `META_DESCRIPTION_LENGTH` both stay, though a copied title
is nearly always under 70 characters: length and content are two facts (D35).

### 10.8 `TITLE_YEAR_OUTDATED` (open question O1)

- `currentYear = Number(todayInZone(page.fetchedAt, page.timeZone).slice(0, 4))`. `todayInZone` is
  the existing contracts util, and the zone is the client owner's (D18).
- Candidate years are 4-digit tokens matching `\b(19|20)\d{2}\b` in `titleWithoutBrand`
  (§10.7) that sit either
  - at the end, optionally followed by closing punctuation (`)`, `]`, `:`, `.`, `!`, `?`), or
  - right after `in`, `for` or `в` (case-insensitive).
- The check fails when any candidate year is less than `currentYear`. Evidence: "The title says
  <year>; it is <currentYear>." Constants live in `title-year-outdated.constant.ts`: the
  prepositions and the end-punctuation set, each tunable, each with the page that moved it.
- Boundary cases in the spec: on Jan 1 00:30 Toronto (05:30 UTC), "Guide 2026" is current. On
  Dec 31 23:30 Toronto (Jan 1 04:30 UTC), "Guide 2026" is current, not outdated. "History of
  SEO in 2008" fires (a known risk, O1). "2024 vs 2025 results" does not fire: neither year is at
  the end or after a preposition.

### 10.9 `CANONICAL_CHANGED` — dropped (D33)

Every state a changed canonical leaves behind is already reported:

- self → other is `CANONICAL_MISMATCH`;
- removal is `CANONICAL_MISSING`;
- other → other is `CANONICAL_MISMATCH`.

Without duplicating them, `CANONICAL_CHANGED` could fire only on other → self, which is a fix,
not a defect. No algorithm, no storage.

**The sitemap's canonical contradiction (D15, D37).** `SITEMAP_LISTS_NON_INDEXABLE`'s
`contradictionOf` (`sitemap-checks.ts:29-49`) names an entry "names <url> as canonical" when the
entry's page carries `CANONICAL_MISMATCH`, `CANONICAL_TO_HTTP` (phase 1) or
`CANONICAL_TARGET_BROKEN` (phase 3), reading the canonical from that finding's details. Without
D37, the step-asides of D32 and D34 would silently drop those entries from a check that reports
them today.

### 10.10 `CONTENT_NEEDS_JAVASCRIPT` (site, D8)

- `M` = fetched entries whose answer was read as HTML: `status === 'crawled'`, or a
  `skipped_listing` with an `httpStatus` of 200. `N` = entries with `clientRendered === true`.
- Not applicable when M = 0. The check fails when N ≥ 1, with details `{ count: N, sampled: M,
  evidence: ["N of M posts this crawl read render their content with JavaScript:", …urls] }`.
- It reads only the flag, never the `reason` text (I5).

### 10.11 Speed findings per strategy (D9)

`cwvIssuesOf<S>(strategy: S, measurement): TPageSpeedSeoIssueOf<S>[]` (4a):

- for each metric with a reading, `band = cwvBandOf(metric, value)`; a good band yields nothing;
  otherwise the result gains `CWV_ISSUE_CODES[strategy][metric][band]` with the catalogue's
  severity and `max`, and details `{ value, max, source }`.

`speedIssuesOf` (5b) takes the strategy and its inputs as one discriminated argument, so the
desktop arm has no image input to pass:

```ts
// be/src/modules/page-speed/services/speed-issues/speed-issues-of.ts — new in 5b
// Two overloads, one per device: the desktop one has no image input, so image delivery
// cannot reach a desktop row by a caller's slip (D10, I21).
export function speedIssuesOf(input: {
  strategy: 'mobile';
  measurement: IExtractedMeasurement;
  imageDelivery: IExtractedImageDelivery | null;
}): TPageSpeedSeoIssueOf<'mobile'>[];
export function speedIssuesOf(input: {
  strategy: 'desktop';
  measurement: IExtractedMeasurement;
}): TPageSpeedSeoIssueOf<'desktop'>[];
```

- both arms: `cwvIssuesOf(strategy, measurement)`;
- mobile arm: plus the image-delivery finding of §10.12 when it fires.

The completion transaction calls `replacePageSpeedFindingsForWorker(tx, pageId, strategy, rows)`,
which deletes only `PAGE_SPEED_CODES_BY_STRATEGY[strategy]`.

### 10.12 `IMAGE_DELIVERY_INEFFICIENT` (D10, D23)

- **Input**: the PSI v5 JSON of a **mobile** answer, already parsed by `classifyPsiResponse`.
  The classifier calls `extractImageDelivery(json)` beside `extractMeasurement`,
  `extractDiagnostics` and `extractLighthouse`, and puts the result on the `measured` outcome as
  `imageDelivery`. Its absence never turns `measured` into anything else (D46). A desktop answer
  asks for performance only and may well carry the audit too; the executor never passes it on.
- **Rule**: `extractImageDelivery(json)` parses only
  `lighthouseResult.audits['image-delivery-insight']` with its own zod schema. It returns `null`
  when the audit is absent or does not parse ("no data"), else `{ failing, savingsBytes, items }`.
  The finding is raised when `failing && savingsBytes >=
  SEO_ISSUE_CATALOGUE.IMAGE_DELIVERY_INEFFICIENT.min` (102 400), with details `{ value:
  savingsBytes, min, images: items sorted by savings desc, first 10 }`. The comparison reads the
  catalogue's `min`, so the bar has one owner.
- **The shape, read from live answers on 2026-10-11** (Lighthouse 13.5.0, AMENDED by task 1.1 of
  `image-delivery-finding`; the guess held):
  - the id is `image-delivery-insight`, `scoreDisplayMode: 'metricSavings'`;
  - **failing** is `score < 1`: bbcgoodfood.com's recipe page scored 0.5 with savings, and
    smashingmagazine.com scored 1 with nothing listed. `metricSavings` holds the LCP and FCP gain
    in milliseconds (0 on both), not bytes;
  - the **total savings** is `details.debugData.wastedBytes` (162 175 bytes, which the audit's
    own `displayValue` rounds to "Est savings of 158 KiB"). There is no `overallSavingsBytes`;
  - **per image**: `details.items[]` with `url`, `totalBytes` and `wastedBytes` (bytes); the
    total equals the items' sum.
- **Absence**: `extractMeasurement` (`extract-measurement.ts:77`) is untouched. A renamed audit
  removes the image finding and nothing else.

### 10.13 Overlap with existing checks — the step-asides, and the pairs that do not overlap

The rule is the repository's (`PAGE_ANALYSIS_MODULE.md:349-354`): where two checks meet on one
fact, the more specific keeps it and the other answers not applicable. Each row is pinned by a
spec case named for the check deferred to (§13 I6, I7, I25).

| New / changed check | Steps aside for | When | Decision |
| --- | --- | --- | --- |
| `CANONICAL_MISMATCH` | `CANONICAL_TO_HTTP` | the canonical is the page's http:// twin | D32 |
| `CANONICAL_TO_HTTP` | `CANONICAL_MISMATCH` | the http canonical names another address | D32 |
| `CANONICAL_MISMATCH` | `CANONICAL_TARGET_BROKEN` | the target is broken | D34 |
| `CANONICAL_TARGET_BROKEN` | `CANONICAL_TO_HTTP` | the canonical is the http twin | D36 |
| `CANONICAL_TARGET_BROKEN` | `DEVELOPMENT_HOST_REFERENCES` | the target is a development host | D36 |
| `OG_URL_MISMATCH` | `DEVELOPMENT_HOST_REFERENCES` | og:url is a development host | D36 |
| `BROKEN_LINKS`, `LINKS_TO_REDIRECTS` | `DEVELOPMENT_HOST_REFERENCES` | the link is this site's development host (skipped) | D36 |
| `LINKS_TO_REDIRECTS` | `INTERNAL_LINK_VARIANTS` | the link is a scheme/host/tracking variant (skipped) | D29 |
| `HREFLANG_NOT_RECIPROCAL` | `HREFLANG_INVALID` | an alternate's code is invalid (skipped); the canonical names another URL (whole check) | D36 |
| `HREFLANG_NOT_RECIPROCAL` | `DEVELOPMENT_HOST_REFERENCES` | an alternate is a development host (skipped) | D36 |
| `HREFLANG_NO_SELF_REFERENCE` | — (`HREFLANG_INVALID` loses the arm instead) | — | D14 |

**Checked and found not to duplicate** (each pair was read against the other's rule):

- `BREADCRUMB_MISSING` / `BREADCRUMB_INVALID`: exclusive. One fires only when no BreadcrumbList is
  declared, the other is not applicable then.
- `TITLE_YEAR_OUTDATED` / `DATES_INCONSISTENT`: the title's year against the calendar, versus the
  URL's year against the markup's dates. Different sources, different facts.
- `CONTENT_NEEDS_JAVASCRIPT`: such a post is never analysed (D8), so no page check can report it.
- `IMAGE_DELIVERY_INEFFICIENT` / `LCP_IMAGE_LAZY_LOADED` and the CWV codes: an opportunity
  (bytes Lighthouse says could be saved), versus a markup cause of LCP and a measured outcome.
- `IMAGE_DELIVERY_INEFFICIENT` / the merged Lighthouse catalogue (D50, read at `adc8887`): its 66
  entries are SEO and accessibility audits only. `LH_IMAGE_ALT`, `LH_INPUT_IMAGE_ALT` and
  `LH_SVG_IMG_ALT` judge alternative text, not bytes. No crawl check judges image weight or format
  (`IMAGES_MISSING_ALT`, `NO_IMAGES`, `IMAGES_NOT_INDEXABLE`, `IMAGE_FILENAMES_GENERIC`,
  `IMAGE_PREVIEW_NOT_LARGE`, `PREVIEW_IMAGE_*`, `LCP_IMAGE_LAZY_LOADED`). The stored speed
  diagnostics (`extractDiagnostics`: TTFB, visit shares, `lcp-breakdown-insight`) report no
  image audit.
- Desktop / mobile CWV: different device data from different PageSpeed answers.
- `META_DESCRIPTION_REPEATS_TITLE` / `META_DESCRIPTION_LENGTH`: content versus length, both kept
  by the user's choice (D35).

### 10.14 The claim, per strategy (D44)

The fair claim of SPEED-014 (`page-speed.repository.ts:91-149`) keeps its three CTEs. The
changes:

- `due` selects `q.strategy` beside `q.page_id`.
- `served` is unchanged: it groups by client and user over rows of either strategy. A claim of a
  desktop row serves its client as a claim of a mobile row does. Without that, a client's desktop
  backlog would count as never served and jump every queue.
- `next` joins `due d on d.page_id = q.page_id and d.strategy = q.strategy`, and orders by:

  ```sql
  order by us.served_at nulls first, cs.served_at nulls first,
           d.strategy,           -- psi_strategy_enum: 'mobile' sorts before 'desktop'
           d.next_attempt_at, d.page_id
  ```

  Postgres sorts an enum by its declaration order, which is `PSI_STRATEGIES`' order. The
  enum's comment says so, because reordering the array would silently reorder the queue.
- The `update` matches `ps.page_id = next.page_id and ps.strategy = next.strategy` and returns
  `ps.strategy`.

Within the client chosen, every due mobile row goes before its desktop rows. Mobile feeds the
score, the list's badge and Lighthouse's verdicts, and desktop feeds one tab of the Speed block
(O9). Across users and clients the turns are exactly SPEED-014's.

`page_speed_claim_idx` (on `next_attempt_at`, partial on the claimable statuses) still serves
`due`. Ordering by `d.strategy` sorts the handful of due rows of one client and needs no index.

---

## 11. Scenario walkthroughs

**A — a crawl of a site with link trouble.** A client's 15 posts are fetched. The outbound stage
collects 412 unique content links, of which 9 are run pages (built from the run, no request) and
403 are candidates.

1. The first 300 are scheduled, 8 at a time and 2 per host. The remaining 103 become
   `unchecked: budget`.
2. robots.txt is fetched once for each of 41 external hosts. One host answers 503, and its 3 links
   become `unchecked: robots`.
3. Post 4 links internally to `/old-guide/`, which answers `301 → /guide/`. Post 7 links to
   `example.org/x`, which answers 404, and to `news.example.net/y`, which answers 403. Post 9
   links to `gone.invalid`, which does not resolve.
4. Post 2's canonical names `https://a.example/post-2-amp/`, which is not in the run. It is read
   under the document budget, answers 200 and declares a canonical to `/post-2/` (a chain).
5. The stage finishes in 21 s. The run log's stage timings show `outbound: 21000`.
6. Analysis gives post 4 `LINKS_TO_REDIRECTS` (one internal redirect) and post 7 `BROKEN_LINKS`
   for the 404 only. The 403 is unknown. Post 7's evidence ends "Checked 38 of 40 links; the rest
   were not checked: 2 over the crawl's link budget".
7. Post 9 also gets `BROKEN_LINKS` (nxdomain). Post 2 gets `CANONICAL_TARGET_BROKEN`: chain.
   Its `CANONICAL_MISMATCH` steps aside (D34). If post 2 is a sitemap entry,
   `SITEMAP_LISTS_NON_INDEXABLE` still names it, reading the canonical from the
   `CANONICAL_TARGET_BROKEN` finding (D37).
8. A post linking to `staging.a.example/draft/` gets neither `BROKEN_LINKS` nor
   `LINKS_TO_REDIRECTS` for it, whatever it answers. It is `DEVELOPMENT_HOST_REFERENCES`'s (D36).
9. Everything is written in the one finalize transaction.

**B — desktop measured for the first time.** After phase 5, a page crawled last week has one
`page_speed` row, `mobile`, `done`, measured 20 h ago, with `CWV_LCP_POOR`,
`IMAGE_DELIVERY_INEFFICIENT` and two `LH_*` findings. Its Lighthouse lists are set.

1. Today's crawl's finalize upserts `(page, mobile)`, left alone because it is 20 h old, and
   `(page, desktop)`, inserted `queued` (SPEED-002 per row).
2. The client's turn comes (SPEED-014). Its due mobile rows of other pages go first, then this
   desktop row (§10.14). The slot calls PSI with `strategy=desktop&category=performance`. LCP is
   1.9 s (url), INP null, CLS 0.02, TTFB 410 ms (url). No findings.
3. The completion's desktop arm writes the desktop row with null Lighthouse columns (the CHECK
   would refuse anything else) and replaces only the desktop codes. The page's mobile
   `CWV_LCP_POOR`, `IMAGE_DELIVERY_INEFFICIENT` and both `LH_*` findings remain, because the
   Lighthouse replace is not called (D42).
4. The detail's Speed block on Desktop shows green cards and the TTFB line, with no SEO or
   accessibility caption. On Mobile it still shows the red LCP and both captions. The checks
   section's Lighthouse column is dated by the mobile measurement (D49).
5. The pages list has one row for the page, its badge is still the mobile LCP, and its score and
   place in the order are unchanged (I22, D43).

**C — an http canonical, reported once.** Two posts of an https site, both sitemap entries.

1. Post 1 declares `http://a.example/post-1/`, its own address over plain HTTP. It gets
   `CANONICAL_TO_HTTP`. `CANONICAL_MISMATCH` is not applicable, with the skip reason naming
   `CANONICAL_TO_HTTP` (D32).
2. Post 2 declares `http://a.example/other/`, another address. It gets `CANONICAL_MISMATCH`.
   `CANONICAL_TO_HTTP` is not applicable (D32).
3. A plugin later changes post 2's canonical to `/category/post-2/`. The next crawl reports what
   is true now, `CANONICAL_MISMATCH`, and nothing about the change (D33).
4. `SITEMAP_LISTS_NON_INDEXABLE` names both entries "names <url> as canonical": post 1 through
   the `CANONICAL_TO_HTTP` finding (D37), post 2 through `CANONICAL_MISMATCH` (D15).

---

## 12. Frontend

**No new route, gateway or ViewModel.** All of it is MVVM within existing pieces
(`fe/skills/folder-structure`, `practices/fe/react/mvvm-layers`).

- `Core/Helpers/DescribeIssue/describeIssue.ts`:
  - 4a: six desktop sentences. The `speed` helper (`:30-38`) gains a device word, "on mobile" or
    "on desktop", so the sentence matches the label (D48);
  - 5b: one image-delivery sentence that formats bytes as KiB and counts the images;
  - compile-enforced: `DESCRIBE` is a `Record` over every non-Lighthouse code (`:50-53`, I3).
- `Gateways/PageGateway/Validation/PageSchemas.ts`:
  - 4a: `speedVariants` (`:178-184`) maps every pageSpeed code to `cwvMeasurementSchema`, so the
    six desktop codes parse with no change. The test at `PageSchemas.test.ts:153` iterates
    `PAGE_SPEED_ISSUE_CODES` and covers them;
  - 5b: `speedVariants` maps `CWV_ISSUE_CODES`' leaves only. **New** `imageDeliverySchema =
    measurementSchema.extend({ images: z.array(z.object({ url: z.string(), savingsBytes:
    z.number().int().min(0) })).max(10) })` is the variant for `IMAGE_DELIVERY_INEFFICIENT`.
    `pageSpeedIssueSchema` (`:256-259`, a report's whole-site row) is built from the CWV
    variants alone (I31);
  - 4d: `pageDetailSchema` (`:293`) replaces `pageSpeed` with `pageSpeedByStrategy: z.object({
    mobile: pageSpeedSummarySchema.nullable(), desktop: pageSpeedSummarySchema.nullable() })`. It
    still `satisfies z.ZodType<IPageDetail>`, so a schema that lags the contract does not
    compile.
- `Gateways/IssueReportGateway/Validation/IssueReportSchemas.ts:38-41` (5b): `allPagesRowSchema`
  satisfies `TCwvSeoIssue & { location: IAllPagesLocation }`.
- `ViewModels/PageDetailViewModel/PageDetailViewModel.ts` (4d) carries `pageSpeedByStrategy`
  through.
- `Modules/PageDetail/PageDetailScreen.tsx` (4d):
  - `:80` passes `pageSpeedByStrategy` to the Speed block;
  - `:121` (the checks section's Lighthouse date) and `:130` (the score explanation) read
    `pageSpeedByStrategy.mobile` (D49).
- `Modules/PageDetail/SpeedSection/SpeedSection.tsx` (4d):
  - props: `pageSpeedByStrategy`, `availability`, `timeZone`;
  - a Mantine `SegmentedControl` Mobile | Desktop, held in local `useState`, because nothing else
    reads it (`practices/fe/react/mvvm-layers` "input that nothing else needs");
  - the body is today's body over `pageSpeedByStrategy[strategy]`;
  - the title becomes "Speed (Core Web Vitals)";
  - **states per strategy**, from `pageSpeedViewOf(summary, availability)`: notConfigured,
    notMeasured (desktop sentence per §1.2), queued ("In queue", 3e4dc72), measuring, paused,
    couldNotMeasure, measured with or without refreshFailed. The availability notice stands above
    both. Switching never refetches;
  - the SEO and accessibility captions already render only when non-null (`:157-167`). A
    desktop measurement carries null there (D42), so Desktop shows none without a branch on the
    device. A test pins it.
- `Modules/Issues/IssuesScreen.tsx:141` (4c): the `active` sentence names both devices (§1.4).
  It lands in 4c, when desktop findings first appear, so the screen never says "mobile" beside a
  desktop finding.
- `Core/Helpers/DescribePageSpeed/describePageSpeed.ts`: unchanged. It is called per strategy.
- `Modules/Pages/PagesTable/PagesTable.tsx:191`: unchanged. The legend's "Core Web Vitals,
  mobile" stays true (D21).
- The Info guide (`fe/src/Modules/Info/`, `fe/src/ViewModels/InfoGuideViewModel/`) says
  "mobile strategy" in `speedAndSite.ts:8`, `CoreWebVitalsGuide.tsx:246` and
  `UsingTracker.tsx:103`. VERIFY: at `adc8887` these files are untracked, another session's work
  in progress. If they are committed by 4c, 4c rewrites those sentences to name both devices.
- Site check rendering (run log, report) reads `SITE_CHECK_CATALOGUE` and `SITE_CHECK_CODES`
  generically (`ClientSchemas.ts:51`, `IssueReportSchemas.ts:44`), so `CONTENT_NEEDS_JAVASCRIPT`
  needs no component.

---

## 13. Invariants ↔ tests

| # | Pinned by |
| --- | --- |
| I1 | `packages/contracts/src/domain/seo/inclusion-bar/inclusion-bar.util.test.ts` (new) → "flags an entry above notice whose every source is industry", "passes one with a first-party source beside the industry one"; `seo-issue-catalogue.test.ts` → "holds the inclusion bar: no industry-only check above notice" (both catalogues) |
| I2 | `pnpm typecheck`; `checks.registry.spec.ts` → "has exactly one check per crawl-owned code" (existing) |
| I3 | `pnpm --filter fe typecheck` over `DESCRIBE`; `describeIssue.test.ts` → one case per new code |
| I4 | `hreflang-invalid.check.spec.ts` → "passes a valid set that omits this page — that is HREFLANG_NO_SELF_REFERENCE's"; `hreflang-no-self-reference.check.spec.ts` (new) → "fails a set that never names this page" |
| I5 | `post-selection.service.spec.ts` → "a client-rendered post stays skipped_listing, is no page, and carries clientRendered"; `site-checks.registry.spec.ts` → "counts the flag, not the reason text" |
| I6 | `canonical-to-http.check.spec.ts` → "is not applicable to an http canonical naming another address — that is CANONICAL_MISMATCH's"; `canonical-mismatch.check.spec.ts` → "is not applicable to the page's own http twin — that is CANONICAL_TO_HTTP's" |
| I7 | `canonical-mismatch.check.spec.ts` → "is not applicable when the target is broken — that is CANONICAL_TARGET_BROKEN's" and "judges as before when the target was not read"; `canonical-target.spec.ts` (new) for the shared predicate |
| I8 | `run-pipeline.spec.ts` (existing assertion) + `crawl-run-executor.service.spec.ts` → "makes every outbound request before the transaction opens" (transaction runner spy ordering) |
| I9 | `outbound-checks.service.spec.ts` (new) → "checks at most 300 link URLs and marks the rest unchecked: budget", "reads at most 30 documents, canonical targets first", "never has more than 8 in flight, nor more than 2 for one host", "stops at the deadline and marks the rest unchecked: deadline", "asks each URL once, without retry" |
| I10 | same spec → "fetches each external host's robots.txt once", "never requests a disallowed URL", "treats an unreachable robots.txt as disallowing the host" |
| I11 | `broken-links.check.spec.ts` (new) → "an unchecked link is neither broken nor fine, and the evidence says checked N of M"; "is not applicable when no link could be checked" |
| I12 | `link-verdict.spec.ts` (new) → `it.each([401, 403, 429, 999, 500, 503])` "an external %d is unknown, never broken"; "an external 404, 410 and nxdomain are broken"; "the BROKEN_LINKS explanation names every external broken status and says 403, 429 and 5xx are never reported" |
| I13 | `pnpm --filter be lint` with the new rule; one deliberate violation is tried locally and seen failing before the commit (task 1.4 of `crawl-outbound-checks`) |
| I14 | `undici-http-transport.spec.ts` → "a zero-byte cap returns the head and frees the connection" (nine status-only requests against an endless body on one origin with `connections: 8` all resolve within the timeout) |
| I15 | `outbound-checks.service.spec.ts` → "a host refusing every connection leaves outcomes, not an error"; `crawl-run-executor.service.spec.ts` → "an outbound stage that throws nothing but times out leaves the run succeeded" |
| I16 | `page-speed.repository.int-spec.ts` → "holds one row per page and strategy" (a second insert of `(page, mobile)` fails on `page_speed_pk`), "deleting a page deletes both rows" |
| I17 | same → "refuses a row without a strategy" (an insert through `sql` that omits the column fails on NOT NULL). The column's type is `TPsiStrategy` with no default, so a Drizzle insert without it is also a typecheck error |
| I18 | `seo-issues.repository.int-spec.ts` → "a desktop replace leaves the page's mobile, Lighthouse and crawl findings", "a mobile replace leaves its desktop findings". Typecheck: passing a mobile code with `strategy: 'desktop'` does not compile |
| I19 | `pnpm typecheck` (a `strategy` on a crawl or Lighthouse entry is an excess property; a pageSpeed entry without one is a missing property); `seo-issue-catalogue.test.ts` → "splits the speed codes by strategy: six CWV codes each" (4a), extended in 5b to "and image delivery is mobile's" |
| I20 | `cwv-issues-of.spec.ts` → "a desktop metric outside the good band yields its desktop code"; `seo-issue-catalogue.test.ts` → "each CWV code's max is its metric's threshold for its band, on both strategies"; `be/test/e2e/page-speed.e2e-spec.ts` → "every non-good badge in the list has its finding in the detail, and no good one does" (existing, mobile) and "every non-good desktop card has its desktop finding" (new, 4d) |
| I21 | `speed-issues-of.spec.ts` (new) → "raises IMAGE_DELIVERY_INEFFICIENT at 102 400 bytes, not 102 399"; the desktop overload has no image input, which is the typecheck half; `extract-image-delivery.spec.ts` (new) → "is null for an answer without the audit"; `classify-psi-response.spec.ts` → "an answer without the image audit is still measured" |
| I22 | `page-list.repository.int-spec.ts` → "lists a page once, with its mobile summary and score, when both strategies are stored"; `page-detail` through `pages.e2e-spec.ts` → "the detail's score and Lighthouse lists come from the mobile row"; `issue-report.repository.int-spec.ts` → "returns each finding once when both strategies are stored, with its own strategy's measured_at"; the list statement-count case still passes. Before 4b closes, `git grep -n "join page_speed" be/src` lists only joins that name a strategy |
| I23 | **not pinned by a test**: a reader judges every firing against the live page (D12). The phase's acceptance includes the tally in `PAGE_ANALYSIS_MODULE.md`, found by `git grep -n "Field audit of the Ahrefs-gap checks" be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` |
| I24 | `be/test/e2e/isolation-matrix.e2e-spec.ts` static case "covers every route that takes an id or a clientId" (existing; unchanged route set) |
| I25 | one case per §10.13 row, each named for the check deferred to: `og-url-mismatch.check.spec.ts` → "is not applicable to a development-host og:url — that is DEVELOPMENT_HOST_REFERENCES's"; `broken-links.check.spec.ts` and `links-to-redirects.check.spec.ts` → "skips a link to this site's development host — that is DEVELOPMENT_HOST_REFERENCES's"; `links-to-redirects.check.spec.ts` → "skips a link INTERNAL_LINK_VARIANTS reports"; `hreflang-not-reciprocal.check.spec.ts` → "skips an alternate whose code HREFLANG_INVALID reports", "skips a development-host alternate — that is DEVELOPMENT_HOST_REFERENCES's", "is not applicable when the canonical names another URL — that is HREFLANG_INVALID's"; `canonical-target-broken.check.spec.ts` → "is not applicable to the http twin — that is CANONICAL_TO_HTTP's", "is not applicable to a development-host target — that is DEVELOPMENT_HOST_REFERENCES's" |
| I26 | `site-checks.registry.spec.ts` → "names an entry whose page names another URL as canonical" (CANONICAL_MISMATCH, D15), "names an entry whose canonical is its http twin" (CANONICAL_TO_HTTP, phase 1), "names an entry whose canonical target is broken" (CANONICAL_TARGET_BROKEN, phase 3) |
| I27 | DB: `page-speed.repository.int-spec.ts` → "refuses a desktop row with a Lighthouse list or a category score" (fails on `page_speed_lighthouse_mobile_only`). Unit: `page-speed-results.service.spec.ts` → "a desktop completion writes its speed findings and never calls the Lighthouse replace". Typecheck: the desktop arm of `TPageSpeedCompletion` |
| I28 | `page-speed.repository.int-spec.ts` → "claims a desktop row with its strategy", "a stale attempt on the desktop row writes nothing to the mobile row of the same page and attempt number" |
| I29 | `page-speed.repository.int-spec.ts` → the three fair-claim cases (`:471`, `:485`, `:499`) kept green with a strategy on every row; new "a claim of a client's desktop row serves the client", "within one client, due mobile rows are claimed before its desktop rows" |
| I30 | 4b: `page-speed-queue.service.spec.ts` → "queues only the strategies PAGE_SPEED_QUEUED_STRATEGIES names". 4c: the constant is deleted (the test is rewritten to "queues every strategy"), and `be/test/e2e/page-speed.e2e-spec.ts` → "a crawl queues both strategies of each page" |
| I31 | typecheck (the `allPages` arm is `TCwvSeoIssue`); `collapse-origin-findings.spec.ts` → "keeps IMAGE_DELIVERY_INEFFICIENT at its page, and folds origin-sourced desktop CWV codes into one row each" |
| I32 | `seo-issue-catalogue.test.ts` → "the crawl and Lighthouse are scored, the Core Web Vitals are not" (existing), extended in 5b with "IMAGE_DELIVERY_INEFFICIENT is a pageSpeed code"; `be/test/e2e/page-speed.e2e-spec.ts` → "a speed finding counts among the issues and leaves the score and the order unchanged" (existing), with an image-delivery finding added to its fixture in 5b |

---

## 14. Test plan

Conventions belong to `practices/be/nestjs/testing-patterns/SKILL.md`,
`practices/fe/react/testing/SKILL.md` and `fe/skills/testing/SKILL.md`. Each test below says what
makes it fail.

**Contracts (unit, vitest).**

- `inclusion-bar.util.test.ts` fails on a predicate that reads one source instead of all.
- `seo-issue-catalogue.test.ts`:
  - the inclusion bar over the real catalogue fails if an Ahrefs-only entry is a warning;
  - "splits the speed codes by strategy" fails if a desktop entry declares `mobile`, because
    `PAGE_SPEED_CODES_BY_STRATEGY` is derived from the declarations it checks;
  - "each CWV code's max is its metric's threshold for its band" (`:98-107`) and "makes a poor
    metric a warning…" (`:110-119`) loop over both strategies, so a desktop `max` copied from the
    wrong band fails;
  - "gives the PageSpeed worker exactly the six Core Web Vitals codes" (`:83-92`) is renamed and
    lists 12 codes in 4a, 13 in 5b;
  - "is exactly the checks that compare a page with the rest of the crawl" (`:146-153`) is
    UNCHANGED, because every new check is page-scoped (D17). A run-scoped addition fails it.
- `issue-plain-copy.test.ts` (existing) fails on any new entry whose copy breaks
  `PLAIN_COPY_LIMITS` or names no one who acts.

**Backend unit (jest, beside source).**

- One `.check.spec.ts` per new crawl code, written from the markup of a real page wherever one is
  known. Each spec has a fails case, a pass case and a not-applicable case. Each fails first on
  the missing module. Each step-aside of §10.13 has its own case, named for the older check
  (I25). That case fails if the deference is removed, because the older check's fact would then
  fire under the new code too.
- `link-verdict.spec.ts`, `remote-failure-kind.spec.ts`, `document-facts.spec.ts`,
  `host-robots-cache.spec.ts`.
- `outbound-checks.service.spec.ts`: `FixtureHttpTransport` plus a fake clock, mocks at the
  transport boundary.
- `site-checks.registry.spec.ts` new cases. `post-selection.service.spec.ts` flag case.
- The changed `crawl-run-executor.service.spec.ts` cases.
- `extract-image-delivery.spec.ts` (fixture kind: reads the recorded answer from disk),
  `speed-issues-of.spec.ts`. The extractor's spec fails if it reads anything outside the one
  audit: the "passing" fixture keeps every other audit, and the case asserts the result is
  unchanged when they are deleted from the parsed JSON.
- `psi-client.spec.ts` → "a desktop request asks for strategy=desktop and category=performance
  only, the key only in the header". It fails if the desktop URL carries `category=seo`, which
  is SPEED-016's desktop scenario.
- `page-speed-executor.service.spec.ts` → "a desktop claim completes the desktop arm with no
  Lighthouse record". It fails if the executor copies the answer's Lighthouse record onto a
  desktop completion.
- `page-speed-results.service.spec.ts` → I27's unit case, with the repositories mocked.
- `page-speed-queue.service.spec.ts` → I30's case.
- `undici-http-transport.spec.ts` new case, against a local server and not the network.

**Integration / DB (`*.int-spec.ts`, real Postgres).** Each covers what only the database decides:

- `page-speed.repository.int-spec.ts`: the composite PK; NOT NULL without default; cascade; the
  mobile-only CHECK (I27); the per-strategy enqueue and claim; the fair turns across strategies
  (I29); the fence per `(page, strategy, attempt)` (I28); the 24 h boundary per strategy;
- `seo-issues.repository.int-spec.ts`: strategy-scoped deletes;
- `page-list.repository.int-spec.ts`, `issue-report.repository.int-spec.ts`: no row
  multiplication, and the list's score reads the mobile row's Lighthouse share only;
- `seed-runner.int-spec.ts`: per-strategy backfill idempotence (4c, once both strategies are
  queued).

**e2e (API, `be/test/e2e/*.e2e-spec.ts`, `pnpm test:db`).**

- `crawl.e2e-spec.ts`: a crawl over fixtures whose post links to one recorded 404 and one
  recorded 301 stores `BROKEN_LINKS` and `LINKS_TO_REDIRECTS` on that page and nothing else new.
  A canonical naming a recorded 301 stores `CANONICAL_TARGET_BROKEN` and not
  `CANONICAL_MISMATCH` (D34). The run log carries the outbound timing.
- `page-speed.e2e-spec.ts`: both strategies queued and measured (4c); the list unchanged; the
  detail carries `pageSpeedByStrategy` (4d); badge ⇔ issue per strategy. Its PSI answers are
  overridden per URL (`transport.override(PsiClient.requestUrl(finalUrl), …)` at `:69` and
  `:255`). From 4c each override names a strategy and the desktop URL gets the desktop fixture.
  An un-overridden desktop URL answers 404 under the fixture transport, which classifies as
  `PSI_REJECTED`. The new case "a crawl queues both strategies; each measured row has its
  findings" asserts both rows `done`, so it fails on that.
- `pages.e2e-spec.ts`: the detail shape.
- `issue-report.e2e-spec.ts`: desktop and image codes present; no duplicate rows.

**Fixtures.**

- `FixtureHttpTransport` (`be/src/infrastructure/remote-api/_testing/fixture-http-transport.ts:52-56`)
  answers every unrecorded URL with 404. Under link checks that would make every recorded post's
  external links "broken" in every crawl fixture test.
- The fixture transport gains one rule, documented in its comment and pinned by
  `fixture-http-transport.spec.ts` → "an unrecorded URL asked for its status only answers 200":
  a request with `maxBytes === 0` and no manifest entry answers `200` with an empty body. A test
  that needs a broken link overrides that URL (`override`, existing). The rule keeps "never a
  network call".
- Its failure mode: if `checkLink` stopped asking with a zero cap, the recorded corpus would turn
  red in `crawl.e2e-spec.ts`, which is the intended alarm.
- New recorded PSI answers: `url-field.desktop.json` (4c), and two mobile answers that keep the
  image-delivery audit, `image-delivery-failing.json` and `image-delivery-passing.json` (5a).
  All are recorded with `record-pagespeed-fixtures.ts`, which refuses a file echoing the key and
  records only the files named by its prefix argument, so no pinned answer is re-recorded by
  accident.

**Typecheck / lint.** I2, I3, I17 (the column type), I19. The ESLint rule of I13.
`satisfies z.ZodType<…>` on the changed detail schema.

**Field audit protocol (D12).** It is used by phases 1, 3 and 5.

1. Stack: `docker compose up -d --build`. Sign in as the demo user (`curl -c c.txt …/api/auth/sign-in`).
2. Clients: add every audit site as a client. Use the UI, or
   `curl -b c.txt -X POST http://localhost:8080/api/clients -H 'content-type: application/json'
   -d '{"name":"<site>","websiteUrl":"https://<site>/"}'`.
   VERIFY: the 60-site list of the 2026-10-09 audit is not in the repository
   (`PAGE_ANALYSIS_MODULE.md:258-307` names sites in prose only). The auditor reuses the sites
   named there and lists the full set in the tally, so the next audit can repeat it.
3. Firings: when the runs finish,
   `docker compose exec postgres psql -U tracker -d seo_tracker -c "select i.code, p.final_url,
   i.details_json from seo_issues i join pages p on p.id = i.page_id where i.code in (<the
   phase's codes>) order by i.code, p.final_url"`. Site checks:
   `… -c "select r.client_id, s.details_json from site_checks s join crawl_runs r on r.id =
   s.run_id where s.code = 'CONTENT_NEEDS_JAVASCRIPT' and s.status = 'failed'"`.
4. Reading: every row is opened against the live page (view-source, and for speed the
   pagespeed.web.dev result), then judged correct or wrong.
5. Tally: per code, fired / correct / wrong, the sites, and for each wrong firing the fix (a spec
   built from that site's markup) or `enabled: false`. It goes into `PAGE_ANALYSIS_MODULE.md`
   under "Field audit of the Ahrefs-gap checks (<date>)". The phase closes only at 0 wrong.
6. Duration (phase 3): `docker compose logs be | grep '"Crawl run stages"'`. Record the median
   and the slowest `outbound` timing over the audit's runs in `CRAWL_MODULE.md`.

**Performance.**

- The outbound stage is bounded by its deadline, not by data size. The measurement is the
  duration in step 6.
- `page_speed` doubles to ≤ 2 rows per crawled page, so no new index.
- Phase 4b edits `be/test/explain/pages-list.explain.sql:33-41` (its join gains `AND ps.strategy
  = 'mobile'`, its comment names `page_speed_pk`) and re-runs it on the seeded stack. The
  `page_speed` access must still be an index scan on `page_speed_pk` with both key columns in
  the condition, or a hash over the small table. A sequential scan feeding a nested loop per
  listed page fails the phase.
- The claim (§10.14) runs once per slot per measurement, over the due rows the partial index
  `page_speed_claim_idx` returns. It is not EXPLAIN-gated. Its cost is one sort of one client's
  due rows.

---

## 15. Work order

**TDD discipline.**

- In every sub-phase, the tests named "before" are written first and run. The run is observed
  failing for the reason stated.
- The test and the code that turns it green land in one commit, so every commit is green.
  Pre-push runs `pnpm lint && pnpm typecheck && pnpm test`.
- Tests named "after" pin behaviour whose failing form cannot exist before the code (a component
  that does not exist yet).

**Between phases.**

- Each phase ends with `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db` green.
- `docker compose up -d --build` serves a working app; check it with
  `curl -fsS http://localhost:8080/api/health`.
- The phase's field audit is recorded where it has one.
- Its change's tasks are all ticked, or carry `AMENDED during implementation:` or
  `VERIFIED, NOT BUILT` lines.
- **A phase does not close while its change has an open task.**

**Order of the changes.**

- markup-gap-checks → crawl-outbound-checks.
- desktop-core-web-vitals → image-delivery-finding.
- Phase 2 no longer exists (D33). The number is kept so every "3a…6" reference in the plan and
  in the changes' `tasks.md` stays true.
- Phase 3 depends on phase 1, for four reasons:
  - both edit `hreflang-invalid.check.ts`;
  - phase 3 reads the input plumbing phase 1 adds to `ICheckInput`;
  - `CANONICAL_TARGET_BROKEN` defers to `CANONICAL_TO_HTTP` through phase 1's `isHttpTwin`
    (D36);
  - `CANONICAL_MISMATCH`'s second step-aside (D34) builds on its first (D32).
- Phase 5 depends on phase 4: the strategy-scoped replace and the catalogue's `strategy`.
- Phases 1 and 3 are closed (Status). Phase 4 depends on neither. It depends on the merged
  `lighthouse-checks` (the registry, migration `0015`, the Lighthouse replace), which is on the
  branch at `adc8887`.
- Within phase 4 the sub-phases are strictly ordered, 4a → 4b → 4c → 4d → 4e. 4b makes storage
  per strategy while still queueing mobile only (D45). 4c is the first sub-phase in which a
  desktop row exists.
- Phase 6 (harvest and archive) depends on all.

**Commit style:** `skills/claude-workflow/SKILL.md`. The branch is the current one.

### Phase 1 — Findings read from one page's markup (change `markup-gap-checks`)

After it, six page checks and one site check from the HTML the crawl already reads are in the
product. `HREFLANG_INVALID` no longer reports the self-reference, and `CANONICAL_MISMATCH` steps
aside for the http twin. The sitemap check keeps naming canonical contradictions (D15, D37). The
inclusion bar is a test.

#### 1a. The inclusion bar is executed

1. **Deliverables.**
   - `packages/contracts/src/domain/seo/industry-source-hosts.constant.ts`,
     `seo/inclusion-bar/inclusion-bar.util.ts` and `.test.ts` (all new); `src/index.ts`.
   - `seo/seo-issue-catalogue.test.ts`: the case over both catalogues.
2. **Pre-conditions.** `pnpm lint && pnpm typecheck && pnpm test` green on the branch. D1, D24.
3. **TDD points.**
   - Before: `inclusion-bar.util.test.ts` → "flags an entry above notice whose every source is
     industry" and "passes one with a first-party source beside the industry one". They fail with
     no module.
   - After: the catalogue case passes on today's catalogue. Today it can only fail if an existing
     entry already broke the bar, so its failing form is produced by the util test's synthetic
     catalogue, and the case is a guard for phase 1b onwards.
4. **Acceptance.** `pnpm --filter @app/contracts test:ci`; `pnpm typecheck`.
5. **Regression guard.** `KEYWORD_CANNIBALISATION` (warning, an Ahrefs source beside Google's
   canonical doc) must pass. That is the "beside" case, read off the real catalogue.
6. **Rollback.** Revert; nothing reads it.
7. **Commit points.** `feat(contracts): an industry-only check is at most a notice, as a test`.

#### 1b. Four checks from one page's head

1. **Deliverables.** For each of `CANONICAL_TO_HTTP`, `OG_URL_MISMATCH`,
   `META_DESCRIPTION_REPEATS_TITLE`, `BREADCRUMB_MISSING`:
   - a catalogue entry (owner crawl, severity per D2, `plain`, `hint`, `explanation`, `sources`,
     `skipReason` where it can skip);
   - `be/src/modules/page-analysis/services/checks/<kebab>/<kebab>.check.ts` + `.check.spec.ts`
     (new), registered in `checks.registry.ts`;
   - the `DESCRIBE` sentence in `fe/src/Core/Helpers/DescribeIssue/describeIssue.ts`, with a case
     in `describeIssue.test.ts`.

   One code per commit. With `CANONICAL_TO_HTTP`'s commit:
   - `_shared/http-twin.ts` (`isHttpTwin`);
   - `canonical-mismatch.check.ts` steps aside for the twin, and the `CANONICAL_MISMATCH`
     `skipReason` names it (D32).

   With `OG_URL_MISMATCH`'s commit, the development-host step-aside (D36).
2. **Pre-conditions.** 1a. D2, D16, D32, D35, D36.
3. **TDD points.** Before, per code: the spec's fail / pass / not-applicable cases from §10.7.
   They fail with no module, and then `pnpm typecheck` fails on `TCheckRegistry` once the
   catalogue entry exists without its check, which is the point.
   - `CANONICAL_TO_HTTP`: "fails an https page whose canonical is its own http:// twin", "passes
     an https canonical", "is not applicable on a page served over http", "is not applicable to an
     http canonical naming another address — that is CANONICAL_MISMATCH's".
   - `CANONICAL_MISMATCH` (existing spec, new case): "is not applicable to the page's own http
     twin — that is CANONICAL_TO_HTTP's". It fails before the change, because the twin is not the
     same document today.
   - `OG_URL_MISMATCH`: "fails og:url naming another page", "compares with the canonical when
     one is declared", "is not applicable without og:url", "is not applicable to a
     development-host og:url — that is DEVELOPMENT_HOST_REFERENCES's".
   - `META_DESCRIPTION_REPEATS_TITLE`: "fails a description equal to the title without its brand
     suffix", "passes a description that adds words". `META_DESCRIPTION_LENGTH` is unchanged, and
     both may fire on one page (D35).
   - `BREADCRUMB_MISSING`: "passes a Microdata BreadcrumbList", "passes a BreadcrumbList inside
     @graph", "fails a page declaring none".
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/page-analysis`
   - `pnpm --filter @app/contracts test:ci`
   - `pnpm --filter fe test:ci -- describeIssue PageSchemas`
   - `pnpm lint && pnpm typecheck && pnpm test`
5. **Regression guard.**
   - `checks.registry.spec.ts` → "emits only catalogued codes over every recorded page"
     (`:386-434`) recomputes its denominator bounds from the catalogue, so a new check that is
     wrongly always not-applicable fails its lower bound.
   - `ChecksSection.test.tsx` lists the new codes.
   - `CANONICAL_MISMATCH`'s step-aside would drop http-twin entries from
     `SITEMAP_LISTS_NON_INDEXABLE`. Sub-phase 1g closes that, and phase 1 does not close without
     it.
   - The README's "sixty-one checks"-type counts are re-read: `git grep -n -E
     "sixty-one|61 checks|50 page checks" -- README.md be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`.
6. **Rollback.** Revert the code's commit. A stored finding under a reverted code would fail the
   gateway's parse, so before rollback on a stack that has crawled with it, retire the code with
   `enabled: false` instead of deleting the entry (PAGE_ANALYSIS_MODULE's retirement rule).
7. **Commit points.**
   - `feat(page-analysis): a canonical pointing to plain HTTP from an HTTPS page`
   - `feat(page-analysis): og:url naming another URL than the canonical`
   - `feat(page-analysis): a meta description that only repeats the title`
   - `feat(page-analysis): no breadcrumb markup on a post`

#### 1c. A title still selling last year, in the owner's year

1. **Deliverables.**
   - `be/src/modules/clients/interfaces/client-record.interface.ts` (`IRunTarget.timeZone`), and
     `crawl-runs.repository.ts:277` joining `users`.
   - `check.interface.ts` (`ICheckInput.timeZone`), `make-check-input.ts` (default
     `'America/Toronto'`), and `crawl-run-executor.service.ts` (passes it).
   - `title-year-outdated/` check, constant and spec (new). The catalogue entry and `DESCRIBE`
     sentence.
2. **Pre-conditions.** 1b. D18, O1.
3. **TDD points.**
   - Before: `title-year-outdated.check.spec.ts` with §10.8's boundary cases, including the two
     Toronto-midnight instants. They fail with no module.
   - Before: `be/src/modules/clients/repositories/crawl-runs/crawl-runs.queue.int-spec.ts` (the
     worker-side methods' spec) → "the run target carries its owner's time zone".
     It fails with no field.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/page-analysis src/modules/crawl`
   - `pnpm --filter be test:db -- crawl-runs crawl`
   - `pnpm lint && pnpm typecheck && pnpm test`
5. **Regression guard.** TZ-003 ("the zone is the user's"): the spec passes the zone and never
   reads the process TZ. `be/src/core/bootstrap/tz` (imported first by `main.ts`) keeps the
   process in UTC, so a check reading `new Date().getFullYear()` would be wrong at the Toronto
   midnight cases. Those cases are the guard.
6. **Rollback.** Revert. The `timeZone` field is additive.
7. **Commit points.**
   - `feat(clients): a run target carries its owner's time zone`
   - `feat(page-analysis): a title that names a past year as current`

#### 1d. The missing self-reference is its own finding, reported once

1. **Deliverables.**
   - `hreflang-no-self-reference/` check and spec (new).
   - `hreflang-invalid.check.ts`: the `selfReferenced` arm, its detail field and its evidence line
     are removed, and its comment is updated.
   - `hreflang-invalid.check.spec.ts`.
   - The `HREFLANG_INVALID` catalogue copy without the self-reference clause; the new entry.
   - `DESCRIBE` for both. `HREFLANG_INVALID`'s sentence no longer reads `selfReferenced`.
   - `make-check-input.ts`'s comment at `:47-49` names the new code.
2. **Pre-conditions.** 1b. D14.
3. **TDD points.**
   - Before: `hreflang-no-self-reference.check.spec.ts` → "fails a set that never names this
     page". It fails with no module.
   - Before: `hreflang-invalid.check.spec.ts` → "passes a valid set that omits this page". It
     fails today: the arm exists.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- hreflang`
   - `pnpm --filter fe test:ci -- describeIssue`
   - `pnpm lint && pnpm typecheck && pnpm test`
5. **Regression guard.**
   - A finding stored by an earlier crawl under `HREFLANG_INVALID` with `selfReferenced: false`
     still renders. The sentence must not crash on the old details shape.
     `describeIssue.test.ts` → "renders an old HREFLANG_INVALID finding that still carries
     selfReferenced".
6. **Rollback.** Revert both commits together.
7. **Commit points.** `feat(page-analysis): a hreflang set that leaves out its own page, reported
   once`.

#### 1e. Posts that need JavaScript, said once per site

1. **Deliverables.**
   - `crawled-page.interface.ts` (`ISelectedItem.clientRendered`) and
     `post-selection.service.ts` (set at the JS skip, `false` elsewhere).
   - `site-check.interface.ts` (`IFetchedEntry.clientRendered`).
   - `crawl-run-executor.service.ts:264` (passes it).
   - `site-checks/content-checks.ts` (new) and the registry; `SITE_CHECK_CATALOGUE` entry.
2. **Pre-conditions.** 1a. D8.
3. **TDD points.**
   - Before: `post-selection.service.spec.ts` → "a client-rendered post stays skipped_listing, is
     no page, and carries clientRendered".
   - Before: `site-checks.registry.spec.ts` → "reports N of M posts that render with JavaScript,
     naming them", "counts the flag, not the reason text" (an entry with the flag and an edited
     reason still counts; one without the flag and the old reason does not), "is not applicable
     when no post was read".
   - Both fail with no field.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/crawl src/modules/page-analysis`
   - `pnpm --filter be test:db -- crawl`
   - `pnpm lint && pnpm typecheck && pnpm test`
5. **Regression guard.** CRAWL-007 (skipped candidates recorded with their reason) and CRAWL-008
   (status by count): `post-selection.service.spec.ts` in full and `crawl.e2e-spec.ts`. The skip
   reason string is unchanged, so the run log reads as before.
6. **Rollback.** Revert.
7. **Commit points.** `feat(site-checks): posts that render their content with JavaScript`.

#### 1g. The sitemap keeps naming canonical contradictions (moved from the dropped phase 2)

Written after 1b and before 1f, because it depends on `CANONICAL_TO_HTTP` existing. Its letter
follows 1f only so the existing references stay true.

1. **Deliverables.**
   - `site-checks.registry.spec.ts` → "names an entry whose page names another URL as
     canonical" (D15, the existing `CANONICAL_MISMATCH` branch at `sitemap-checks.ts:45-47`).
   - `site-checks.registry.spec.ts` → "names an entry whose canonical is its http twin" (D37).
   - `sitemap-checks.ts` `contradictionOf` reads a `CANONICAL_TO_HTTP` finding as it reads
     `CANONICAL_MISMATCH`.
   - The `SITEMAP_LISTS_NON_INDEXABLE` explanation is re-read and stays true as written: it says
     "name another URL as canonical", and the http twin is another URL.
2. **Pre-conditions.** 1b (`CANONICAL_TO_HTTP` and the `CANONICAL_MISMATCH` step-aside). D15,
   D32, D37.
3. **TDD points.**
   - After: the D15 case passes on first run, because the branch exists. What makes it fail is
     deleting the branch at `sitemap-checks.ts:45-47`. Do that locally once and watch it fail,
     then restore.
   - Before: the http-twin case fails after 1b. The twin page carries `CANONICAL_TO_HTTP`, not
     `CANONICAL_MISMATCH`, and `contradictionOf` does not read it yet.
4. **Acceptance.** `pnpm --filter be test:ci -- site-checks`; `pnpm lint && pnpm typecheck &&
   pnpm test`.
5. **Regression guard.** The other `SITEMAP_LISTS_NON_INDEXABLE` cases (`:218-264`) stay green.
6. **Rollback.** Revert both commits together with 1b's step-aside. Reverting this alone would
   silently drop http-twin entries from the sitemap check.
7. **Commit points.** `test(site-checks): the sitemap's canonical contradiction is pinned` ·
   `fix(site-checks): an http-twin canonical still contradicts the sitemap`.

#### 1f. Field audit of phase 1, and its record

1. **Deliverables.**
   - The tally (§14 protocol) for the six page codes and `CONTENT_NEEDS_JAVASCRIPT`, plus every
     `CANONICAL_MISMATCH` the twin step-aside removed, read to confirm it was a twin. Each wrong
     firing gets a fix with a spec from the site's markup, or `enabled: false`.
   - `PAGE_ANALYSIS_MODULE.md`: the tally, and the "What was considered and rejected" additions
     of D2's list with their reasons. `CANONICAL_CHANGED` is added there with D33's reason.
   - The §10.13 table, and the list of pairs checked and found not to duplicate, go into the
     module's overlap paragraph (`PAGE_ANALYSIS_MODULE.md:349-354`).
   - The stale sentence at `PAGE_ANALYSIS_MODULE.md:367-369` ("the catalogue — page and run
     scopes only — does not have yet") is replaced by a pointer to the site catalogue, which
     holds `SOFT_404` and the host checks.
   - The stale "Core Web Vitals … stay out" sentence at `:358-360` is corrected to "measured by
     PageSpeed, never from HTML timing".
2. **Pre-conditions.** 1a–1e and 1g. D12. A running stack with network access.
3. **TDD points.** Each wrong firing is turned into a failing spec from that site's markup before
   the fix.
4. **Acceptance.**
   - the §14 queries for the seven codes;
   - `git grep -n "Field audit of the Ahrefs-gap checks" be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`
     prints the heading, and the tally under it shows 0 wrong for every enabled code;
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`;
   - `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`.
5. **Regression guard.** The prior audit's live positives must still fire as recorded (the
   2026-10-09 section). The auditor re-reads them for the sites crawled again.
6. **Rollback.** A check that fails its audit is retired with `enabled: false`, not reverted
   (stored findings must stay readable).
7. **Commit points.**
   - `fix(page-analysis): <code> <what the audit found>` (one per defect, only if found)
   - `docs(page-analysis): the markup checks, audited on live sites; what was rejected and why`

### Phase 2 — dropped (D33)

This phase once stored each page's canonical (`pages.canonical_url`, `canonical_recorded`) and
added `CANONICAL_CHANGED`. Both are dropped. Every state a changed canonical leaves behind is
already reported by `CANONICAL_MISMATCH` or `CANONICAL_MISSING`, so the check could only ever
fire on a fix (D33). Its one surviving piece, the test pinning the sitemap's canonical branch
(D15), moved to sub-phase 1g.

The change `canonical-change-tracking` is deleted (`git rm -r
openspec/changes/canonical-change-tracking`). No migration is generated for `pages`. The
number 2 is kept so the later phase and sub-phase references stay true. No phase depends on it.

### Phase 3 — Links, canonical targets and hreflang answers, checked in the crawl (change `crawl-outbound-checks`)

After it, a crawl makes at most 300 status requests and 30 document reads in its own stage, all
before the transaction. Four checks read what came back, each stepping aside where an older
check reports the fact (§10.13). `CANONICAL_MISMATCH` steps aside for a broken target (D34).

#### 3a. A request for a status reads no body; a missing domain is named

1. **Deliverables.**
   - `undici-http-transport.spec.ts` (new case).
   - `site-http-client.ts` (`checkLink`, `readDocument`).
   - `infrastructure/remote-api/remote-failure-kind/` (new, with spec).
   - `be/eslint.config.mjs`: the check-purity block (D28), re-composing `DB_ACCESS_PATTERNS` and
     `LOGGER_RESTRICTION` as the file's header requires (`eslint.config.mjs:13-16`).
2. **Pre-conditions.** Phase 1 closed (1c/1d edit the files 3c–3e extend). D5, D28.
3. **TDD points.**
   - Before: "a zero-byte cap returns the head and frees the connection". It fails if
     `readCapped` drained the body (the ninth request would wait for a free connection past its
     timeout). VERIFY: with today's `readCapped` this may pass on first run. If so, the task
     closes `VERIFIED, NOT BUILT` with the test, as D5's warning is already met by
     `undici-http-transport.ts:101-107`.
   - Before: `remote-failure-kind.spec.ts` → "a lookup answering ENOTFOUND is nxdomain", "EAI_AGAIN
     is network", "a timeout is timeout". They fail with no module.
   - Before (lint): add a deliberate `import { SiteHttpClient } …` to one check file and see
     `pnpm --filter be lint` fail. Remove it.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/infrastructure/remote-api src/modules/crawl/services/site-http-client`
   - `pnpm --filter be lint`
5. **Regression guard.** REMOTE-001…004: `remote-api.core.spec.ts` in full. The User-Agent and the
   SSRF guard apply to the new methods unchanged, because they go through `get`.
6. **Rollback.** Revert. The methods are unused until 3b.
7. **Commit points.**
   - `feat(site-http-client): ask a URL for its status without reading its body`
   - `feat(remote-api): name a domain that does not exist`
   - `build(lint): checks cannot reach the network`

#### 3b. The outbound stage, its budgets and robots per host

1. **Deliverables.**
   - `crawl/constants/outbound-checks.constant.ts`, `services/outbound-checks/` (service, robots
     cache, specs).
   - `page-analysis/interfaces/outbound-facts.interface.ts`, `_shared/document-facts.ts` with its
     spec.
   - `run-stages.ts` (`'outbound'`), `run-step.interface.ts`, `run-pipeline.ts`
     (`emptyRunContext`).
   - `crawl-run-executor.service.ts` (stage; `analyse` passes `linkStatuses`); `crawl.module.ts`
     providers; `check.interface.ts` (`ICheckInput.linkStatuses`); `make-check-input.ts`.
   - `fixture-http-transport.ts` with its spec (the zero-cap rule, §14).
2. **Pre-conditions.** 3a. D4, D6, D11, D26, D30.
3. **TDD points.**
   - Before, `outbound-checks.service.spec.ts`: every case of I9, I10, I15, plus "builds a run
     page's outcome from its own fetch, without a request" and "orders by sitemap position, then
     document order". They fail with no module.
   - Before, `crawl-run-executor.service.spec.ts`: "runs the outbound stage after fetch and before
     analysis, outside the transaction".
   - Before, `fixture-http-transport.spec.ts`: "an unrecorded URL asked for its status only
     answers 200".
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/crawl src/infrastructure/remote-api`
   - `pnpm --filter be test:db -- crawl`
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
   - on the stack, after re-crawling a seed client:
     `docker compose logs be | grep '"Crawl run stages"' | tail -n 2` shows an `outbound` timing
     under 60 000.
5. **Regression guard.**
   - CRAWL-003 (the fence) and CRAWL-008 (status by count): `crawl-run-executor.service.spec.ts`
     and `crawl.e2e-spec.ts` in full.
   - `checks.registry.spec.ts`'s corpus test with empty facts.
   - `site-probe.service.spec.ts` (shares `SiteHttpClient`).
6. **Rollback.** Remove the stage entry from the pipeline list. Checks see empty facts and are
   not applicable.
7. **Commit points.**
   - `test(fixtures): an unrecorded status check answers 200, never the network`
   - `feat(crawl): an outbound stage — links and documents under a budget, robots per host`

#### 3c. `BROKEN_LINKS` and `LINKS_TO_REDIRECTS`

1. **Deliverables.**
   - `_shared/link-verdict.ts` (with spec) and `_shared/link-variants.ts` (moved from
     `internal-link-variants.check.ts`).
   - `broken-links/`, `links-to-redirects/` checks and specs.
   - The catalogue entries. The `BROKEN_LINKS` explanation states D3's rule.
   - `DESCRIBE` sentences.
2. **Pre-conditions.** 3b. D3, D19, D25, D29, D36.
3. **TDD points.**
   - Before, `link-verdict.spec.ts`: §10.1's table as `it.each`, and the explanation tie (I12).
   - Before, `broken-links.check.spec.ts`: I11's two cases, "fails an internal 500", "fails an
     external 410", "passes an external 403", "skips a link to this site's development host —
     that is DEVELOPMENT_HOST_REFERENCES's".
   - Before, `links-to-redirects.check.spec.ts`: "fails an internal link that redirects", "skips
     a link INTERNAL_LINK_VARIANTS reports", "skips a link to this site's development host — that
     is DEVELOPMENT_HOST_REFERENCES's", "ignores an external redirect".
   - All fail with no module.
   - `internal-link-variants.check.spec.ts` stays green after the move.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/page-analysis`
   - `pnpm --filter be test:db -- crawl`: in `crawl.e2e-spec.ts`, "stores BROKEN_LINKS and
     LINKS_TO_REDIRECTS for a post linking to a recorded 404 and a recorded 301".
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
5. **Regression guard.** `INTERNAL_LINK_VARIANTS` behaviour: its spec in full after the move.
6. **Rollback.** Revert, or `enabled: false` if crawled.
7. **Commit points.**
   - `refactor(page-analysis): link variants, shared`
   - `feat(page-analysis): broken links in the text — external only on 404, 410 or no domain`
   - `feat(page-analysis): links to this site that redirect`

#### 3d. `CANONICAL_TARGET_BROKEN`

1. **Deliverables.**
   - `_shared/canonical-target.ts` (`canonicalTargetProblemOf`) and its spec.
   - `canonical-target-broken/` check and spec; the catalogue entry; `DESCRIBE`.
   - `canonical-mismatch.check.ts` steps aside when `canonicalTargetProblemOf` returns a problem
     (D34). Its `skipReason` names the broken target too.
   - `sitemap-checks.ts` `contradictionOf` reads a `CANONICAL_TARGET_BROKEN` finding (D37).
2. **Pre-conditions.** 3b, 1b (`isHttpTwin`), 1g. D2, D11, D17, D34, D36, D37.
3. **TDD points.**
   - Before: §10.5's outcomes, each from an `IDocumentFacts` fixture. One case is built from a
     run page's own facts. Also "is not applicable to the http twin — that is
     CANONICAL_TO_HTTP's" and "is not applicable to a development-host target — that is
     DEVELOPMENT_HOST_REFERENCES's". They fail with no module.
   - Before, `canonical-mismatch.check.spec.ts`: "is not applicable when the target is broken —
     that is CANONICAL_TARGET_BROKEN's" fails, because CANONICAL_MISMATCH fails today.
     "Judges as before when the target was not read" passes, and guards the budget case.
   - Before, `site-checks.registry.spec.ts`: "names an entry whose canonical target is broken"
     fails once the step-aside lands, because the entry carries `CANONICAL_TARGET_BROKEN` and no
     `CANONICAL_MISMATCH`.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- canonical-target canonical-mismatch site-checks`
   - `pnpm --filter be test:db -- crawl`: the e2e case "a canonical naming a recorded 301 stores
     CANONICAL_TARGET_BROKEN and not CANONICAL_MISMATCH".
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
5. **Regression guard.** `CANONICAL_MISMATCH`, `CANONICAL_CONFLICT`, `CANONICAL_TO_HTTP`: their
   specs in full. `checks.registry.spec.ts`'s corpus test runs with empty facts, where every
   target is unread, so `CANONICAL_MISMATCH` must judge there exactly as before.
6. **Rollback.** Revert the step-aside, the sitemap read and the check together, or
   `enabled: false` on the check together with reverting the step-aside.
7. **Commit points.** `feat(page-analysis): a canonical whose target redirects, is broken,
   noindexed or canonicalised again` · `feat(page-analysis): a canonical mismatch steps aside for
   a broken target`.

#### 3e. `HREFLANG_NOT_RECIPROCAL`

1. **Deliverables.**
   - `hreflang-not-reciprocal/` check and spec; the catalogue entry; `DESCRIBE`.
   - `_shared/hreflang-code.ts`: `problemWith` moved out of `hreflang-invalid.check.ts:71-100`
     unchanged.
   - `hreflang-invalid.check.ts`'s comment and the catalogue comment at
     `seo-issue-catalogue.constant.ts:847-852` (a file `lighthouse-checks` has since moved to
     `catalogue/crawl/crawl-catalogue.constant.ts`) now point at the new code instead of saying
     reciprocity is not checked.
2. **Pre-conditions.** 3b, 1d. D2, D11, D36.
3. **TDD points.** Before: §10.6's cases, all failing with no module:
   - "fails an alternate that answers 200 and does not name this page";
   - "does not judge a redirected alternate";
   - "is not applicable when no alternate could be read";
   - "skips an alternate whose code HREFLANG_INVALID reports";
   - "skips a development-host alternate — that is DEVELOPMENT_HOST_REFERENCES's";
   - "is not applicable when the canonical names another URL — that is HREFLANG_INVALID's".

   `hreflang-invalid.check.spec.ts` stays green after the move.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- hreflang`
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
5. **Regression guard.** 1d's two hreflang specs.
6. **Rollback.** Revert, or `enabled: false`.
7. **Commit points.** `feat(page-analysis): hreflang alternates that do not link back`.

#### 3f. Field audit of phase 3, and the measured cost

1. **Deliverables.**
   - The tally for the four codes, plus each `CANONICAL_MISMATCH` the broken-target step-aside
     removed, read to confirm the target was broken.
   - The outbound timing (median, slowest) in `CRAWL_MODULE.md`, with the stage, budgets and
     robots-per-host rule.
2. **Pre-conditions.** 3a–3e. D12.
3. **TDD points.** As 1f.
4. **Acceptance.**
   - the §14 queries for the four codes and the duration grep;
   - the tally lines;
   - `git grep -n "outbound" be/src/modules/crawl/CRAWL_MODULE.md` prints the stage section;
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
5. **Regression guard.** As 1f. Also no run in the audit ends `failed` with a code it did not end
   with before. Compare `select status, error_code, count(*) from crawl_runs group by 1, 2`
   before and after (`crawl-runs.schema.ts:46`).
6. **Rollback.** As 1f. A stage that the audit shows too slow is tightened through its
   constants, with an `AMENDED` line.
7. **Commit points.**
   - `fix(page-analysis): …` (per defect)
   - `docs(crawl): the outbound stage, its budgets and what it costs a crawl`

### Phase 4 — Desktop Core Web Vitals (change `desktop-core-web-vitals`)

After it, every crawled page is measured on both devices. The Speed block switches between them,
and desktop findings count as issues. The pages list, the score and Lighthouse's verdicts stay
mobile (D42, D43). The claim keeps SPEED-014's turns (D44).

#### 4a. The catalogue knows two strategies

After it, the catalogue declares a device for every speed code and holds the six desktop codes.
Nothing writes them yet.

1. **Deliverables.**
   - Contracts (`packages/contracts/src/domain/`):
     - `page-speed/psi-strategy.enum.ts` (new, §3.2);
     - `seo/catalogue/issue-definition.interface.ts`: `IPageSpeedIssueDefinition` with a
       required `strategy` (§5, D39);
     - `seo/catalogue/page-speed/page-speed-catalogue.constant.ts`: `strategy: 'mobile'` and
       labels ending "on mobile" on the six entries (D48); six `CWV_*_DESKTOP` entries;
     - `seo/catalogue/issue-catalogues.constant.ts`: `TPageSpeedIssueCodeOf<S>`,
       `PAGE_SPEED_CODES_BY_STRATEGY`;
     - `page-speed/cwv-issue-codes.constant.ts`: keyed by strategy, and `TCwvIssueCode`;
     - `seo/seo-issue.interface.ts`: `TPageSpeedSeoIssueOf<S>`, `TCwvSeoIssue`, `TIssueDetails`
       over `TCwvIssueCode`;
     - `seo/seo-issue-catalogue.test.ts`; `src/index.ts`.
   - Backend: `be/src/modules/page-speed/services/cwv-issues/cwv-issues-of.ts` with its spec. Its
     one caller, `page-speed-executor.service.ts:125`, passes `'mobile'`.
   - Frontend: `fe/src/Core/Helpers/DescribeIssue/describeIssue.ts` with its test (six sentences;
     the `speed` helper's device word); every frontend test that asserts a CWV label.
2. **Pre-conditions.** `pnpm lint && pnpm typecheck && pnpm test` green at `adc8887`. D9, D39,
   D48.
3. **TDD points.**
   - Before, `seo-issue-catalogue.test.ts`: "splits the speed codes by strategy: six CWV codes
     each", "each CWV code's max is its metric's threshold for its band, on both strategies",
     "gives a desktop code its mobile twin's severity". They fail: `PAGE_SPEED_CODES_BY_STRATEGY`
     does not exist and `CWV_ISSUE_CODES` has no strategy level.
   - Before, `cwv-issues-of.spec.ts`: "a desktop metric outside the good band yields its desktop
     code". It fails: there is no strategy parameter.
   - Before, `describeIssue.test.ts`: "says 'on desktop' for a desktop code" and "says 'on
     mobile' for a mobile code". They fail: no desktop code, no device word.
   - Typecheck, seen failing once and restored: a `strategy` added to one crawl entry fails
     `pnpm typecheck` as an excess property, and one removed from a pageSpeed entry fails it as
     missing. This is I19's failing form.
   - After: "gives the PageSpeed worker exactly the six Core Web Vitals codes" (`:83-92`) is
     renamed "… the twelve Core Web Vitals codes, six per strategy" and lists twelve.
4. **Acceptance.**
   - `pnpm --filter @app/contracts test:ci`
   - `pnpm --filter be test:ci -- src/modules/page-speed`
   - `pnpm --filter fe test:ci -- describeIssue PageSchemas issueTypeOf`
   - `pnpm lint && pnpm typecheck && pnpm test`
   - `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`
5. **Regression guard.**
   - ANALYSIS-012's deposit (`PAGE_ANALYSIS_MODULE.md:580-582`) names "gives the PageSpeed worker
     exactly the six Core Web Vitals codes". The rename is recorded on task 1.2 of the change, so
     phase 6's deposit corrects the line. "Partitions the catalogue by owner" (`:69-81`) stays
     green unchanged.
   - `issueTypeOf.test.ts`: desktop codes are `speed`, because `issueTypeOf` reads
     `PAGE_SPEED_ISSUE_CODES`.
   - `issue-plain-copy.test.ts` holds the desktop copy to `PLAIN_COPY_LIMITS`.
   - The label change: `git grep -n -E "Contentful Paint (is|needs)|Next Paint (is|needs)|Layout
     Shift (is|needs)" -- fe/src be/src be/test` lists every reader of a CWV label; each is
     re-read.
6. **Rollback.** Revert. Nothing writes a desktop code yet, and the label change is copy only.
7. **Commit points.** `feat(contracts): two PageSpeed strategies, and the six desktop Core Web
   Vitals codes`.

#### 4b. One row per page and strategy, still measured on mobile only

After it, storage, the fence, the replace, the writer and every read are per strategy. The crawl
and the seed still queue mobile only (D45), so the product behaves exactly as before, and every
read is proven not to multiply a page before a second row can exist.

1. **Deliverables.**
   - `be/src/persistence/schema/tables/page-speed/page-speed.schema.ts` (§3.2), and the two
     generated files `be/drizzle/0016_*.sql` and `0017_*.sql` with drizzle-kit's `meta/`
     snapshot and journal entries.
   - `be/src/shared/page-speed-queue/page-speed-queue.constant.ts`: `PAGE_SPEED_QUEUED_STRATEGIES`
     (I30).
   - `be/src/modules/pages/`:
     - `interfaces/page-speed.interface.ts`: `IClaimedPageSpeed.strategy`, `TPageSpeedCompletion`
       (§7);
     - `repositories/page-speed/page-speed.repository.ts` and its int-spec (§7, §10.14);
     - `repositories/seo-issues/seo-issues.repository.ts` and its int-spec;
     - `services/page-speed-queue/page-speed-queue.service.ts` and its spec;
     - `services/page-speed-results/page-speed-results.service.ts` and its spec;
     - `repositories/page-list/page-list.repository.ts:141` and its int-spec;
     - `repositories/page-detail/page-detail.repository.ts:142`.
   - `be/src/modules/page-speed/services/page-speed-executor/page-speed-executor.service.ts` and
     its spec: the completion arm of `claim.strategy`.
   - `be/src/modules/issue-report/repositories/issue-report/issue-report.repository.ts:124` and
     its int-spec.
   - `be/test/explain/pages-list.explain.sql:33-41`.
   - Every test that inserts a `page_speed` row names a strategy:
     `page-list.repository.int-spec.ts:211`, the inserts of `page-speed.repository.int-spec.ts`,
     `be/test/e2e/page-speed.e2e-spec.ts`.
   - `be/src/seed/seed.ts:45` prints `pagespeed  N measurements queued`. A row is one
     measurement, not one page, so from 4c "pages" would overcount by two.
2. **Pre-conditions.** 4a. D9, D13, D22, D41, D42, D43, D44, D45.
3. **TDD points.** The int-specs cannot compile against a column that does not exist, so their
   first observed failure is the type error (as `lighthouse-checks` task 4.1 recorded). What
   makes each refusal case fail for the right reason afterwards is that it asserts the
   CONSTRAINT NAME in the error, not merely that the insert threw.
   - Before, `page-speed.repository.int-spec.ts`:
     - "holds one row per page and strategy" (`page_speed_pk`);
     - "deleting a page deletes both rows";
     - "refuses a row without a strategy" (NOT NULL);
     - "refuses a desktop row with a Lighthouse list or a category score"
       (`page_speed_lighthouse_mobile_only`);
     - "enqueue with both strategies queues both rows of a new page";
     - "re-queues a strategy measured exactly 24 h ago and leaves the other";
     - "claims a desktop row with its strategy";
     - "a stale attempt on the desktop row writes nothing to the mobile row of the same page and
       attempt number";
     - "a claim of a client's desktop row serves the client";
     - "within one client, due mobile rows are claimed before its desktop rows";
     - every existing case rewritten with a strategy, the fair-claim cases (`:471`, `:485`,
       `:499`) unchanged in what they assert.
   - Before, `seo-issues.repository.int-spec.ts`: "a desktop replace leaves the page's mobile,
     Lighthouse and crawl findings", "a mobile replace leaves its desktop findings".
   - Before, `page-list.repository.int-spec.ts`: "lists a page once, with its mobile summary and
     score, when both strategies are stored". It inserts a desktop row with different figures and
     a Lighthouse-free record. Run after the schema change and before the join names the
     strategy, it fails on two rows for one page, which is the defect D43 prevents.
   - Before, `issue-report.repository.int-spec.ts`: "returns each finding once when both
     strategies are stored, with its own strategy's measured_at". It fails the same way.
   - Before, `page-speed-results.service.spec.ts`: "a desktop completion writes its speed
     findings and never calls the Lighthouse replace". It fails: there is no desktop arm.
   - Before, `page-speed-queue.service.spec.ts`: "queues only the strategies
     PAGE_SPEED_QUEUED_STRATEGIES names". It fails: the repository takes no strategies.
   - Before, `page-speed-executor.service.spec.ts`: "a desktop claim completes the desktop arm
     with no Lighthouse record". It fails: the claim has no strategy.
4. **Acceptance.**
   - `pnpm db:generate`, then read `be/drizzle/0016_*.sql`. It holds exactly the five statements
     of §3.2 step 1 and nothing else. Drop `.default('mobile')` from the schema, `pnpm
     db:generate`, read `0017_*.sql`: exactly `ALTER COLUMN "strategy" DROP DEFAULT`. Then
     `pnpm db:migrate`.
   - `pnpm --filter be test:db -- page-speed seo-issues page-list issue-report`
   - `pnpm --filter be test:ci -- src/modules/pages src/modules/page-speed src/modules/issue-report`
   - `git grep -n "join page_speed" be/src`: every line names a strategy.
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
   - `docker compose up -d --build && curl -fsS http://localhost:8080/api/health`. Then
     `docker compose exec postgres psql -U tracker -d seo_tracker -c "select strategy, status,
     count(*) from page_speed group by 1, 2"` shows only `mobile` rows (D13). Re-crawl one seed
     client from the UI; the same query still shows only `mobile` rows (D45).
   - `docker compose exec -T postgres psql -U tracker -d seo_tracker <
     be/test/explain/pages-list.explain.sql`, then read the plan (§14 Performance).
5. **Regression guard.**
   - SPEED-003 (fence), SPEED-004 (current run only), SPEED-006 (whole or absent) and SPEED-014
     (turns): the existing int-spec cases, all with a strategy now.
   - PAGES-010/011: `page-list.repository.int-spec.ts` in full, including the statement count.
   - PAGES-016 (Lighthouse in the score): `be/test/e2e/page-speed.e2e-spec.ts` → "a Lighthouse
     finding counts among the issues, in the spread and in the score" must stay green through
     the join change. It is the check that `LIGHTHOUSE_SCORE_POINTS_LATERAL` still reads `ps`.
   - REPORT-005: `issue-report.e2e-spec.ts` → "reports a Lighthouse finding at each page it is
     on, never as a whole-site row".
6. **Rollback.** Not by editing migrations. Until 4c no desktop row exists, so a forward
   migration generated from a schema that restores `page_id` as the key loses nothing. After 4c
   it would first need the desktop rows and their findings deleted by hand, which is data. Say
   so in an `AMENDED` line if it is ever done.
7. **Commit points.**
   - `feat(db): a page_speed row per page and strategy — queue, fence, replace and reads per
     strategy`. One commit, because no smaller one is green: the key change breaks every
     `on conflict (page_id)` at runtime, and the NOT NULL column without a default breaks every
     insert at typecheck.
   - `test(explain): the pages list joins the mobile row by its key`
   - `feat(seed): the backfill counts measurements, not pages`

#### 4c. Google is asked for desktop, and the crawl queues it

After it, a crawl and a seed run queue both devices, and a desktop row is measured with
`strategy=desktop&category=performance`. Desktop findings appear among a page's issues and in the
report, each with its "on desktop" label and a sentence carrying its value, bound and source. The
Speed block still shows mobile only until 4d. That is a state a user can live with: no desktop
finding needs the block to be understood, and no screen says "mobile" beside one.

1. **Deliverables.**
   - `be/src/modules/page-speed/services/psi-client/psi-client.ts` and its spec (§7).
   - `page-speed-executor.service.ts`: passes `claim.strategy` to `runPagespeed`.
   - `be/src/modules/pages/services/page-speed-queue/page-speed-queue.service.ts` passes
     `PSI_STRATEGIES`, and `PAGE_SPEED_QUEUED_STRATEGIES` is deleted from
     `page-speed-queue.constant.ts` (D45).
   - `be/test/fixtures/record-pagespeed-fixtures.ts`: a target's `strategy?: 'desktop'`, recorded
     with `category=performance` only. `be/test/fixtures/pagespeed/url-field.desktop.json` is
     recorded with `node be/test/fixtures/record-pagespeed-fixtures.ts url-field.desktop` so
     nothing else is re-recorded. `page-speed-fixtures.spec.ts` pins its role: field data, no
     Lighthouse category.
   - `be/test/e2e/page-speed.e2e-spec.ts`: overrides per strategy (§14), new cases.
   - `be/src/seed/seed-runner/seed-runner.int-spec.ts`.
   - `fe/src/Modules/Issues/IssuesScreen.tsx:141` and `IssuesScreen.test.tsx` (§1.4).
   - The Info guide's "mobile strategy" sentences, if those files are committed by then (§12,
     VERIFY).
2. **Pre-conditions.** 4b. A PageSpeed key in the local `.env` for the recording. VERIFY: the
   user confirms one is there; the session never prints `.env`. D9, D13, D20, D42, D45.
3. **TDD points.**
   - Before, `psi-client.spec.ts`: "a desktop request asks for strategy=desktop and
     category=performance only, the key only in the header". It fails: there is no strategy
     parameter. The existing mobile case ("a mobile request asks for performance, seo and
     accessibility…") is SPEED-016's other scenario and stays as it is.
   - Before, `page-speed-queue.service.spec.ts`: "queues every strategy" replaces 4b's case. It
     fails while the constant says mobile.
   - Before, `page-speed.e2e-spec.ts`: "a crawl queues both strategies of each page", "a crawl
     queues both strategies; each measured row has its findings", "a desktop measurement leaves
     the page's Lighthouse findings, its score and its place in the list". They fail: no desktop
     row is queued.
   - Before, `seed-runner.int-spec.ts`: the existing "the backfill queues each current page once,
     and a second run queues none" becomes "… once per strategy …", and its count doubles. It
     fails while the backfill passes mobile only.
   - Before, `IssuesScreen.test.tsx`: the `active` line names both devices.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/page-speed src/modules/pages`
   - `pnpm --filter be test:db -- page-speed seed-runner`
   - `pnpm --filter fe test:ci -- IssuesScreen`
   - `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing.
   - `git grep -n "PAGE_SPEED_QUEUED_STRATEGIES" -- be` prints nothing.
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
   - `docker compose up -d --build`, re-crawl a seed client, then `docker compose exec postgres
     psql -U tracker -d seo_tracker -c "select strategy, status, count(*) from page_speed group
     by 1, 2"` shows `desktop` rows. Without a key they stay `queued` (SPEED-011).
5. **Regression guard.**
   - SPEED-008–012: `classify-psi-response.spec.ts`, `page-speed-rate-limiter.spec.ts` and
     `page-speed-worker.spec.ts` in full. The worker's API does not change: it hands the claim
     to the executor, and the claim now carries its strategy.
   - The e2e override pitfall: an un-overridden desktop URL answers 404 under the fixture
     transport (§14). The new e2e case catches it.
   - SPEED-012: the desktop URL, like the mobile one, carries no key. `psi-client.spec.ts`
     asserts it for both.
6. **Rollback.** Revert, then delete the desktop rows and their findings by hand
   (`delete from seo_issues where code = any(<the six desktop codes>)`, then `delete from
   page_speed where strategy = 'desktop'`). Without that step the reverted client, which asks for
   mobile, would measure the queued desktop rows as mobile. This is data, not schema, so it needs
   no migration, and it is the user's call to run.
7. **Commit points.**
   - `test(fixtures): a desktop PageSpeed answer, recorded`
   - `feat(page-speed): ask Google for desktop, and queue both devices`

#### 4d. The page shows both devices

After it, the detail carries a summary per device and the Speed block switches between them. The
checks section and the score explanation still read mobile (D49).

1. **Deliverables.**
   - Contracts: `packages/contracts/src/domain/pages/page-detail.interface.ts`
     (`pageSpeedByStrategy`, D21).
   - Backend (`be/src/modules/pages/`): `repositories/page-speed/page-speed-read.ts`
     (`pageSpeedColumns(alias)`); `repositories/page-detail/page-detail.repository.ts` (the `psd`
     join, `ICurrentPageRecord.pageSpeedByStrategy`); `services/page-read/page-read.service.ts`
     with its spec.
   - Frontend: `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` with its test;
     `fe/src/ViewModels/PageDetailViewModel/PageDetailViewModel.ts`;
     `fe/src/Modules/PageDetail/PageDetailScreen.tsx`;
     `fe/src/Modules/PageDetail/SpeedSection/SpeedSection.tsx` with its test.
   - e2e: `be/test/e2e/pages.e2e-spec.ts`, `be/test/e2e/page-speed.e2e-spec.ts`.
2. **Pre-conditions.** 4c. D21, D42, D49.
3. **TDD points.**
   - Before, `page-read.service.spec.ts`: "the detail carries a summary per strategy, null where
     never queued", "the score reads the mobile row whatever the desktop row holds". They fail:
     there is no field.
   - Before, `pages.e2e-spec.ts`: "the detail carries pageSpeedByStrategy". Before,
     `page-speed.e2e-spec.ts`: "every non-good desktop card has its desktop finding".
   - Before, `PageSchemas.test.ts`: "parses a detail with a desktop summary and a null one". It
     fails on the unknown key `pageSpeedByStrategy`.
   - Before, `SpeedSection.test.tsx`: "opens on Mobile"; "Desktop shows the desktop cards and its
     TTFB line"; "Desktop shows no SEO or accessibility caption"; "Desktop reads 'Not measured on
     desktop yet' for a page never queued on desktop"; "Mobile reads 'Measuring…' while Desktop
     reads 'In queue'"; "the key-rejected notice stands above both"; "switching makes no
     request". They fail: there is no switch.
   - No test is written for D49's "the Lighthouse date reads mobile": it cannot be got wrong.
     The switch is `useState` inside `SpeedSection`, so `PageDetailScreen` cannot see which
     device is shown, and once `pageSpeed` is gone from the detail `:121` and `:130` must name a
     key of `pageSpeedByStrategy` to compile.
4. **Acceptance.**
   - `pnpm --filter be test:ci -- src/modules/pages`
   - `pnpm --filter be test:db -- pages page-speed`
   - `pnpm --filter fe test:ci -- SpeedSection PageSchemas PageDetail`
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
   - `docker compose up -d --build`. Signed in (`curl -c c.txt …/api/auth/sign-in`), `curl -s -b
     c.txt http://localhost:8080/api/pages/<id> | grep -o '"pageSpeedByStrategy":{"mobile"'`
     prints the match. Then in a browser, a page's Speed block switches devices with no console
     error.
5. **Regression guard.**
   - PAGEDETAIL-011's three scenarios and PAGEDETAIL-013's four scenarios: `SpeedSection.test.tsx`
     in full.
   - PAGEDETAIL-009 and PAGEDETAIL-012: `ChecksSection.test.tsx` and `explainScore.test.ts`
     unchanged.
   - PAGELIST-008: `CwvBadges.test.tsx`. The list is still mobile.
6. **Rollback.** Revert contracts, backend and frontend together, in one commit.
7. **Commit points.** `feat(fe): the Speed block switches between mobile and desktop`.

#### 4e. Live: both devices drain and agree with Google

After it, the measured cost of desktop is written down where the next reader looks for it.

1. **Deliverables.** Facts in `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`:
   - the strategy per row and the two-step migration;
   - calls per crawl, two per page;
   - the drain time of the seed's backlog with both strategies;
   - the observed claim order (turns per user and client, mobile first within a client);
   - Lighthouse on mobile only.
2. **Pre-conditions.** 4d. A key in `.env`.
3. **TDD points.** None; this is a measurement.
4. **Acceptance.**
   - `docker compose up -d --build`, re-crawl a seed client, then `docker compose exec postgres
     psql -U tracker -d seo_tracker -c "select strategy, status, count(*), count(measured_at) from
     page_speed group by 1, 2"` shows `done` desktop rows.
   - `… -c "select count(*) from page_speed where strategy = 'desktop' and (lighthouse_judged is
     not null or seo_score is not null)"` prints 0. The CHECK makes anything else impossible,
     and this reads it on live data.
   - One URL's stored desktop LCP, INP and CLS are compared with pagespeed.web.dev (Desktop tab).
     Field values must match for the same CrUX window; lab values only close.
   - `docker compose logs be | grep -c AIza` prints 0.
   - `git grep -n "strategy" be/src/modules/page-speed/PAGE_SPEED_MODULE.md` prints the new
     section.
5. **Regression guard.** The mobile rows for the same pages are still measured and unchanged in
   number, and a page's `LH_*` findings count is the same before and after its desktop
   measurement (`select count(*) from seo_issues where page_id = <id> and code like 'LH\_%'`).
6. **Rollback.** Remove the key: rows stay queued, nothing is lost.
7. **Commit points.** `docs(page-speed): desktop measured live — calls, drain time and claim
   order`.

### Phase 5 — Lighthouse's image delivery as a finding (change `image-delivery-finding`)

After it, a mobile measurement whose image-delivery audit fails with at least 100 KiB of savings
stores `IMAGE_DELIVERY_INEFFICIENT`. The finding is a speed finding: it counts among the issues,
is shown at its page, and never moves the score (D47, D50). Nothing in the merged tree reports
the same fact (§10.13, D36, D50).

#### 5a. The audit's id and shape, read from a live answer

After it, two recorded answers carry the audit, and §10.12 states its real id and paths.

1. **Deliverables.**
   - `be/test/fixtures/record-pagespeed-fixtures.ts`: `KEPT_AUDITS` gains the image audit, and two
     targets `image-delivery-failing.json` and `image-delivery-passing.json` are added. They are
     mobile, with all three categories, as the app asks.
   - The two recorded answers, written by `node be/test/fixtures/record-pagespeed-fixtures.ts
     image-delivery-`, so no pinned answer is re-recorded.
   - `page-speed-fixtures.spec.ts` pins both roles: failing with savings ≥ 102 400, and passing
     or absent.
   - §10.12 amended in this plan to the real id, the failing rule and the savings paths; an
     `AMENDED during implementation:` line on task 1.1 of `image-delivery-finding`, even if the
     guess held.
2. **Pre-conditions.** Phase 4 closed: every task of `desktop-core-web-vitals` ticked but its
   archive step, which belongs to phase 6. A key. D10.
3. **TDD points.** None before. No assertion can be written before the answer is seen, as the
   prior plan's Phase 6 found for CWV. After: the `page-speed-fixtures.spec.ts` role cases.
4. **Acceptance.**
   - `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing.
   - `node -e "const a=require('./be/test/fixtures/pagespeed/image-delivery-failing.json');console.log(Object.keys(a.lighthouseResult.audits))"`
     lists the audit.
   - `pnpm --filter be test:ci -- extract-measurement extract-lighthouse page-speed-fixtures`
5. **Regression guard.** The existing fixture readers (`extract-measurement.spec.ts`,
   `extract-lighthouse.spec.ts`, `page-speed-fixtures.spec.ts`) stay green. The new targets are
   new files, and `KEPT_AUDITS` changes no existing file until it is re-recorded.
6. **Rollback.** Revert.
7. **Commit points.** `test(fixtures): PageSpeed answers that keep the image-delivery audit`.

#### 5b. The finding

After it, the finding is written, read, rendered and reported.

1. **Deliverables.**
   - Contracts:
     - `page-speed/image-delivery-measurement.interface.ts` (new, D23);
     - `seo/catalogue/page-speed/page-speed-catalogue.constant.ts`: the entry (§5);
     - `seo/seo-issue.interface.ts`: `TIssueDetails` maps it to `IImageDeliveryMeasurement`;
     - `issue-report/client-issue-report.interface.ts`: the `allPages` arm narrows to
       `TCwvSeoIssue` (I31);
     - `seo/seo-issue-catalogue.test.ts`: 13 codes; "and image delivery is mobile's"; "is a
       pageSpeed code" (I32).
   - Backend:
     - `be/src/modules/page-speed/services/extract-image-delivery/` (new);
     - `services/classify-psi-response/classify-psi-response.ts` and its spec (`imageDelivery`
       on `measured`, D46);
     - `services/speed-issues/` (new);
     - `services/page-speed-executor/page-speed-executor.service.ts` and its spec
       (`speedIssuesOf` in place of `cwvIssuesOf`);
     - `be/src/modules/issue-report/services/collapse-origin-findings/collapse-origin-findings.ts`
       and its spec (`isCwv`).
   - Frontend:
     - `fe/src/Core/Helpers/DescribeIssue/describeIssue.ts` and its test;
     - `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` and its test (`imageDeliverySchema`,
       CWV-only `speedVariants` and `pageSpeedIssueSchema`);
     - `fe/src/Gateways/IssueReportGateway/Validation/IssueReportSchemas.ts`.
2. **Pre-conditions.** 5a. D10, D23, D46, D47, D50.
3. **TDD points.**
   - Before, `extract-image-delivery.spec.ts`, reading both recorded files from disk: "reads the
     failing audit's savings and images, largest first, at most 10"; "is null for an answer
     without the audit"; "is null for an audit that does not parse"; "reads nothing outside its
     audit". They fail: there is no module.
   - Before, `speed-issues-of.spec.ts`: "raises IMAGE_DELIVERY_INEFFICIENT at 102 400 bytes, not
     102 399"; "not for a passing audit with savings"; "keeps the CWV findings of cwvIssuesOf
     unchanged"; "the desktop overload returns CWV findings only". They fail: there is no module.
   - Before, `classify-psi-response.spec.ts`: "an answer without the image audit is still
     measured"; "carries the image delivery of a failing answer".
   - Before, `page-speed-executor.service.spec.ts`: "a mobile measurement stores the image finding
     beside its CWV findings".
   - Before, `collapse-origin-findings.spec.ts`: "keeps IMAGE_DELIVERY_INEFFICIENT at its page,
     and folds origin-sourced desktop CWV codes into one row each".
   - Before, `PageSchemas.test.ts`: "parses an image-delivery finding; refuses one with 11
     images". Before, `describeIssue.test.ts`: "says how many KiB and how many images".
   - The existing `PageSchemas.test.ts:153` loop parses every `PAGE_SPEED_ISSUE_CODES` with CWV
     details. It fails once the entry exists, which shows the variant split is needed. It is
     rewritten over `CWV_ISSUE_CODES`' leaves.
4. **Acceptance.**
   - `pnpm --filter @app/contracts test:ci`
   - `pnpm --filter be test:ci -- src/modules/page-speed src/modules/issue-report`
   - `pnpm --filter fe test:ci -- describeIssue PageSchemas IssueReport`
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
5. **Regression guard.**
   - P8: `extract-measurement.spec.ts` unchanged and green. `extractMeasurement` is not edited.
   - `classify-psi-response.spec.ts` in full: every outcome other than `measured` is unchanged.
   - REPORT-005 and the whole-site rows: `issue-report.e2e-spec.ts` in full.
   - PAGES-013 (a speed finding never moves the score): `page-speed.e2e-spec.ts` → "a speed
     finding counts among the issues and leaves the score and the order unchanged", with an
     image-delivery finding in its fixture.
6. **Rollback.** Revert. On a stack that already stored the finding, `enabled: false` does not
   apply: it retires crawl codes only (`ACTIVE_ISSUE_CODES` filters `CRAWL_ISSUE_CODES`,
   `issue-catalogues.constant.ts:168-170`). So the retirement is removing the image arm from
   `speedIssuesOf` while keeping the catalogue entry, the details type and the schema variant,
   so stored findings still parse. The next mobile measurement of each page clears its finding.
7. **Commit points.** `feat(page-speed): images Lighthouse says could be 100 KiB lighter`.

#### 5c. Field audit of the image finding

After it, every live firing has been read against PageSpeed's own report.

1. **Deliverables.** The tally: every stored `IMAGE_DELIVERY_INEFFICIENT` on the audit sites is
   compared with pagespeed.web.dev's "Improve image delivery" (Mobile) for the same URL. It is
   recorded under "Field audit of the Ahrefs-gap checks" in `PAGE_ANALYSIS_MODULE.md`. The live
   audit id, the failing rule and "absence is no error" go in `PAGE_SPEED_MODULE.md`.
2. **Pre-conditions.** 5b. D12.
3. **TDD points.** As 1f: each wrong firing first becomes a failing spec built from that answer.
4. **Acceptance.**
   - `docker compose exec postgres psql -U tracker -d seo_tracker -c "select p.final_url,
     i.details_json from seo_issues i join pages p on p.id = i.page_id where i.code =
     'IMAGE_DELIVERY_INEFFICIENT'"` prints every firing.
   - `git grep -n "IMAGE_DELIVERY_INEFFICIENT" -- be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md be/src/modules/page-speed/PAGE_SPEED_MODULE.md`
     prints the tally and the audit facts.
   - `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`
5. **Regression guard.** As 1f.
6. **Rollback.** As 5b.
7. **Commit points.** `docs(page-speed): image delivery, audited against PageSpeed's own report`.

### Phase 6 — Harvest, archive, deposit (no change; plan-only)

1. **Deliverables.**
   - The harvest of §18 into the owning documents.
   - Each of the four changes archived (`/opsx:archive`), its headings rewritten into the `[ID]`
     form, and its MODIFIED blocks folded into `specs/` by hand. `desktop-core-web-vitals`
     modifies SPEED-001/002/005/007/014, PAGES-014, SEED-006 and PAGEDETAIL-011, none of which
     `lighthouse-checks` modifies, so the two fold in either order. Whichever is archived second
     re-reads the page-speed spec after the first fold, so SPEED-016's desktop scenario and
     SPEED-020 sit beside each other without contradicting.
   - Deposits.
   - This plan moved to `docs/_plans-archive/` with its header.
2. **Pre-conditions.** Phases 1–5 closed, every audit tally at 0 wrong.
3. **TDD points.** none.
4. **Acceptance.**
   - `pnpm exec openspec validate --specs`
   - `git grep -n "Requirement \[" openspec/specs` lists every new id exactly once.
   - `git grep -n "invariant: " -- '*.md'` lists every deposited id.
   - `git grep -rn "ahrefs-gap-checks" -- ':!docs/_plans-archive' ':!openspec/changes'` prints
     nothing.
5. **Regression guard.** No module document or skill links into `docs/_plans/`.
6. **Rollback.** An archive is reversed by moving the change back and restoring `specs/` from git.
7. **Commit points.**
   - `docs: harvest the Ahrefs-gap checks into their owners`
   - `docs(openspec): archive the four changes and deposit their requirements`
   - `docs(plans): archive ahrefs-gap-checks`

---

## 16. Risks

| # | Risk | The check that catches it |
| --- | --- | --- |
| R1 | Every recorded post's external links read "broken" under the fixture transport's 404 default | §14's zero-cap fixture rule and its spec. `crawl.e2e-spec.ts` turns red if it stops applying |
| R2 | The outbound stage makes crawls noticeably slower | 3f's measured `outbound` timings. The 60 s deadline bounds the worst case. The constants are the knob |
| R3 | Our own request rate earns 429s from the client's site, which D3 reads as broken internal links (O3) | 3f's field audit reads every internal `BROKEN_LINKS` firing. One false firing reopens O3 |
| R4 | A reader multiplies page rows by strategy after the PK change, or the score reads a desktop row | I22's int-specs on the list and the report, and the list's statement count; PAGES-016's e2e case. 4b runs them while no desktop row exists, with desktop rows inserted by the tests themselves. Before 4b closes: `git grep -n "join page_speed" be/src` |
| R5 | drizzle-kit mishandles the composite-PK change | 4b's acceptance reads both SQL files. §3.2's VERIFY |
| R6 | The image-delivery audit id or shape differs from the guess, or is renamed by a Lighthouse release | 5a reads it from a live answer. P8/I21 make a rename cost the image finding only, never the CWV measurement |
| R7 | `TITLE_YEAR_OUTDATED` fires on historical titles ("what happened in 2008") | 1f's audit (O1). One false firing reworks the pattern |
| R8 | `BREADCRUMB_MISSING` fires on a page whose breadcrumbs are RDFa only | 1f's audit (O7) |
| R9 | NXDOMAIN is not distinguishable from a temporary DNS failure in undici's error chain | 3a's `remote-failure-kind.spec.ts` drives the real guarded lookup. If the code is not surfaced, broken-by-nxdomain is dropped with an `AMENDED` line, and external links are broken only on 404/410 |
| R10 | PSI quota exhausted by the doubled calls | `PAGE_SPEED_MODULE.md` measured calls per crawl (4e). The 429 pause degrades rather than fails |
| R11 | A parallel worktree under `.claude/worktrees/` edits the catalogue or `page_speed` while phase 4 is open. At `adc8887` the only one there is `lighthouse-checks`, already merged | VERIFY before 4a: `git worktree list` and `git log main..<branch> -- packages/contracts/src/domain/seo/catalogue be/src/persistence/schema/tables/page-speed` for each. A conflict in a catalogue file is resolved by keeping both entries and re-running the contracts tests; a second migration on `page_speed` is regenerated after the merge, never hand-merged |
| R12 | The MODIFIED blocks do not fold against `[ID]`-form specs by tool | Phase 6 folds them by hand. `openspec validate --specs` checks the result |
| R13 | A step-aside makes an older check stop reporting a fact it reported before, with nothing reporting it instead (a canonical contradiction lost from the sitemap check) | §10.13 lists every step-aside with the check that keeps the fact. D37 and I26 cover the one older reader (`SITEMAP_LISTS_NON_INDEXABLE`) that reads `CANONICAL_MISMATCH` findings. Before 1b and 3d close: `git grep -n "CANONICAL_MISMATCH" be/src fe/src --` lists every other reader, each re-read |
| R14 | The catalogue grew since this plan was written (another session's `NO_IMAGES`, `NO_EXTERNAL_SOURCES`, `NO_SUBHEADINGS`, …), so a new check may meet one of them on a fact not listed in §10.13 | Before each new check's commit, read its rule against every catalogue entry touching the same element. A meeting found then gets a §10.13 row, a step-aside case and an `AMENDED` line |
| R15 | A desktop measurement clears the page's Lighthouse findings, because SPEED-017 says an answer without the categories removes them | I27: the CHECK, the completion's desktop arm, and the results-service case "never calls the Lighthouse replace"; 4c's e2e "a desktop measurement leaves the page's Lighthouse findings, its score and its place in the list"; 4e's live count |
| R16 | The desktop backlog starves: mobile rows of busy clients keep coming first | §10.14 orders mobile first only WITHIN a client; turns across users and clients are SPEED-014's. 4e records the drain time. O9 reopens the order |
| R17 | The Info guide (untracked at `adc8887`) keeps saying "mobile strategy" once desktop is measured | 4c's deliverable re-reads `git grep -n -i "mobile" -- fe/src/Modules/Info fe/src/ViewModels/InfoGuideViewModel` if the files are committed by then |
| R18 | A requirement id is reused: the desktop delta once allocated SPEED-014, which the fair claim now holds in `specs/` | D40 moved the per-device requirement to SPEED-020. Before each archive: `git grep -n "SPEED-0" openspec/specs openspec/changes` lists every SPEED id once per meaning |

---

## 17. Cross-workspace touchpoints

| Workspace | Changes | Ships with |
| --- | --- | --- |
| `packages/contracts` | inclusion bar; 10 crawl, 7 pageSpeed and 1 site entries; strategy enum; `IPageSpeedIssueDefinition.strategy`; `PAGE_SPEED_CODES_BY_STRATEGY`; `CWV_ISSUE_CODES` per strategy; `TCwvSeoIssue` and the narrowed `allPages` row; image-delivery details; `IPageDetail.pageSpeedByStrategy` | the backend writer and the frontend sentence or schema, in the same commit |
| `be` | checks; site check; outbound stage; `SiteHttpClient` methods; failure kind; ESLint block; two `page_speed` migrations (no `pages` migration, D33); per-strategy queue, claim, fence, replace and reads; PSI strategy; image delivery; the report's fold over CWV codes | — |
| `fe` | `DESCRIBE` sentences; `PageSchemas` variants and detail schema; `IssueReportSchemas`' whole-site row; Speed block switch; one sentence in Issues | the contracts change it parses |
| docker | none. Outbound requests go through the existing transport; no new env var | — |
| CI | none. `pnpm test:db` already runs int and e2e specs; no test reaches the network (§14 fixtures) | — |
| docs | `PAGE_ANALYSIS_MODULE.md`, `CRAWL_MODULE.md`, `PAGE_SPEED_MODULE.md`, `PAGES_MODULE.md`, `README.md`, `docs/decisions.md` | the phase that makes them true |

---

## 18. README and harvest

**The final README says** (`README.md:157-167` is the part that changes):

- The "site-level checks still missing" bullet loses "a sitemap that disagrees with what the
  crawl found". That has shipped as `SITEMAP_LISTS_NON_INDEXABLE` since before this work, and the
  bullet is stale today.
- The bullet keeps orphan pages and its reason. It gains: "links in the text are checked — 300
  per crawl, robots.txt honoured per host, and anything unchecked is said to be unchecked".
- The "Desktop Core Web Vitals, if a client asks" item is removed from "Not done, and next". A
  line under the PageSpeed decisions says both devices are measured, why mobile stays the list's
  badge, and that quota use doubled.
- The scoring paragraph's denominators ("100 out of 27 applicable checks and 100 out of 50",
  `README.md:178`) are re-read against the new catalogue size. VERIFY the numbers then.

**Harvest (before archiving), each fact to its owner:**

- `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`:
  - the new checks, with their audit tallies;
  - the inclusion bar (D1) and where it is executed;
  - D2's rejected list with every reason, verbatim in substance: empty `alt=""`, "content not
    updated for N months", internal-link counts, no images, no outbound links, generic image
    filenames (with O5's resolution), srcset/modern formats from markup, x-default, the
    Lighthouse SEO category, and the WAF probe with an AI-bot user agent;
  - why `HREFLANG_INVALID` lost its self-reference arm (D14);
  - `CANONICAL_CHANGED` in "What was considered and rejected", with D33's reason;
  - the step-asides of §10.13, and the pairs checked and found not to duplicate, in the
    module's overlap paragraph (`:349-354`);
  - why the link rule stops at 404/410/NXDOMAIN externally (D3);
  - the stale sentences fixed (1f);
  - the ANALYSIS-002 deposit line's count ("sixty-one") updated.
- `be/src/modules/crawl/CRAWL_MODULE.md`: the `outbound` stage (D4, D26), its budgets and
  deadline (D6, D11), robots per host, the measured duration (3f), and why there is no queue for
  link checks (D4's rejection).
- `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`: strategy per row (D9), the two-step migration
  (D22, D41), Lighthouse on mobile only and why a desktop answer never touches its findings
  (D42), the claim order per strategy (D44), the desktop drain time and calls (4e),
  `IMAGE_DELIVERY_INEFFICIENT` and why absence is no error (D10, P8, D46), why it is a pageSpeed
  code and not a Lighthouse one (D50), and the live audit id (5a).
- `be/src/modules/pages/PAGES_MODULE.md`: the list, the score and the Lighthouse column read
  mobile, the detail both (D21, D43, D49); the per-strategy seed backfill (D20). Its line 12 ("one
  row per page") and the PAGES-014 and SEED-006 deposits are rewritten.
- `be/src/modules/issue-report/ISSUE_REPORT_MODULE.md`: image delivery is never a whole-site row
  (D47), and desktop CWV origin findings fold per code.
- `docs/decisions.md`: D1–D50 condensed with their measurements.
- OpenSpec: after archive, the requirements of the four changes' deltas are deposited:
  - ANALYSIS-014…021, 023…027 into `PAGE_ANALYSIS_MODULE.md` (ANALYSIS-022 was allocated to the
    dropped `CANONICAL_CHANGED` and is never reused);
  - CRAWL-011…013 into `CRAWL_MODULE.md`;
  - REMOTE-005 into `practices/be/remote-api-core/SKILL.md`, beside REMOTE-002/003, where those
    already live (`page-speed-measurement` task 8.3);
  - the modified PAGES-014 into `PAGES_MODULE.md` (PAGES-015 was allocated to the dropped
    change and is never reused);
  - SPEED-015 and SPEED-020 (new), and the modified SPEED-001/002/005/007/014, into
    `PAGE_SPEED_MODULE.md`. SPEED-014's existing deposit gains the per-strategy pin (I29);
  - the ANALYSIS-012 deposit (`PAGE_ANALYSIS_MODULE.md:580-582`) renames its pinning test
    ("… the twelve Core Web Vitals codes, six per strategy", then thirteen codes);
  - the modified SEED-006 beside SEED-003;
  - PAGEDETAIL-011 (modified) where the prior plan's archive header placed the frontend ids
    (VERIFY there).

---

## 19. Out of scope

- **A queue and table for link checks.** D4 rejected it: a new owner, a pending UI, findings that
  change after the crawl, and a race with the next crawl. Link checks have neither Google's
  quota nor minute-long answers.
- **HEAD requests, or HEAD with GET fallback.** D5: CDNs and WordPress plugins answer HEAD with
  false 403/404.
- **Retrying a link check.** D6: no retries. One attempt in 5 s is the budget.
- **Analysing client-rendered posts as pages.** D8: that would cascade false `THIN_CONTENT`,
  `H1_MISSING` and `NO_INTERNAL_LINKS` and change the lifecycle.
- **Desktop columns in the same `page_speed` row.** D9: that breaks the whole-or-absent CHECK and
  the shared attempts.
- **A desktop badge on the pages list.** D21.
- **Lighthouse SEO and accessibility verdicts on desktop.** lighthouse-checks D16, applied by
  D42: Google indexes the mobile view, and a second set of verdicts would put two Lighthouse
  shares in one score.
- **A fourth catalogue owner for the desktop codes.** D39: readers that ask for the `pageSpeed`
  owner's codes (`issueTypeOf`, the report's fold, the schema variants) would silently miss
  them.
- **Image delivery in the score, or as a Lighthouse-owner code.** D50: the Lighthouse owner is
  scored, and speed never enters the score.
- **Backfilling the desktop queue by migration.** D13: migrations are never hand-written.
- **`CANONICAL_CHANGED` and storing each page's canonical.** D33: every state a changed canonical
  leaves is already reported by `CANONICAL_MISMATCH` or `CANONICAL_MISSING`. Without
  duplicating them the check could fire only on a fix (other → self).
- **Everything D2 rejected:** empty alt, staleness by age, link and image counts, generic
  filenames, markup-guessed image formats, x-default, the Lighthouse SEO category, the AI-bot WAF
  probe. The reasons are in §20 D2 and, after harvest, in `PAGE_ANALYSIS_MODULE.md`.
- **Reading RDFa** for breadcrumbs. O7 reopens it.

---

## 20. Open questions and the decision log

### Open questions

- **O1. `TITLE_YEAR_OUTDATED` patterns.** *Default:* the check fires on a 4-digit year below the
  current year in the owner's zone (Toronto for every seeded user), at the end of the title or
  after "in/for/в". The field audit (D12) decides the final patterns. *Reopens on* any false
  firing in the field audit.
- **O2. Base branch.** *Resolved:* the current branch `feat/issue-report-and-pagespeed`.
- **O3 — RESOLVED 2026-10-11 by D38.** Refusal statuses on internal links and canonical targets. D3 and D2 say "any 4xx/5xx"
  for internal links and canonical targets. The repository's sitemap check reads 401/402/403/429
  and a bot challenge as "this crawler was turned away", not as a broken page
  (`sitemap-checks.ts:17-26`). The outbound stage makes up to 2 concurrent requests per host, so
  a 429 from the client's own site would answer our request rate, not the link. *Default:* D3 as
  written. *Reopens on* any internal `BROKEN_LINKS` or `CANONICAL_TARGET_BROKEN` firing on a
  401/402/403/429/challenge that the audit judges wrong. The fix would be the sitemap check's
  refusal set, recorded as a new decision.
- **O4 — RESOLVED 2026-10-11 by D32 (superseded).** `CANONICAL_TO_HTTP` beside
  `CANONICAL_MISMATCH`. The default "both fire on an http canonical" is replaced: the http twin
  is `CANONICAL_TO_HTTP`'s alone, any other http address `CANONICAL_MISMATCH`'s alone.
- **O5 — RESOLVED 2026-10-11 by D31: keep.** `IMAGE_FILENAMES_GENERIC` and D2's rejected "generic image filenames". The check exists
  (`seo-issue-catalogue.constant.ts:678-693` when this was written, now
  `catalogue/crawl/crawl-catalogue.constant.ts`; `checks.registry.ts:109`). It already excludes the
  CDN- and platform-hashed names D2 gives as the reason, and reports only camera and placeholder
  names the author chose. *Default:* the check stays. D2's rejection is recorded as rejecting the
  broader Ahrefs form (any non-descriptive name). *Reopens on* the user saying the existing check
  is meant to be retired. Then it gets `enabled: false` with a new decision line.
- **O6. robots.txt fetches outside the budgets.** One fetch per external host is counted in
  neither the 300 nor the 30, only under the stage's concurrency, per-host bound and deadline.
  *Default:* as stated. *Reopens on* 3f's measured robots.txt count exceeding the link count on
  any audit site, or the stage hitting its deadline because of it.
- **O7. RDFa breadcrumbs.** The extractor reads JSON-LD and Microdata only (PAGE_ANALYSIS_MODULE
  "RDFa is not read"). *Default:* accepted. *Reopens on* one false `BREADCRUMB_MISSING` firing.
- **O8 — RESOLVED 2026-10-11 by D31: keep.** `IMAGES_NOT_INDEXABLE` and D2's rejected "srcset/modern formats from markup". The
  existing check judges indexability (srcset with no src; HEIC/TIFF), not delivery weight, so it
  is not what D2 rejected. *Default:* it stays. *Reopens on* the user saying otherwise.
- **O9 — RESOLVED 2026-10-11 by D51: mobile first.** The order of a client's two devices in the queue (D44). Within the client whose turn it
  is, every due mobile row is claimed before any of its desktop rows, because mobile feeds the
  score, the list's badge and Lighthouse's verdicts. The alternative is to interleave per page
  (page 1 mobile, page 1 desktop, page 2 mobile, …), which shows a page's both tabs sooner and
  delays the last page's score by about the same margin. *Default:* mobile first within a client.
  *Reopens on* the user asking for desktop figures sooner, or 4e's measured drain leaving desktop
  rows queued for more than a day on the seed's data.
- **O10 — RESOLVED 2026-10-11 by D51: rename.** The six mobile labels gain "on mobile" (D48). This changes the names a marketer
  already reads on the Issues screen and in the report. *Default:* rename, so the mobile and
  desktop rows of one metric are told apart wherever a label stands alone. *Reopens on* the user
  preferring the old labels, in which case only the desktop labels carry the device and the
  mobile ones stay as they are.

### Decision log (verbatim; append-only)

D1. Inclusion bar is two-tier: a check with an official source (Google Search Central, Lighthouse, a spec such as ogp.me) may have any severity; an industry-only recommendation (Ahrefs) is admitted only as `notice`, only after it passes field audit, and only if it does not contradict an earlier rejected decision or an existing check. Why: parity with Ahrefs while keeping the measurements that make the report trustworthy.

D2. Accepted list (14) as in Target, with severities: CANONICAL_TO_HTTP warning (Google consolidate duplicate URLs); OG_URL_MISMATCH notice (ogp.me); HREFLANG_NO_SELF_REFERENCE notice (Google localized versions); TITLE_YEAR_OUTDATED notice (Ahrefs); DESCRIPTION_REPEATS_TITLE notice (Ahrefs); BREADCRUMBS_MISSING notice (Google breadcrumb docs; jsonLd.types already extracted); CANONICAL_TARGET_BROKEN warning (Google canonicalization); sitemap non-canonical → extend SITEMAP_LISTS_NON_INDEXABLE (Google sitemaps); CANONICAL_CHANGED notice (Ahrefs); BROKEN_LINKS + LINKS_TO_REDIRECTS notice (Ahrefs); HREFLANG_NOT_RECIPROCAL warning (Google localized versions); CONTENT_NEEDS_JAVASCRIPT notice (Ahrefs/Vercel: AI crawlers don't run JS); IMAGE_DELIVERY notice (Lighthouse); desktop CWV same severities as mobile. Rejected, to be recorded with reasons in PAGE_ANALYSIS_MODULE.md "What was considered and rejected": empty alt="" (correct markup for decorative images per WCAG; parsed-page.interface.ts already documents '' as deliberate); "content not updated for N months" (pushes authors to bump dates, the very thing DATE_BUMPED_WITHOUT_CHANGES flags); internal link count 3–5 / no images / no outbound links (house style, same reason URL hygiene was rejected); generic image filenames like IMG_0696.jpg (Ghost, Next/image, Substack rewrite filenames to hashes; author cannot act); srcset/modern formats from markup (replaced by measured IMAGE_DELIVERY; guessing without CSS is why images-without-width/height was rejected); x-default (Google calls it optional); Lighthouse SEO category (duplicates our catalogue); WAF probe with an AI-bot user agent (Cloudflare verifies AI bots by IP; our spoofed-UA request would be blocked as a fake bot even when the real OAI-SearchBot is allowed — a finding on evidence we do not have, same reason ORPHAN_PAGE was rejected).

D3. Internal links: any 4xx/5xx = broken, a redirect is reported separately (LINKS_TO_REDIRECTS). External links: broken only on 404, 410, or nonexistent domain (NXDOMAIN); 401/403/429/999/5xx/timeouts are "could not check" and never reported. Rule must be written into the catalogue `explanation` so nobody later adds 403. Why: parity without false positives from anti-bot protection.

D4. Requests happen inside the crawl, in the fetch stage, after post selection and before analysis (all network before the persist transaction, per assertRunPipeline). Links from all pages are de-duplicated, checked with bounded concurrency, and handed to checks as a new `ICheckInput.linkStatuses` (map url → outcome); checks stay pure functions; results persist in the same transaction. The same mechanism serves CANONICAL_TARGET_BROKEN's out-of-run target and HREFLANG_NOT_RECIPROCAL's alternates. Rejected: a separate queue like PageSpeed (new table, worker, owner, pending UI, page issue set changing after the crawl, race with next crawl) — PageSpeed is queued because of Google's quota and minute-long answers, link checks have neither.

D5. Link check method: GET reading status and headers only, body closed immediately (must explicitly destroy the undici body or connections hang until timeout). Transport interface unchanged (IHttpRequest has no method field; no HEAD). Rejected HEAD→GET fallback: CDNs/WordPress plugins answer HEAD with false 403/404.

D6. robots.txt honoured for every host checked (one robots.txt fetch per external host, cached for the crawl; disallowed = "not checked"). Budget constants (tunables in a *.constant.ts): max 300 unique link URLs per crawl, concurrency 8, max 2 per host, timeout 5 s, no retries, stage deadline 60 s, up to 5 redirect hops. Anything unchecked → evidence says "checked N of M" so the report never implies the rest are fine.

D7. New columns `pages.canonical_url varchar NULL` and `pages.canonical_recorded boolean NOT NULL DEFAULT false`, written every crawl (declared canonical: head or Link header, fragment removed). `IPreviousCrawl` gains `canonical`; `findPreviousCrawlsForWorker` selects it. Pre-migration rows and first crawl → notApplicable. No backfill. The flag distinguishes "no canonical" from "crawled before the migration". Rejected: jsonb head snapshot (speculative storage), reconstructing from seo_issues (blind to self→other change).

D8. CONTENT_NEEDS_JAVASCRIPT is a SITE check (SITE_CHECK_CATALOGUE, notice). The skipped post stays skipped (post-selection.service.ts:182-188 behaviour unchanged); `IFetchedEntry` gains a structured `clientRendered: boolean` — never parse the `reason` text. Finding: "N of M posts render their content with JavaScript", URLs in evidence. Rejected: analysing such pages as pages (cascade of false THIN_CONTENT/H1_MISSING/NO_INTERNAL_LINKS, lifecycle change).

D9. Desktop CWV: `page_speed` primary key becomes `(page_id, strategy)`; two independent jobs per page; the migration sets existing rows to strategy='mobile'; 6 new catalogue codes CWV_*_DESKTOP (needed because seo_issues has unique index (page_id, code)); the Speed block gets a mobile/desktop switch in FE. PSI quota consumption doubles — accepted. Keep the "one row = one answer" comment true (update it to name the strategy). Rejected: desktop columns in the same row (breaks "measurement whole or absent" CHECK and shared attempts), deferring.

D10. IMAGE_DELIVERY, owner 'pageSpeed', notice, from the MOBILE response only: fires when Lighthouse marks the image-delivery audit failing AND total savings ≥ catalogue `min` = 100 KiB (measured-code pattern, details `{ value, min }` plus up to 10 images with url and savings). No new page_speed column; the finding lives in seo_issues like CWV issues. Audit absent from the response = "no data", never a measurement error (a Lighthouse rename must not break CWV extraction). The exact audit id and details shape must be verified against a live PSI response (as Phase 6 did for CWV) — make that an explicit task.

D11. Separate budget for HTML requests (canonical target outside the run, hreflang alternates): max 30 per crawl, on top of the 300 link checks; body read under the existing SITE_FETCH_LIMITS.htmlBytes; same robots/timeout rules.

D12. Completion bar per check: the 2026-10-09 field-audit protocol (run on live sites, read every firing against the live page); a check stays only at 100% correct firings, otherwise reworked or retired with `enabled: false`. Field audit also measures actual added crawl duration.

D13. Desktop measurement for existing pages appears at their next crawl (persist enqueues both strategies); the migration only changes the key, no queue backfill.

D14. (2026-10-11, derived by the planner from D1 and `hreflang-invalid.check.ts:102-160`; to be confirmed) `HREFLANG_INVALID` already fails a page whose alternates never name it (`selfReferenced`, with its own evidence line and catalogue copy). A new `HREFLANG_NO_SELF_REFERENCE` beside it would report one fact twice, which D1's "does not contradict … an existing check" forbids. So the self-reference arm moves out of `HREFLANG_INVALID` into the new code. `HREFLANG_INVALID` keeps invalid language/region codes and the canonical-elsewhere arm. Its catalogue `hint`, `plain` and `explanation` lose the self-reference clause. Rejected: keeping both (double counting in the score); dropping the new code (D2 accepts it, at notice).

D15. (2026-10-11, derived from D2 and `sitemap-checks.ts:45-47`; to be confirmed) `SITEMAP_LISTS_NON_INDEXABLE` already names an entry whose page names another URL as canonical: it reads the page's `CANONICAL_MISMATCH` finding. Its catalogue explanation already says so (`site-check-catalogue.constant.ts:93`). D2's extension is therefore VERIFIED, NOT BUILT. What is missing is a test: `site-checks.registry.spec.ts:218-264` pins redirect, 404 and noindex, not the canonical branch. The plan adds that test (2c).

D16. (2026-10-11, derived from the instruction "keep working names unless they collide with repo naming conventions"; to be confirmed) Three working names change. `BREADCRUMBS_MISSING` → `BREADCRUMB_MISSING`, beside the existing `BREADCRUMB_INVALID`. `DESCRIPTION_REPEATS_TITLE` → `META_DESCRIPTION_REPEATS_TITLE`, beside `META_DESCRIPTION_MISSING`/`_LENGTH`/`_DUPLICATE`. `IMAGE_DELIVERY` → `IMAGE_DELIVERY_INEFFICIENT`, because every code names a problem state (`TITLE_MISSING`, `HTML_NOT_COMPRESSED`) and "image delivery" names an audit. All other working names are kept.

D17. (derived from D4 and `seo-issue-catalogue.test.ts:94-101`) The four outbound checks are page-scoped. The outbound stage sees the whole run, resolves in-run targets from the run's own pages, and hands every page the same facts. So `RUN_ISSUE_CODES` and its pinned literal list are unchanged.

D18. (derived from the open question's "Toronto-time year" and TZ-003 "the zone is the user's"; to be confirmed) `TITLE_YEAR_OUTDATED`'s current year is the year in the client owner's time zone (`users.time_zone`). The run target carries it, and `ICheckInput.timeZone` hands it to the check. Every seeded user is in Toronto, so D's "Toronto-time year" holds for them. A hard-coded zone would contradict TZ-003 for any other user.

D19. (derived from D3's silence on external redirects; to be confirmed) `LINKS_TO_REDIRECTS` reports internal links only. D3 names a redirect separately for internal links and says nothing of external ones. An external redirect (http→https, a vanity domain, a link shortener) is the other site's arrangement, and the author's link still reaches the page.

D20. (derived from SEED-006 and D13; to be confirmed) The seed's backfill queues each current page once per strategy. A database seeded before desktop gets desktop rows on its next seed run. That is SEED-006 applied per strategy, an explicit command, not a migration backfill, which D13 rules out.

D21. (derived from D9, which names only the Speed block; to be confirmed) The pages list keeps the mobile measurement in its badges, and its `pageSpeed` is the mobile row. The detail carries `pageSpeedByStrategy: Record<TPsiStrategy, IPageSpeedSummary | null>` in place of `pageSpeed`. A `Record` makes a third strategy a compile error on every reader, rather than a field nobody reads.

D22. (derived from D9's "the migration sets existing rows to strategy='mobile'" and the repository rule that migrations are generated) `strategy` is introduced by two generated migrations. The first is NOT NULL DEFAULT 'mobile', which fills existing rows. The second drops the default, so an insert that omits the strategy is refused rather than silently measuring mobile.

D23. (derived from D10) `IMAGE_DELIVERY_INEFFICIENT` stores bytes. `value` is the total savings in bytes, `min` is 102 400 (100 KiB), and `images` holds at most 10 `{ url, savingsBytes }` entries, largest first. The frontend formats KiB.

D24. (derived from D1) "Industry-only ⇒ notice" is executed. `inclusionBarViolations` fails any entry above notice whose every source is on `INDUSTRY_SOURCE_HOSTS`, and a contracts test runs it over both catalogues. D1's other two conditions — field audit, and no contradiction with a rejected decision or an existing check — are not mechanical. They are held by D12's audit and by review (D14, D15, O5, O8 are that review).

D25. (derived from D3's "rule must be written into the catalogue explanation") The external-broken statuses live in one constant, `EXTERNAL_BROKEN_STATUSES = [404, 410]`, which `linkVerdictOf` reads. A test asserts that the `BROKEN_LINKS` explanation names each of them and states that 401, 403, 429, 5xx and timeouts are never reported. Adding 403 to the constant without rewriting the sentence fails it, and so does the reverse.

D26. (derived from D4 and D12; to be confirmed) The outbound requests run in a pipeline stage of their own, `outbound`, between `fetch` and `analysis`, not inside the `fetch` method. That is still after post selection and before analysis, which is what D4 constrains, and `assertRunPipeline` still holds. The stage gets its own entry in "Crawl run stages" timings, which is how D12's added crawl duration is measured.

D27. (derived from D7 and `pages.schema.ts`'s `varchar(2048)` URLs) A declared canonical longer than 2 048 characters is stored with `canonical_recorded = false`. Truncating it would report a change on the next crawl, and failing the write would abort the run's finalize.

D28. (derived from D4's "checks stay pure functions") ESLint forbids `src/modules/page-analysis/services/checks/**` and `services/site-checks/**` from importing `@infrastructure/remote-api/**` or `@modules/crawl/**`. Purity is then a lint error at the moment of the import, not a convention in a comment.

D29. (derived from P3 and `internal-link-variants.check.ts:14-31`; to be confirmed) `LINKS_TO_REDIRECTS` skips an internal link that `INTERNAL_LINK_VARIANTS` already reports (plain HTTP, the other www-variant, a tracking parameter). Such a link redirects because of the variant, and that check already says so. `variantsOf` moves to `_shared/link-variants.ts` so both read one predicate.

D30. (derived from D6, which sets the budget but not the order) When a crawl's content links exceed 300, the first 300 unique URLs are taken in pages' sitemap order, then each page's document order. Neither internal nor external links are favoured, so two crawls of an unchanged site check the same links.

D31. (2026-10-11, the user) D14–D29 are confirmed as written; their "to be confirmed" marks are superseded by this line. O5 and O8 are resolved as "keep": `IMAGE_FILENAMES_GENERIC` and `IMAGES_NOT_INDEXABLE` stay enabled, and D2's rejections are recorded as rejecting the broader Ahrefs forms (any non-descriptive filename; formats guessed from markup), not these checks. Work proceeds on the current branch `feat/issue-report-and-pagespeed`, starting with phase 1.

D32. (2026-10-11, the user: no new check may duplicate an existing one) CANONICAL_TO_HTTP fires only when the first declared canonical is the page's own http:// twin (same document once its scheme is https), and in exactly that case CANONICAL_MISMATCH is not applicable. An http canonical naming a different address is CANONICAL_MISMATCH's alone (CANONICAL_TO_HTTP not applicable). Supersedes O4. (Implemented by the main session in phase 1.)

D33. (2026-10-11, the user) CANONICAL_CHANGED is dropped and with it the whole of phase 2 and the change `canonical-change-tracking` (no pages.canonical_url/canonical_recorded migration, no IPreviousCrawl.canonical). Why: the current state is already reported — self→other by CANONICAL_MISMATCH, removal by CANONICAL_MISSING, other→other by CANONICAL_MISMATCH — so without duplicating them it could fire only on other→self, which is a fix, not a defect. Supersedes D7 and D27. Recorded in the rejected list with this reason. The D15 test (SITEMAP_LISTS_NON_INDEXABLE's canonical branch, old 2c) moves into phase 1 (`markup-gap-checks`, sub-phase 1g). The ids PAGES-015 and ANALYSIS-022, allocated in the dropped delta, are not reused.

D34. (2026-10-11, the user) When CANONICAL_TARGET_BROKEN fails, CANONICAL_MISMATCH steps aside (not applicable) for that page: the target being broken is the more specific finding. Both read the same outbound facts, so CANONICAL_MISMATCH gets access to them in phase 3, through the one shared predicate `canonicalTargetProblemOf`. A test pins it.

D35. (2026-10-11, the user's explicit choice) META_DESCRIPTION_REPEATS_TITLE and META_DESCRIPTION_LENGTH both stay even though a copied title is nearly always under 70 characters: length and content are two facts.

D36. (2026-10-11, derived and applied by review at the user's request) A new check steps aside where an older one reports the same fact. OG_URL_MISMATCH is not applicable when og:url names a development host (DEVELOPMENT_HOST_REFERENCES's). BROKEN_LINKS and LINKS_TO_REDIRECTS skip links to a development host (DEVELOPMENT_HOST_REFERENCES's), in addition to D29's variant skip. HREFLANG_NOT_RECIPROCAL skips alternates whose code HREFLANG_INVALID reports or whose host is a development host, and is not applicable when the page's canonical names another URL (HREFLANG_INVALID's canonical-elsewhere arm). CANONICAL_TARGET_BROKEN is not applicable when the canonical is the page's http twin (CANONICAL_TO_HTTP's, D32) and when the target is a development host. Each has a spec case named for the older check it defers to. Checked and found NOT to duplicate: BREADCRUMB_MISSING/BREADCRUMB_INVALID (exclusive); TITLE_YEAR_OUTDATED/DATES_INCONSISTENT (title year vs URL year); CONTENT_NEEDS_JAVASCRIPT (the post is never analysed); IMAGE_DELIVERY_INEFFICIENT vs LCP_IMAGE_LAZY_LOADED/CWV (opportunity vs measurement); desktop vs mobile CWV (different device data).

D37. (2026-10-11, derived by the planner from D32, D34 and `sitemap-checks.ts:45-47`; **to be confirmed**) SITEMAP_LISTS_NON_INDEXABLE names an entry "names <url> as canonical" from a CANONICAL_TO_HTTP or CANONICAL_TARGET_BROKEN finding as well as from CANONICAL_MISMATCH. Why: today it reads CANONICAL_MISMATCH alone, and D32 and D34 make CANONICAL_MISMATCH step aside for exactly those pages, so without this the sitemap check would silently stop reporting entries it reports today. That would be a lost fact, not a removed duplicate. Rejected: leaving the sitemap check as is (it would lose findings); computing the canonical in the site check from the page (a second copy of the canonical rules, free to drift).

D38. (2026-10-11, the outcome O3 named in advance, recorded by the field audit of phase 3) O3 reopened: moz.com and css-tricks.com answered the outbound stage's own requests with 429, and moz.com's checkout with 403. Internal links now read 401/402/403/429 as unknown, the sitemap check's refusal set (`REFUSAL_STATUSES` in `_shared/link-verdict.ts`). The same audit added three rules, each pinned by a spec from its site. An internal link that redirects off the site is judged as external (backlinko.com). Any answer reached through a third host is unknown (youtube.com via consent.youtube.com). Cloudflare's `/cdn-cgi/` addresses are not links (techcrunch.com). `INTERNAL_LINK_VARIANTS` leaves a dead link to `BROKEN_LINKS` (cossa.ru, under D32's one-fact rule). The tally is in `PAGE_ANALYSIS_MODULE.md`.

D39. (2026-10-11, derived by the planner from D9 and the registry `lighthouse-checks` merged, `catalogue/issue-catalogues.constant.ts`; **not confirmed by the user**) The six desktop CWV codes go in the pageSpeed owner's catalogue (`catalogue/page-speed/page-speed-catalogue.constant.ts`), not in a new owner. `IPageSpeedIssueDefinition`, today a bare alias of `ISeoIssueDefinition`, declares a required `strategy: TPsiStrategy`. `ICrawlIssueDefinition` and `ILighthouseIssueDefinition` have no such field, so `as const satisfies` refuses one on their entries as an excess property. `TPageSpeedIssueCodeOf<S>` and `PAGE_SPEED_CODES_BY_STRATEGY` are derived from the declarations. Why: the per-strategy replace needs each speed code to name exactly one device, and a type is the only place that cannot drift from the entries. Supersedes the earlier §5/§4a design, written before the registry existed, in which `ISeoIssueDefinition` became a union on an `owner` field. Entries no longer carry `owner`. Rejected: a fourth owner `pageSpeedDesktop`, because every reader keyed on the `pageSpeed` owner (`issueTypeOf`, `collapseOriginFindings`, the schema's speed variants, `PAGE_SPEED_ISSUE_CODES`) would silently miss the desktop codes.

D40. (2026-10-11, derived by the planner from `openspec/README.md` §3 "append-only, never reused" and commit `1e1fe1d`, which put SPEED-014 "users and clients take turns in the queue" into `openspec/specs/be/src/modules/page-speed/spec.md`; **not confirmed by the user**) The per-device requirement of `desktop-core-web-vitals` takes SPEED-020. SPEED-015 is `image-delivery-finding`'s, and SPEED-016…019 are `lighthouse-checks`'. `desktop-core-web-vitals` MODIFIES SPEED-014 instead, to say how turns are taken when a page has two rows (D44). Supersedes the delta's earlier allocation of SPEED-014 to "a page has one measurement per device", made before the fair claim landed. Two meanings under one id is the drift the convention exists to prevent.

D41. (2026-10-11, derived by the planner from D22 and AGENTS.md "never hand-write or hand-edit a migration"; **not confirmed by the user**) The two generated migrations are `0016` and `0017`, because `lighthouse-checks` generated `0015_modern_wrecker.sql`. The first also adds D42's CHECK. The numbers are drizzle-kit's and move if another migration lands first; the plan names them only to say which files to read. Supersedes "0015 and 0016" in the earlier proposal, tasks and §15.

D42. (2026-10-11, derived by the planner from `lighthouse-checks` design D16 and D9; **not confirmed by the user**) Lighthouse speaks for mobile only. The desktop request asks `category=performance` only (SPEED-016 already says so). The CHECK `page_speed_lighthouse_mobile_only` refuses, on a desktop row, any of `lighthouse_judged`, `lighthouse_not_applicable`, `lighthouse_failed`, `seo_score` and `accessibility_score`. D16 named the lists; the two category scores join them because the desktop request does not ask for those categories, so a value there could only be a writer's bug. The completion is a union on strategy whose desktop arm cannot carry a Lighthouse record and never calls `replaceLighthouseFindingsForWorker`. Why: SPEED-017 removes a page's Lighthouse findings when an answer lacks the categories, which every desktop answer does, so without this each desktop measurement would erase the page's mobile Lighthouse findings and move its score. TTFB, the visit shares and `lcp_breakdown_json` are per row, so a desktop row stores its own and the Desktop tab shows them; the SEO and accessibility captions appear on Mobile only. Supersedes nothing; applies D16.

D43. (2026-10-11, derived by the planner from D21, D42 and `lighthouse-checks` D9, `score-points.ts:43-54`; **not confirmed by the user**) Every join to `page_speed` names its strategy. The list's, the detail's and the score's joins name `strategy = 'mobile'`, so `LIGHTHOUSE_SCORE_POINTS_LATERAL`, which reads `ps`, reads the mobile row. The detail's desktop summary comes from a second, separate join (`psd`). The report joins the strategy of each finding's code. Why: once the key is `(page_id, strategy)`, a join by page id alone returns two rows per page, which lists each page twice and computes the score lateral per row. Supersedes nothing; makes D21 hold under the new key.

D44. (2026-10-11, derived by the planner from SPEED-014 (`1e1fe1d`, `page-speed.repository.ts:91-149`) and D9; **not confirmed by the user**) The claim takes one `(page_id, strategy)` row, and every fence (complete, fail, release) matches page, strategy and attempt. The `served` CTE stays per user and client across both strategies, so a desktop claim serves its client. Within the chosen client, mobile rows come before desktop rows: `d.strategy` is ordered after the two served-at keys and before `next_attempt_at`, and Postgres orders the enum by `PSI_STRATEGIES`' declaration order. Why: mobile feeds the score, the list's badge and Lighthouse's verdicts; desktop feeds one tab of the Speed block. The turns between users and clients stay exactly SPEED-014's. Open question O9 holds the alternative.

D45. (2026-10-11, derived by the planner from the work-order rule that every sub-phase is independently runnable, and D9; **not confirmed by the user**) Between sub-phases 4b and 4c no desktop row is queued. `PAGE_SPEED_QUEUED_STRATEGIES = ['mobile']` is what the queue service passes to the crawl's enqueue and the seed's backfill. 4c deletes the constant, and both pass `PSI_STRATEGIES`. The repository takes the strategies as an argument with no default, so its int-spec proves both strategies in 4b. Why: until 4c the client asks Google with `strategy=mobile`, so a queued desktop row would be measured as mobile and stored as the desktop measurement, with wrong `_DESKTOP` findings. Supersedes the earlier 4b, in which the enqueue upserted both strategies before Google could be asked for desktop.

D46. (2026-10-11, derived by the planner from D10, P8 and the classifier `lighthouse-checks` left, `classify-psi-response.ts:166-175`; **not confirmed by the user**) `extractImageDelivery(json)` is called by `classifyPsiResponse` beside `extractMeasurement`, `extractDiagnostics` and `extractLighthouse`. The `measured` outcome carries `imageDelivery: … | null`, and it is never a condition of `measured`, unlike the measurement and the diagnostics. Supersedes "the executor passes the answer to both extractors" in the earlier §7 and proposal: since `lighthouse-checks` the classifier parses the answer and the executor never sees the JSON.

D47. (2026-10-11, derived by the planner from D23 and the report's fold, `collapse-origin-findings.ts:21-50`; **not confirmed by the user**) `IMAGE_DELIVERY_INEFFICIENT` is always reported at its page and never folded into a whole-site row. It is a lab estimate about one page's images and has no `source`. The fold reads CWV codes only (`isCwv` over `TCwvIssueCode`), and the contracts' `allPages` row narrows to `TCwvSeoIssue`, so an image-delivery whole-site row does not compile. Desktop CWV findings from the site's data fold one row per code, as mobile ones do. Why: the fold today keys on "a pageSpeed code whose details say `origin`", which image delivery's details cannot say, so leaving it there would be a type error on day one or, with a cast, a silent never-folding branch. Supersedes nothing.

D48. (2026-10-11, derived by the planner from D9 and the catalogue's `label` being the issue's name on the Issues screen, the report and the detail; **not confirmed by the user**) The six mobile CWV labels gain "on mobile", and the six desktop labels end "on desktop", for example "Largest Contentful Paint is poor on mobile". The desktop entries' `plain` copy speaks of computers rather than phones, and their explanation of desktop visits, with their mobile twins' sources. The frontend sentence carries the same device word. Why: two codes labelled "Largest Contentful Paint is poor" would read as a duplicate wherever a label stands alone. No stored data names a label, so the rename is copy only. Open question O10 holds the narrower alternative (only desktop names its device).

D49. (2026-10-11, derived by the planner from D21, D42 and D43; **not confirmed by the user**) On the page detail, the checks section's Lighthouse column date and the score explanation read the mobile measurement, whatever the Speed block's switch shows. The switch is local state and requests nothing. A page with no desktop row reads "Not measured on desktop yet: this page was crawled before desktop measurement existed. The next crawl or seed run queues it." The "In queue" and "Measuring…" states of `3e4dc72` apply per strategy, each from its own row's status. Why: the Lighthouse verdicts the column shows come from the mobile answer (D42), so dating them by the desktop one would be false.

D50. (2026-10-11, derived by the planner from D10's "owner 'pageSpeed'", D36 and the registry's `scored` flag; **not confirmed by the user**) `IMAGE_DELIVERY_INEFFICIENT` is a pageSpeed-owner code: unscored, not a check, in no counterpart group. It is not a Lighthouse-owner code, though Lighthouse computes it. The Lighthouse owner is scored and holds SEO and accessibility audits with category weights (`lighthouse-checks` D4, D14), and a performance opportunity in the score would contradict "speed never enters the score". Checked under D36 at `adc8887`, nothing reports the same fact. The 66 Lighthouse entries are SEO and accessibility audits; `LH_IMAGE_ALT`, `LH_INPUT_IMAGE_ALT` and `LH_SVG_IMG_ALT` judge alternative text. No crawl check judges image weight or format. The stored speed diagnostics (`extractDiagnostics`: TTFB, visit shares, `lcp-breakdown-insight`) read no image audit. Supersedes nothing; restates D10 for the registry.

D51. (2026-10-11, the user's explicit choice) D39–D50 are confirmed as written. O9 is resolved as its default: within the client whose turn it is, mobile rows are claimed before desktop rows (D44). O10 is resolved as its default: the six mobile CWV labels gain "on mobile" and the desktop ones end "on desktop" (D48).
