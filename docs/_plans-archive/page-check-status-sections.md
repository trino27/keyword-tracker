# Per-check status and an explained score

Today the page detail asserts one number about the catalogue: "16 of 18 checks passed". It does
not say WHICH 16, nor why the other two were left out, nor what the number is allowed to claim.
This work adds two sections to the PageDetail screen. **Checks** lists every catalogue check with
its status — passed, failed, not applicable, or added after the last crawl — and names the reason
for each not-applicable one; the details of the failures stay in the existing **SEO issues**
section below, which keeps its severity ordering. **How this score is calculated** shows the
arithmetic on this page's own numbers, explains the equal weighting, the denominator and the
Lighthouse bands, and states plainly what the score is not allowed to claim. For the first of
those to be true rather than plausible, the crawl begins recording the outcome of every code: two
disjoint array columns on the `pages` row, written by the same upsert that writes the counters.

**Status:** executed, 2026-10-04. Phase 1 shipped whole; phase 2 was withdrawn, and D9 at the
foot of the decision log says why. §15's phase 2 and §16's R3 and R7 are kept as written, because
a plan records the intended future it was approved as, not a tidied one.
**Branch:** `feat/page-check-status-sections` (based on `fix/keyword-extraction-accuracy`)
**Changes:** page-check-status-sections, page-checks-required

## How to read this

Present tense describes the intended state, not the current one. Names marked **new** do not exist
yet; everything else was read in the tree while this was written and is cited `path:line`, and
anything that could not be verified is written as `VERIFY:` rather than asserted. §1–§12 are the
specification; §13–§14 say what pins it; §15 is the sequence, and each change's `tasks.md` is
**generated from §15** and corrected through this document, never beside it. The requirement-id
convention, the delta heading form, the harvest rule and the task vocabulary are owned by
`openspec/README.md` and `openspec/config.yaml` and are not restated here.

---

## 1. User-visible behaviour

### 1.1 Pages (`/pages`) — unchanged

Nothing on the list changes: not the columns, not the score, not the order (D8). This is stated
rather than omitted because the list's `order by` is the one expression on the screen this work
could plausibly have touched, and it is deliberately untouched.

### 1.2 Page detail (`/pages/:pageId`)

The screen keeps its header, its KPI cards and its position history. Two sections are inserted
between the history and **SEO issues**, in this order:

**Checks.** A heading, a subtitle, a row per catalogue check, and — when something failed — a
closing line.

- The subtitle reads `16 judged · 2 not applicable`, listing only the non-zero groups in the
  order judged · not applicable · not yet checked.
- Each row carries a status marker and the check's catalogue `label`, in catalogue order. The
  four statuses read: **Passed**, **Failed**, **Not applicable**, **Not yet checked**.
- A not-applicable row carries its reason in dimmed text, one static sentence per code:
  - TITLE_LENGTH — "No title to measure."
  - META_DESCRIPTION_LENGTH — "No description to measure."
  - CANONICAL_MISMATCH — "No canonical to disagree with."
  - IMAGES_MISSING_ALT — "The page has no images."
  - HEADING_SKIP — "Fewer than two headings — no outline to judge."
- A not-yet-checked row carries "Added after this page was last crawled."
- When at least one check failed, the section closes with "Details for the 2 failed checks are in
  SEO issues below." When none failed the line is omitted: it would point at an empty section.
- A page whose crawl predates the recording (phase 1 only) shows no rows and no subtitle, only
  "Re-crawl this page to see each check."

**How this score is calculated.** Four paragraphs, the first computed from this page's numbers:

1. "16 of the 18 checks that applied to this page passed. 100 × 16 ÷ 18 ≈ 88.89, rounded half-up
   to 89."
2. "Every check counts the same. Weighting by severity would invent a model of search ranking that
   nobody can justify; Lighthouse weights its SEO audits equally for the same reason. Severity
   decides how this screen reads, not the arithmetic."
3. "The denominator is the checks that could be judged on this page. A check that could not run —
   no images to look at, no title to measure — is left out rather than passed, so the page is
   neither rewarded nor punished for it."
4. "49 and below is poor, 50–89 average, 90 and up good — Lighthouse's published thresholds,
   borrowed so a number you have seen before reads the same here. What the score says: this page
   has no obvious technical defects. It is not a traffic forecast, not a comparison with a
   competitor, and not a judgement of the writing."

**One deviation from the approved copy, and its reason.** The interview's paragraph 1 read
"= 88.9, rounded half-up to 89". One decimal is not safe for every denominator: a page with 1 of
16 checks passed computes 100 × 1 ÷ 16 = 6.25, which renders as "6.3" at one decimal and then
"rounded half-up to 6" — the screen would show a number rounding DOWN from a value printed above
it. The quotient is therefore rendered to at most two decimals with trailing zeros stripped, and
prefixed `≈` when it does not terminate there (§10.4). O2's licence to revise the copy against the
real screen covers it; O4 records it so the user can veto.

**SEO issues** below is untouched: same severity grouping, same sentences, same `pagesAffected`
line (D6).

---

## 2. Principles

Derived from the decision log (§20). When this plan forgot something, resolve it with these.

- **P1 — a fact of one fetch is written by the statement that writes the row.** (D1) So the
  skipped-code set goes into the same upsert as the counters it must agree with, never into a side
  table and never into a second pass.
- **P2 — remove the special case instead of handling it.** (D4) So a code that did not exist at
  that crawl gets a fourth status rather than a banner over a table that lies about it.
- **P3 — a constraint that breaks old rows when the catalogue grows is not written.** (D2, D4) So
  no CHECK ties an array to the catalogue's size, and no `pgEnum` holds the codes; the
  union-is-the-catalogue property is pinned at the writer by a test instead.
- **P4 — ambiguity is resolved where the evidence is.** (D3) `checks_judged` is on the backend, so
  the status is composed on the backend; the payload carries codes and statuses, never labels,
  hints or thresholds.
- **P5 — a constant is not paid for per row.** (D7) The skip reason does not vary by page, so it
  lives in the shared catalogue beside `label` and `hint`.
- **P6 — an enumeration with the failures removed stops answering its question.** (D6) So two
  sections: the Checks list enumerates, SEO issues explains, and the severity ordering that this
  feature could most easily have broken is not touched.
- **P7 — a migration never manufactures a fact that was not observed.** (D5) The columns arrive
  nullable; null reads as "this crawl predates the recording", never as "nothing applied"; the
  tightening waits for the re-crawl.
- **P8 — a stored count is not re-derived from today's catalogue.** (D8) A page crawled under 18
  checks and read under 20 would claim what its crawl never saw, so `checks_applicable` and
  `checks_failed` stay stored and the list's ordering expression is untouched.

---

## 3. Data model

One table changes: `pages`, at `be/src/persistence/schema/tables/pages/pages.schema.ts`. It
already carries `checksApplicable` and `checksFailed` as `smallint` (`pages.schema.ts:56-57`) with
two CHECK constraints (`:73`, `:75-78`). No array column exists anywhere in the schema today;
`jsonb` is used once (`seo_issues.details_json`) and `pgEnum` four times.

```ts
// What the crawl judged, and what it could not, as of that crawl — their union is the
// catalogue that ran. Written by the same upsert as the counters (P1), because
// applicability is only knowable while the parsed page is in hand: this row holds no
// canonical, no images and no headings and cannot answer the question later.
//
// varchar(64), not a pgEnum: it mirrors seo_issues.code, whose own comment says the set
// grows with new rules. An enum array would have to be ALTERed in lockstep with the
// catalogue and would refuse a retired code that an old row legitimately still holds.
//
// Nullable, and only until every client has been re-crawled (phase 2). Null means "this
// crawl predates the recording" and NEVER "no check applied" — the screen says so in
// words rather than rendering a verdict nobody observed (P7).
checksJudged: varchar('checks_judged', { length: 64 }).array(),
checksNotApplicable: varchar('checks_not_applicable', { length: 64 }).array(),
```

Constraints added in the same table definition:

```ts
// Both or neither. Without this the reader has a third state — judged recorded, skips
// not — that means nothing, and every consumer would have to invent an answer for it.
check(
  'pages_checks_arrays_together',
  sql`(${t.checksJudged} is null) = (${t.checksNotApplicable} is null)`,
),
// The counter-to-array tie. checks_applicable is the score's denominator and the list's
// sort key; a row whose array disagrees with it would show one number and explain another.
check(
  'pages_checks_judged_counter',
  sql`${t.checksJudged} is null or ${t.checksApplicable} = cardinality(${t.checksJudged})`,
),
// Disjoint: a code cannot have been both judged and skipped by one pass.
check(
  'pages_checks_disjoint',
  sql`${t.checksJudged} is null or not (${t.checksJudged} && ${t.checksNotApplicable})`,
),
// Elements distinct, non-null and non-empty (D2). A duplicate would inflate
// cardinality(), and the counter CHECK above would then happily accept an inflated
// checks_applicable — a score that divides by a denominator the crawl never reached.
check('pages_checks_judged_clean', sql`array_is_clean(${t.checksJudged})`),
check(
  'pages_checks_not_applicable_clean',
  sql`array_is_clean(${t.checksNotApplicable})`,
),
```

**Why a function, and not an inline expression.** PostgreSQL refuses a subquery inside a CHECK
("cannot use subquery in check constraint"), and element-distinctness of an array needs `unnest`,
which is a subquery. The predicate therefore lives in an IMMUTABLE SQL function, created by a
**custom** migration generated with
`pnpm --filter be exec dotenv -e ../.env -- drizzle-kit generate --custom --name check_array_helpers`
— the same supported path that produced `be/drizzle/0005_enable_pg_trgm.sql`, whose first line is
the generator's own `-- Custom SQL migration file, put your code below! --`. The AGENTS.md
prohibition on hand-written migrations does not cover it, because the tool generates the file and
its journal entry and only the body is written. The `dotenv` wrapper matches the `db:generate`
script (`be/package.json:18`): `drizzle.config.ts:8` reads `process.env.DATABASE_URL`.

```sql
-- A CHECK may not contain a subquery, and element-distinctness needs unnest.
create or replace function array_is_clean(codes varchar[]) returns boolean
language sql immutable parallel safe as $$
  select codes is null
      or (array_position(codes, null) is null
          and not ('' = any(codes))
          and cardinality(codes) = (select count(distinct c) from unnest(codes) c));
$$;
```

Known limit, stated so nobody over-trusts it: a CHECK calling a user-defined function is validated
when a row is written, and changing the function later does not re-validate existing rows. It
makes the wrong write impossible, not the wrong function.

**Migration numbering.** Latest is `0007_numerous_triton`. The function must exist before the
CHECK that calls it, and a custom migration does not touch the Drizzle snapshot, so the order is
`0008_check_array_helpers` (custom, function only), then `0009_<generated>` (columns + five
CHECKs) in phase 1, then `0010_<generated>` (NOT NULL + tightened CHECKs) in phase 2. This revises
the inventory's expectation of 0008/0009.

---

## 4. Invariants and their enforcement

| # | Invariant | Mechanism |
| --- | --- | --- |
| I1 | A judged code and a skipped code are disjoint sets on one row | CHECK `pages_checks_disjoint` |
| I2 | `checks_applicable` equals the number of judged codes | CHECK `pages_checks_judged_counter` |
| I3 | Neither array holds a duplicate, a null element or an empty string | CHECK `pages_checks_judged_clean`, `pages_checks_not_applicable_clean`, via `array_is_clean` |
| I4 | A row records both arrays or neither | CHECK `pages_checks_arrays_together` |
| I5 | The union of the two arrays is exactly the catalogue that ran | the single loop over `SEO_ISSUE_CODES` in `evaluateSeoRules` is the only writer, plus a test over the fixture corpus. **Not a constraint, by P3**: any CHECK naming the catalogue's size breaks every old row the day a check is added |
| I6 | A re-crawl overwrites both arrays rather than merging | the `onConflictDoUpdate` `set` clause at `pages.repository.ts:48-68` names both columns, like the counters at `:63-64`; pinned by an int-spec |
| I7 | Every code that can be skipped declares a skip reason | `TConditionalIssueCode` is derived from the presence of `skipReason` in the catalogue (**new**, mirroring `TMeasuredIssueCode` at `measured-issue-codes.constant.ts:11-21`), and a backend test asserts the registry's skipped set equals `CONDITIONAL_ISSUE_CODES` |
| I8 | A status is one of exactly four values on both sides of the wire | `TPageCheckStatus` in `@app/contracts` (**new**); `z.enum(PAGE_CHECK_STATUSES)` in the gateway; typecheck |
| I9 | The frontend never decides a status | `IPageCheck` carries `status`; the composition lives in `be` and the FE has no access to `checks_judged`. Pinned by review and by the absence of any catalogue-membership logic in `summariseChecks` |
| I10 | The rendered rows are in catalogue order | the composition iterates `SEO_ISSUE_CODES`; the component renders the array as given and never sorts |
| I11 | A code stored in an array but no longer in the catalogue renders nothing | the composition iterates the CATALOGUE and only asks membership of the arrays; a retired code is never asked about |
| I12 | The pages list's ordering expression is unchanged | `page-list.repository.ts:131-133` is not edited; pinned by the existing order-by tests |
| I13 | The score shown and the arithmetic shown are the same number | `explainScore` takes the same `IPageScore` the badge takes and recomputes nothing but the display of the quotient |

---

## 5. Wire contract

Everything below crosses `@app/contracts` and must ship in one commit with both consumers, because
the backend emits a status the frontend's `z.enum` refuses until it knows it.

**New — `packages/contracts/src/domain/pages/page-check.interface.ts`:**

```ts
/**
 * What one catalogue check concluded about one page.
 *
 * Four values, not three: `notYetChecked` is a code that did not exist when this page was
 * last crawled, and it exists so that adding a check is a visible reason to re-crawl
 * rather than a silent `passed` on a check that never ran.
 */
export const PAGE_CHECK_STATUSES = [
  'passed',
  'failed',
  'notApplicable',
  'notYetChecked',
] as const;
export type TPageCheckStatus = (typeof PAGE_CHECK_STATUSES)[number];

export interface IPageCheck {
  code: TSeoIssueCode;
  status: TPageCheckStatus;
}
```

**Changed — `seo-issue-catalogue.constant.ts`:** `ISeoIssueDefinition` gains
`skipReason?: string`, documented as "Why this check can be skipped. Present exactly on the codes
whose rule can answer `notApplicable`." The five conditional entries gain the §1.2 sentences.

**New — `packages/contracts/src/domain/seo/conditional-issue-codes.constant.ts`:**
`TConditionalIssueCode` (mapped over the catalogue on the presence of `skipReason`),
`CONDITIONAL_ISSUE_CODES` filtered from `SEO_ISSUE_CODES`, and
`skipReasonOf(code: TSeoIssueCode): string | null` — the one narrowing lookup, because
`SEO_ISSUE_CATALOGUE[code].skipReason` does not compile for a `code` of the full union.

**Changed — `page-detail.interface.ts:7`:** `IPageDetail` gains

```ts
/**
 * Every catalogue check with what this page's last crawl concluded, in catalogue order.
 * Composed on the backend: only the stored arrays can tell a check that was skipped from
 * one that did not exist yet, and they are not on the wire.
 *
 * Null while a page's last crawl predates the recording. Phase 2 removes the null.
 */
checks: IPageCheck[] | null;
```

**Barrel:** both new files are exported from `packages/contracts/src/index.ts`.

What does NOT cross the wire: labels, hints, thresholds, skip reasons, severities for a check row.
All of them are already in the catalogue the frontend imports (D3).

---

## 6. API surface

- `GET /api/pages/:pageId` — the response gains `checks`, as §5. Authorization, scoping and the
  404-for-foreign-id behaviour are untouched: `findCurrentPage` already joins
  `clients c on c.id = p.client_id and c.user_id = ${scope.userId}`
  (`page-detail.repository.ts:104`) and the two new columns are selected from the row it already
  reads by primary key.
- `GET /api/pages` — unchanged.

Explicitly NOT added: no per-check endpoint, no history of check outcomes over crawls, no filter
or sort by a check's status, no endpoint that returns the catalogue (the frontend imports it).

---

## 7. Services and modules

| Unit | Where | Why it owns this |
| --- | --- | --- |
| `evaluateSeoRules` (changed) | `be/src/modules/page-analysis/services/seo-rules/seo-rules.registry.ts:52` | It is the single pass. The skipped code is discarded today at `:58`; that one `continue` is the whole defect |
| `composePageChecks` (**new**) | `be/src/modules/pages/services/page-checks/compose-page-checks.ts` | Pure, and it needs both the stored arrays and the stored issue codes — the pages module holds both. Not in contracts: the frontend must not be able to call it (P4) |
| `PageReadService.getPage` (changed) | `be/src/modules/pages/services/page-read/page-read.service.ts:140` | It already loads the record and the issues; the composition is a third argument away, with no new query |
| `PageDetailRepository.findCurrentPage` (changed) | `be/src/modules/pages/repositories/page-detail/page-detail.repository.ts:91` | Two more columns in a select of one row by primary key |
| `PagesRepository.upsertManyForWorker` (changed) | `be/src/modules/pages/repositories/pages/pages.repository.ts:40` | The single statement that writes a page row (P1) |
| `summariseChecks` (**new**) | `fe/src/ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks.ts` | The counts, the subtitle parts and the per-row label/reason. A ViewModel service, like `groupIssues` beside it |
| `explainScore` (**new**) | `fe/src/ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.ts` | The four paragraphs, so the arithmetic is testable without rendering |
| `ChecksSection` (**new**) | `fe/src/Modules/PageDetail/ChecksSection/ChecksSection.tsx` | Renders what `summariseChecks` returns; no catalogue logic |
| `ScoreExplainer` (**new**) | `fe/src/Modules/PageDetail/ScoreExplainer/ScoreExplainer.tsx` | Renders what `explainScore` returns |

`IssuesSection`, `KpiCards`, `groupIssues`, `ScoreBadge`, `PageListRepository` and the whole crawl
discovery/selection path are not edited.

---

## 8. Error catalogue

No error code is added and no HTTP status changes. The one failure mode worth naming is a parse
refusal on the frontend: `pageDetailSchema` rejects a `checks` entry whose `status` is not in
`PAGE_CHECK_STATUSES`, which blanks the detail screen rather than rendering a status nobody
defined. That is GATEWAY-001 working as designed, and it is the reason §5 insists the contracts
change ships with both consumers; §16 R2 carries the check.

---

## 9. Background work

The crawl worker is the only writer. `CrawlRunExecutorService` calls `analyseRun` outside any
transaction (`crawl-run-executor.service.ts:169`), maps each page through `toRunPage` (`:236-254`)
and writes everything inside one finalize transaction (`:195`), where
`CrawlResultsService.applyRunResultsForWorker` upserts the pages (`crawl-results.service.ts:96`)
and replaces the issues (`:119-123`).

The two arrays ride that same path and that same transaction. The failure behaviour is therefore
unchanged and is worth stating because it is the property P1 buys: if the fetch fails, the run
fails and nothing is written; if finalize rolls back, no page carries arrays that disagree with
its counters, because the counters and the arrays are columns of one statement. A run abandoned
mid-way leaves the previous crawl's arrays in place, exactly as it leaves the previous counters.

---

## 10. Algorithms

### 10.1 The single pass records both lists

`be/src/modules/page-analysis/services/seo-rules/seo-rules.registry.ts`. `ISeoEvaluation` gains two
fields; the loop gains one line.

```ts
export interface ISeoEvaluation {
  issues: TSeoIssue[];
  /** Codes whose rule reached a verdict, in catalogue order. */
  checksJudged: TSeoIssueCode[];
  /** Codes whose rule could not be judged here, in catalogue order. Disjoint from above. */
  checksNotApplicable: TSeoIssueCode[];
  /** Always `checksJudged.length`; stored because the score and the list's order read it. */
  checksApplicable: number;
  /** Always `issues.length`. */
  checksFailed: number;
}

for (const code of SEO_ISSUE_CODES) {
  const verdict = SEO_RULES[code](input);
  if (verdict.outcome === 'notApplicable') {
    checksNotApplicable.push(code); // was: `continue` — the one place the skip was lost
    continue;
  }
  checksJudged.push(code);
  if (verdict.outcome === 'fails') issues.push({ code, severity: …, details: … });
}
```

`checksApplicable` is returned as `checksJudged.length`, so asserting the equality in a unit test
is a tautology and proves nothing — the tie that has teeth is the DB CHECK `I2`, because the only
way the two can disagree is a write that builds them separately. This is said out loud because a
test that cannot fail reports success. The same reasoning already applies to `checksFailed`
(`seo-rules.registry.ts:44-50`).

### 10.2 `composePageChecks`

```ts
export interface IStoredChecks {
  judged: readonly string[];
  notApplicable: readonly string[];
}

/**
 * Every catalogue check with what this crawl concluded, in catalogue order.
 *
 * Iterates the CATALOGUE, never the arrays: a code that has since been retired is never
 * asked about and so renders nothing, and a code added since the crawl is in neither
 * array and so answers `notYetChecked`.
 *
 * `null` in, `null` out — the crawl predates the recording, and no status would be honest.
 */
export function composePageChecks(
  stored: IStoredChecks | null,
  failed: readonly TSeoIssueCode[],
): IPageCheck[] | null;
```

Precedence per code, first match wins:

1. in `stored.notApplicable` → `notApplicable`
2. in `failed` → `failed`
3. in `stored.judged` → `passed`
4. otherwise → `notYetChecked`

Failure is tested before judged membership deliberately: a stored finding is an observation, and a
composition that could hide one would be worse than one that reports a contradiction. The
contradiction itself is prevented upstream — a `notApplicable` verdict never produces an issue
(`seo-rules.registry.ts:58-65`) and I1 forbids the overlap.

`stored` is one nullable object rather than two nullable arrays, so the "judged recorded, skips
not" state is unrepresentable in TypeScript; CHECK I4 is what licenses the repository to build it.

### 10.3 `summariseChecks`

Input `IPageCheck[]`; output

```ts
interface IChecksSummary {
  rows: { code: TSeoIssueCode; label: string; status: TPageCheckStatus; reason: string | null }[];
  counts: Record<TPageCheckStatus, number>;
  /** Non-zero groups only, in the order judged · not applicable · not yet checked. */
  subtitle: string;
  failed: number;
}
```

`label` is `SEO_ISSUE_CATALOGUE[code].label`. `reason` is `skipReasonOf(code)` for a
`notApplicable` row, the fixed "Added after this page was last crawled." for a `notYetChecked`
row, and `null` otherwise. `judged = counts.passed + counts.failed`; the subtitle joins the
non-zero parts with ` · `.

### 10.4 `explainScore` — the arithmetic paragraph

Input `IPageScore` (`{ value, applicable, failed }`), output four strings. Only the first is
computed:

```
passed = applicable - failed
raw    = (100 * passed) / applicable
shown  = strip trailing zeros from raw.toFixed(QUOTIENT_DECIMALS)   // QUOTIENT_DECIMALS = 2
exact  = Number(shown) === raw
```

- Sentence A: `${passed} of the ${applicable} checks that applied to this page passed.`
- Sentence B: `100 × ${passed} ÷ ${applicable} ${exact ? '=' : '≈'} ${shown}` followed by
  `, rounded half-up to ${value}.` — the rounding clause is **omitted** when `shown` has no
  fractional part, because "= 100, rounded half-up to 100" reads as a defect.

Worked cases, which are also the test cases:

| passed / applicable | raw | rendered |
| --- | --- | --- |
| 16 / 18 | 88.888… | `100 × 16 ÷ 18 ≈ 88.89, rounded half-up to 89.` |
| 1 / 16 | 6.25 | `100 × 1 ÷ 16 = 6.25, rounded half-up to 6.` |
| 18 / 18 | 100 | `100 × 18 ÷ 18 = 100.` |

Two decimals is enough: the denominator is at most the catalogue size, so no float error is
visible at that precision, and `6.25` is rendered rather than a `6.3` that contradicts the 6
printed beside it (§1.2).

Paragraphs 2–4 are the constants of §1.2 and carry no interpolation; the Lighthouse band numbers
in paragraph 4 come from `SCORE_BANDS` (`packages/contracts/src/domain/seo/score-band.constant.ts:6-10`),
not from a retyped literal, so moving a band moves the sentence.

---

## 11. Scenario walkthroughs

### 11.1 A page with no images and no meta description, crawled today

The crawl fetches it. `evaluateSeoRules` loops the 18 codes:
`META_DESCRIPTION_LENGTH` returns `NOT_APPLICABLE` (`meta-rules.ts:41`) and `IMAGES_MISSING_ALT`
returns `NOT_APPLICABLE` (`content-rules.ts:18`), so both land in `checksNotApplicable`; the other
16 land in `checksJudged`; `META_DESCRIPTION_MISSING` fails, so `issues` holds one entry.
`toRunPage` carries all four fields, and one upsert writes `checks_applicable = 16`,
`checks_failed = 1`, `checks_judged` (16 codes) and `checks_not_applicable` (2 codes) — the
counter CHECK passing is the proof the array and the counter came from the same pass.

The user opens the detail. `findCurrentPage` returns the row; `issuesForPage` returns the one
finding; `composePageChecks` answers 18 rows: 15 `passed`, 1 `failed`, 2 `notApplicable`. The
Checks section reads `16 judged · 2 not applicable`, shows "No description to measure." and "The
page has no images." in dimmed text, and closes with "Details for the 1 failed check are in SEO
issues below." The score explainer reads "15 of the 16 checks that applied to this page passed.
100 × 15 ÷ 16 = 93.75, rounded half-up to 94." SEO issues below shows the one warning with its
sentence and hint, unchanged.

### 11.2 A nineteenth check is added to the catalogue

A deploy adds `SITEMAP_LASTMOD_STALE`. Nothing re-crawls. A page last crawled under 18 codes has
that code in neither array, so `composePageChecks` answers `notYetChecked` and the row reads
"Added after this page was last crawled." The subtitle reads `16 judged · 2 not applicable · 1 not
yet checked`. The score is unchanged, because it reads the stored counters and not the catalogue
(P8) — the page is not marked down for a check nobody ran on it. After the client is re-crawled
the row joins one of the other two groups. This is D4's whole purpose: adding a check becomes a
visible reason to re-crawl rather than a silent lie.

### 11.3 A page whose last crawl predates the recording (phase 1 only)

`checks_judged` is null, so `findCurrentPage` maps `stored` to null, `composePageChecks` returns
null, and the wire carries `checks: null`. The Checks section renders exactly one line, "Re-crawl
this page to see each check.", and no rows: the screen does not claim a verdict that was never
observed (P7). The score, the KPI cards and SEO issues are all unaffected — they read columns that
have been written all along. After the client is re-crawled the section fills in. Phase 2 deletes
this state and its copy.

---

## 12. Frontend

**Route and screen.** `/app/pages/$pageId` → `fe/src/Modules/PageDetail/PageDetailScreen.tsx`. Two
components are inserted into the existing `<Stack gap="xl">` between `<PositionHistory …/>` and
`<IssuesSection …/>` (`PageDetailScreen.tsx:70-100`):

```tsx
<ChecksSection checks={vm.detail.checks} />
<ScoreExplainer score={vm.detail.score} />
```

**ViewModel.** `usePageDetailViewModel` is not changed: `checks` arrives inside `detail`, parsed by
`pageDetailSchema`. The two new services under
`fe/src/ViewModels/PageDetailViewModel/Services/` hold all the derivation (§10.3, §10.4), so both
components are rendering functions, per the MVVM split the fe skills own.

**Gateway.** `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` gains

```ts
export const pageCheckSchema = z.object({
  code: z.enum(SEO_ISSUE_CODES),
  status: z.enum(PAGE_CHECK_STATUSES),
}) satisfies z.ZodType<IPageCheck>;
```

and `pageDetailSchema` gains `checks: z.array(pageCheckSchema).nullable()` (phase 1), losing
`.nullable()` in phase 2. An unknown status is a parse error, not a blank row — the same stance as
`seoIssueSchema` at `PageSchemas.ts:96-107`.

**Every state the Checks section can be in:**

| state | what renders |
| --- | --- |
| detail loading | the existing skeleton (`PageDetailScreen.tsx:53-61`); the section does not mount |
| detail error | the existing `SectionError` (`:50-52`); the section does not mount |
| `checks === null` | the heading and "Re-crawl this page to see each check." No subtitle, no rows, no closing line |
| `checks` with failures | subtitle, 18 rows, the closing line naming the failure count |
| `checks` with no failures | subtitle, 18 rows, no closing line |
| no not-applicable checks | the subtitle is `18 judged` alone |
| some `notYetChecked` | that group appears last in the subtitle and its rows carry the fixed sentence |

**Every state the score explainer can be in:** one. It reads `score`, which `IPageDetail` has
always declared non-null and `pageScoreSchema` enforces with `applicable: positive()`
(`PageSchemas.ts:37-41`). There is no empty state and no loading state of its own.

---

## 13. Invariants ↔ tests

| # | Pinned by |
| --- | --- |
| I1 | `pages.repository.int-spec.ts` → "refuses a code that is both judged and not applicable" (expects `23514` / `pages_checks_disjoint`), plus `seo-rules.registry.spec.ts` → "the two lists never share a code, over every recorded page" |
| I2 | `pages.repository.int-spec.ts` → "refuses checks_applicable that disagrees with the judged array" (`23514` / `pages_checks_judged_counter`) |
| I3 | `pages.repository.int-spec.ts` → "refuses a duplicate code" and "refuses an empty code" (`23514` / `pages_checks_judged_clean`) |
| I4 | `pages.repository.int-spec.ts` → "refuses one array recorded without the other" (`23514` / `pages_checks_arrays_together`) |
| I5 | `seo-rules.registry.spec.ts` → "every catalogue code is judged or skipped exactly once, over every recorded page" (the 30+ fixture corpus that already pins `13 <= applicable <= 18` at `:82-110`). Not pinned by a constraint, by P3 |
| I6 | `pages.repository.int-spec.ts` → "a re-crawl that skips nothing comes back with an empty array", extending the counter case at `:95-112` |
| I7 | `conditional-issue-codes.test.ts` (contracts) → the derived set is exactly the five and each has a non-empty reason; and `seo-rules.registry.spec.ts` → "the skipped set is exactly CONDITIONAL_ISSUE_CODES", which is the one with teeth: it fails when a rule learns to skip without the catalogue learning why |
| I8 | typecheck (`TPageCheckStatus` on both sides) + `PageSchemas.test.ts` → "an unknown check status fails to parse" |
| I9 | not pinned by a test — no test can see the absence of a derivation. Pinned by review, and cheapened by construction: `IPageCheck.status` is the only status the frontend has, and `checks_judged` never crosses the wire |
| I10 | `compose-page-checks.spec.ts` → "returns one row per catalogue code, in catalogue order"; `ChecksSection.test.tsx` → "renders the rows in the order given" |
| I11 | `compose-page-checks.spec.ts` → "a stored code that has left the catalogue renders nothing" |
| I12 | the existing `page-list.repository.int-spec.ts` order-by tests and `pages.e2e-spec.ts:38` ("pages through the 15 posts, worst first and each exactly once"), run unchanged as the phase's regression guard |
| I13 | `explainScore.test.ts` → the three cases of §10.4, each asserting the rounded value equals the `IPageScore.value` passed in |

---

## 14. Test plan

Conventions are owned by `practices/be/nestjs/testing-patterns/SKILL.md`,
`practices/fe/react/testing/SKILL.md` and `fe/skills/testing/SKILL.md`; only kind and placement
are named here. For each, what makes it fail.

**Contracts — unit** (`pnpm --filter @app/contracts run test:ci`)

- `packages/contracts/src/domain/seo/conditional-issue-codes.test.ts` — the derived set is exactly
  the five conditional codes; every member has a non-empty `skipReason`; `skipReasonOf` returns
  null for `TITLE_MISSING`. *Fails when* a `skipReason` is added to a check that cannot be skipped,
  or removed from one that can. Only this kind can see the catalogue in isolation from the rules.

**Backend — unit** (`pnpm --filter be test:ci -- <path>`)

- `seo-rules.registry.spec.ts` (extend; do not replace the existing cases) —
  (a) over the 30+ recorded posts: `checksJudged.length + checksNotApplicable.length ===
  SEO_ISSUE_CODES.length`, the two are disjoint, their union is the catalogue set, each has no
  duplicate, and `checksNotApplicable ⊆ CONDITIONAL_ISSUE_CODES`. *Fails when* a rule returns a
  fourth outcome, a `continue` drops a code from both lists, or a new skippable rule arrives
  without its reason.
  (b) the all-conditions-absent input (`:46-60`) returns `checksNotApplicable` exactly equal to
  `CONDITIONAL_ISSUE_CODES` in catalogue order. *Fails when* the catalogue and the rules disagree
  about which checks are conditional.
  (c) `issues.map(code)` is a subset of `checksJudged`. *Fails when* a failing verdict is recorded
  as skipped.
- `be/src/modules/pages/services/page-checks/compose-page-checks.spec.ts` (**new**) — one row per
  catalogue code in catalogue order; the four statuses including `notYetChecked` for a code in
  neither array; `null` in, `null` out; a stored code outside today's catalogue renders nothing; a
  failing code reports `failed` and not `passed`. *Fails when* the precedence of §10.2 changes or
  the function iterates an array instead of the catalogue. Only a unit test can reach the
  `notYetChecked` branch cheaply: it needs a stored row whose arrays predate a catalogue code.
- `page-read.service.spec.ts` (extend) — `getPage` returns `checks` composed from the record and
  the issue codes; a record with null arrays returns `checks: null`. *Fails when* the service
  forgets to compose, or composes from the catalogue instead of the row.
- `crawl-results.service.spec.ts` (extend) — the upsert row carries both arrays from the
  `IRunPage`. *Fails when* a field is dropped in the mapping at `crawl-results.service.ts:78-95`.

**Backend — integration / DB** (`pnpm --filter be test:db -- <path>`; a real Postgres decides all
five CHECKs and the upsert's overwrite semantics, and nothing else can)

- `pages.repository.int-spec.ts` (extend) — the round-trip; the re-crawl overwrite (I6); the four
  refusals (I1–I4), each asserting the SQLSTATE and the constraint name through the existing
  `expectPgError` helper used at `:117-127`; and a legacy row with both arrays null is accepted in
  phase 1. *Fails when* a CHECK is missing, misnamed, or written so loosely it accepts the bad
  row — which is exactly how a constraint silently stops being one.
- `page-list.repository.int-spec.ts` — run unchanged. The fixtures carry
  `checksApplicable: 18, checksFailed: 3` and no arrays; after phase 1 they must still insert
  (null arrays are legal) and the order-by tests must still pass. In phase 2 these fixtures must
  gain arrays or the inserts fail with `23502` — that is a planned, named breakage, not a surprise.

**Backend — e2e (API)** (`pnpm --filter be test:db -- test/e2e/pages.e2e-spec.ts`; the flow from a
recorded crawl through the store to the wire, with the session on it)

- `pages.e2e-spec.ts` (extend; the suite already runs a real recorded Yoast crawl at `:18-31`) —
  the detail of a crawled page carries `checks` with exactly `SEO_ISSUE_CODES.length` entries, in
  catalogue order, with no `notYetChecked`, and the number of `passed` entries equals
  `score.applicable - score.failed`. *Fails when* the composition and the counters disagree, or
  the wire shape drifts from the contract — the one assertion that covers crawl, upsert, read and
  serialization together.

**Frontend — unit** (`pnpm --filter fe test:ci -- <name>`)

- `summariseChecks.test.ts` (**new**) — the counts per status; the subtitle omits zero groups and
  orders the rest; a reason is attached to `notApplicable` and `notYetChecked` rows and to no
  other. *Fails when* a zero group leaks into the subtitle, or a reason is attached to a passed
  row.
- `explainScore.test.ts` (**new**) — the three §10.4 cases verbatim, plus: the rounded value in the
  sentence always equals the `value` passed in. *Fails when* the quotient's rendering disagrees
  with the score the badge shows — the defect §1.2 exists to prevent.
- `PageSchemas.test.ts` (extend) — `checks: null` parses; an unknown status fails to parse; a
  `checks` entry with an unknown code fails to parse.

**Frontend — component** (same command; rendered with `MantineProvider`, as
`IssuesSection.test.tsx:6-11` does)

- `ChecksSection.test.tsx` (**new**) — a row per catalogue code with the right status marker and
  label; the skip reason rendered for a not-applicable row; the closing line present with failures
  and absent without; `checks={null}` renders the re-crawl line and no rows. *Fails when* a status
  renders as another, or the null case renders a table of verdicts.
- `ScoreExplainer.test.tsx` (**new**) — the four paragraphs render and the page's own numbers
  appear in the first. *Fails when* a paragraph is dropped or the numbers are hard-coded.

**Typecheck / lint** (`pnpm typecheck`, `pnpm lint`) — `TPageCheckStatus` and `IPageCheck` on both
sides; `TConditionalIssueCode` derived from the catalogue so no second list of conditional codes
can exist; `IPageDetail.checks` losing `| null` in phase 2 is what forces the component's branch
to be deleted rather than left dead.

**Performance.** Nothing is pinned by an `EXPLAIN` here, and the reason is specific: no query
gains a predicate, a join or a row. `findCurrentPage` selects two more columns of one row it
already fetches by primary key, and the list query is not edited (I12). The existing order-by
tests are the guard.

---

## 15. Work order

Two phases. Phase 1 is everything that ships against nullable columns and is the deployable
feature; phase 2 is the tightening, and it cannot start until O1's query returns zero.

Sub-phase **1a** deliberately ends with `pnpm typecheck` failing — the contracts change makes both
consumers incomplete, and that failure is its deliverable. The rule is that each PHASE is
independently green; within a phase the sub-phases are a sequence.

### Phase 1 — `page-check-status-sections`

Ends green, deployable, and with a user-visible feature: a re-crawled page shows every check, an
older page says to re-crawl.

#### 1a — the contract

1. **Deliverables.** `packages/contracts/src/domain/seo/conditional-issue-codes.constant.ts`
   (**new**), `.../conditional-issue-codes.test.ts` (**new**),
   `packages/contracts/src/domain/pages/page-check.interface.ts` (**new**), edits to
   `seo-issue-catalogue.constant.ts` (`skipReason?` on the interface, the five sentences),
   `page-detail.interface.ts` (`checks`), `packages/contracts/src/index.ts`.
2. **Pre-conditions.** `main` green. Depends on D3, D4 and D7.
3. **TDD points.** Write `conditional-issue-codes.test.ts` FIRST — "the derived set is exactly
   TITLE_LENGTH, META_DESCRIPTION_LENGTH, CANONICAL_MISMATCH, IMAGES_MISSING_ALT, HEADING_SKIP" and
   "every conditional code has a non-empty skipReason". It fails because the module does not exist.
   Then the catalogue and the derivation. `page-check.interface.ts` carries no logic and gets no
   test of its own; it is pinned by typecheck and by its consumers.
4. **Acceptance.** `pnpm --filter @app/contracts run test:ci`; then
   `pnpm --filter @app/contracts run build` succeeds AND `pnpm typecheck` FAILS in `be` and `fe`
   on the missing `checks` property — that failure is this sub-phase's deliverable, and a passing
   typecheck here means `IPageDetail` was not actually changed.
5. **Regression guard.** `measured-issue-codes.test.ts` and every consumer of
   `SEO_ISSUE_CATALOGUE` — a widened `ISeoIssueDefinition` must not disturb the `as const satisfies`
   inference. Caught by `pnpm --filter @app/contracts run test:ci`.
6. **Rollback.** Revert the commits; nothing persists.
7. **Commit points.**
   - `feat(contracts): a conditional check declares why it can be skipped`
   - `feat(contracts): a page check carries one of four statuses`

#### 1b — the single pass keeps what it was discarding

1. **Deliverables.** `be/src/modules/page-analysis/services/seo-rules/seo-rules.registry.ts`
   (`ISeoEvaluation`, the loop), `seo-rules.registry.spec.ts`,
   `be/src/modules/page-analysis/services/page-analysis/page-analysis.service.ts` (`IPageAnalysis`
   gains both lists).
2. **Pre-conditions.** 1a landed. Depends on D4.
3. **TDD points.** BEFORE the change, add to `seo-rules.registry.spec.ts`: "every catalogue code is
   judged or skipped exactly once, over every recorded page" and "the skipped set is exactly
   CONDITIONAL_ISSUE_CODES". Both fail because `ISeoEvaluation` has no such fields. AFTER: the
   subset assertion `issues ⊆ checksJudged`.
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/page-analysis`.
5. **Regression guard.** The existing corpus assertions at `seo-rules.registry.spec.ts:82-110`
   (`13 <= checksApplicable <= 18`, `checksFailed === issues.length`) must still pass untouched;
   if one moves, record it as an `AMENDED` line with the before and after rather than loosening it.
6. **Rollback.** Revert; the crawl writes nothing new yet.
7. **Commit points.**
   - `feat(be): the rules pass records which checks it could not judge`

#### 1c — the columns, their constraints, and the function a CHECK needs

1. **Deliverables.** `be/drizzle/0008_check_array_helpers.sql` (generated with
   `drizzle-kit generate --custom`, then its body written),
   `be/src/persistence/schema/tables/pages/pages.schema.ts` (two columns, five CHECKs),
   `be/drizzle/0009_<generated>.sql` + its snapshot and journal entry (generated, never edited),
   `be/src/modules/pages/repositories/pages/pages.repository.ts` (`IUpsertPage` and the
   `onConflictDoUpdate` set clause), `pages.repository.int-spec.ts`.
2. **Pre-conditions.** 1b landed. Depends on D1, D2, D4 and D5. A database is running
   (`pnpm dev:db`).
3. **TDD points.** BEFORE the schema change, add the int-spec cases: the round-trip, the re-crawl
   overwrite, and the four refusals with their constraint names. They fail because the columns do
   not exist. The legacy-null case is written here too and passes only once the columns are
   nullable.
4. **Acceptance, in order.**
   - `pnpm --filter be exec dotenv -e ../.env -- drizzle-kit generate --custom --name check_array_helpers`,
     write the function body, and read the file.
   - `pnpm db:generate`, then **read** `be/drizzle/0009_*.sql` and confirm it says
     `varchar(64)[]`, five `ADD CONSTRAINT … CHECK`, and NO `NOT NULL` and no `DROP` of anything.
   - `pnpm db:migrate`.
   - `pnpm --filter be test:db -- src/modules/pages/repositories/pages`.
   - `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "\d+ pages"` lists all
     five constraints by name.
5. **Regression guard.** Every existing insert into `pages` — the int-spec fixtures, the e2e
   crawls, the seed — must still work with the arrays absent. Caught by
   `pnpm --filter be test:db` in full, which is also what proves the columns are genuinely
   nullable.
6. **Rollback.** No down-migration exists in this repository (drizzle generates none). Undoing
   means a new forward migration dropping the two columns and the five constraints; the function
   is harmless if left. Never `docker compose down -v`.
7. **Commit points.**
   - `feat(be): a check constraint helper for array contents`
   - `feat(be): a page records which checks were judged and which were skipped`

#### 1d — the crawl writes them

1. **Deliverables.** `be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.ts`
   (`toRunPage` at `:236-254`),
   `be/src/modules/pages/services/crawl-results/crawl-results.service.ts` (`IRunPage` at `:19-37`,
   the row mapping at `:78-95`), `crawl-results.service.spec.ts`.
2. **Pre-conditions.** 1c landed and migrated.
3. **TDD points.** BEFORE: extend `crawl-results.service.spec.ts` to assert the upsert row carries
   both arrays; it fails on the missing fields.
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/pages src/modules/crawl` and
   `pnpm --filter be test:db -- test/e2e/crawl.e2e-spec.ts`, which runs a recorded crawl end to end
   and so is the first proof the counter CHECK holds against real pages.
5. **Regression guard.** The counter CHECK now refuses any crawl whose array and counter disagree —
   a crawl that used to succeed would fail the run. The e2e crawl is the check, and it is the
   reason it runs here rather than at the end of the phase.
6. **Rollback.** Revert; the columns stay and stay null.
7. **Commit points.**
   - `feat(be): the crawl stores the judged and skipped checks with the counters`

#### 1e — the read path composes the statuses

1. **Deliverables.** `be/src/modules/pages/services/page-checks/compose-page-checks.ts` (**new**)
   and its spec (**new**), `be/src/modules/pages/repositories/page-detail/page-detail.repository.ts`
   (`ICurrentPageRecord` at `:15-34`, `IPageRow` at `:51-69`, the select at `:95-112`, the mapping
   at `:115-133`), `page-read.service.ts` (`getPage` at `:140-180`), `page-read.service.spec.ts`,
   `be/test/e2e/pages.e2e-spec.ts`.
2. **Pre-conditions.** 1d landed. Depends on D3 and D4.
3. **TDD points.** BEFORE: `compose-page-checks.spec.ts` in full (§14) — it fails because the
   module does not exist; and the `pages.e2e-spec.ts` case "the detail answers every catalogue
   check" — it fails because `checks` is absent from the response. AFTER: the `page-read` cases.
4. **Acceptance.** `pnpm --filter be test:ci -- src/modules/pages` and
   `pnpm --filter be test:db -- test/e2e/pages.e2e-spec.ts`.
5. **Regression guard.** `findCurrentPage` is raw SQL and its row mapping is positional by name;
   a misspelled column comes back `undefined` rather than failing. The e2e case is what catches
   it, because it asserts statuses and not merely presence.
6. **Rollback.** Revert; the frontend has not shipped yet, so nothing user-visible changes.
7. **Commit points.**
   - `feat(be): compose every catalogue check's status for a page`
   - `feat(be): the page detail answers per check`

#### 1f — the two sections

1. **Deliverables.** `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` and its test,
   `fe/src/ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks.ts` (**new**)
   + test, `.../Services/ExplainScore/explainScore.ts` (**new**) + test,
   `fe/src/Modules/PageDetail/ChecksSection/ChecksSection.tsx` (**new**) + test,
   `fe/src/Modules/PageDetail/ScoreExplainer/ScoreExplainer.tsx` (**new**) + test,
   `fe/src/Modules/PageDetail/PageDetailScreen.tsx`.
2. **Pre-conditions.** 1e landed. Depends on D5, D6 and D7, and on the approved copy of §1.2.
3. **TDD points.** BEFORE, in this order: `PageSchemas.test.ts` "an unknown check status fails to
   parse" (fails: no `checks` in the schema); `explainScore.test.ts` with the three §10.4 cases
   (fails: no module); `summariseChecks.test.ts` (fails: no module); `ChecksSection.test.tsx` with
   the null case and the failure-line case (fails: no component). AFTER: `ScoreExplainer.test.tsx`.
4. **Acceptance.** `pnpm --filter fe test:ci && pnpm typecheck && pnpm lint`.
5. **Regression guard.** `IssuesSection.test.tsx` must pass unchanged — the severity ordering is
   the thing D6 protects, and the new section sits directly above it. `PageDetailViewModel.test.ts`
   must pass unchanged: `checks` rides inside `detail` and the ViewModel gains no state.
6. **Rollback.** Revert the frontend commits; the backend keeps emitting `checks` and nothing
   breaks, because the gateway would simply stop reading it.
7. **Commit points.**
   - `feat(fe): parse the per-check statuses from the detail response`
   - `feat(fe): a Checks section listing every catalogue check`
   - `feat(fe): explain the health score on the page's own numbers`

#### 1g — phase acceptance

1. **Deliverables.** No code. The README line of §18 if it is written here rather than at harvest.
2. **Pre-conditions.** 1a–1f landed.
3. **TDD points.** None; this sub-phase only runs checks.
4. **Acceptance.**
   - `pnpm lint && pnpm typecheck && pnpm test`
   - `pnpm --filter be test:db` (the whole DB and e2e suite, serially)
   - `docker compose up -d --build` then `curl -fsS http://localhost:8080/api/health`
   - a signed-in `curl` of `/api/pages/<id>` shows `checks` with one entry per catalogue code
   - the browser walk: `/pages/<id>` shows both sections, the subtitle matches the rows, and the
     console is clean
   - record O1's readiness query and its answer:
     `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from pages where checks_judged is null"`
5. **Regression guard.** The whole suite is the guard. A stale developer database will report a
   non-zero count here; that is information, not a failure (§16 R1).
6. **Rollback.** n/a.
7. **Commit points.** None, unless the README line lands here:
   `docs: the detail says what each check concluded`.

### Phase 2 — `page-checks-required`

Cannot start until O1's query returns zero on every database this will be deployed to. Changes no
requirement — it makes an already-specified state unreachable — so its change declares
`skip_specs: true`.

#### 2a — readiness

1. **Deliverables.** None; the answer is recorded in the change's `tasks.md`.
2. **Pre-conditions.** Phase 1 closed and every client re-crawled.
3. **TDD points.** None.
4. **Acceptance.**
   `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select count(*) from pages where checks_judged is null"`
   returns `0`. Any other answer stops the phase.
5. **Regression guard.** Running the migration against a database with null rows fails with
   `23502` and aborts — the migration is the guard, and it is why this query is a task and not a
   note.
6. **Rollback.** n/a.
7. **Commit points.** None.

#### 2b — the tightening

1. **Deliverables.** `pages.schema.ts` (`.notNull()` on both columns; the four `is null or` arms
   removed from the CHECKs), `be/drizzle/0010_<generated>.sql` (generated),
   `page-detail.repository.ts` (`ICurrentPageRecord` loses the null), `compose-page-checks.ts`
   (loses the null branch and its return type's `| null`), `page-read.service.ts`,
   `packages/contracts/src/domain/pages/page-detail.interface.ts` (`checks: IPageCheck[]`),
   `PageSchemas.ts` (`.nullable()` removed), `ChecksSection.tsx` (the branch and the re-crawl copy
   deleted), the tests that covered the null state, `page-list.repository.int-spec.ts` fixtures
   (arrays added).
2. **Pre-conditions.** 2a returned zero.
3. **TDD points.** BEFORE: in `pages.repository.int-spec.ts`, invert the legacy case — "refuses a
   page inserted without the judged array", expecting `23502` on `checks_judged`. It fails,
   because null is still legal. The deletion of `ChecksSection`'s null case is not a TDD point; it
   is forced by typecheck, which is the point of removing `| null` from the contract.
4. **Acceptance.** `pnpm db:generate`, **read** `0010_*.sql` and confirm it sets NOT NULL on both
   columns and REPLACES the four loose CHECKs (a changed CHECK must appear as a DROP followed by an
   ADD; if it does not, the loose constraint survives — see R3). Then `pnpm db:migrate`,
   `pnpm --filter be test:db`, `pnpm lint && pnpm typecheck && pnpm test`,
   `docker compose up -d --build`, and
   `psql -c "\d+ pages"` showing no `is null or` in any of the five constraint definitions.
5. **Regression guard.** Any fixture or seed that inserts a page without the arrays now fails
   loudly with `23502`. That breakage is planned and named in §14; the full DB suite is where it
   surfaces.
6. **Rollback.** A new forward migration dropping NOT NULL and restoring the loose CHECKs. The data
   is not lost either way; no row is rewritten by this migration.
7. **Commit points.**
   - `refactor(be): every page records its checks, so the columns are required`
   - `refactor(fe): drop the branch for a page with no recorded checks`

---

## 16. Risks

| # | Risk | The check that catches it |
| --- | --- | --- |
| R1 | A developer database holds pages crawled before 1c, so every detail shows the re-crawl line and the feature looks broken | O1's count query in 1g. Recovery is a re-crawl per client through the UI or `pnpm seed`; never `docker compose down -v` |
| R2 | A status or code the frontend's `z.enum` refuses blanks the whole detail screen — the exact defect the archived `seo-analysis-accuracy` plan hit with retired issue codes | `PageSchemas.test.ts` "an unknown check status fails to parse" plus the e2e assertion that the wire carries only catalogue codes; and `PAGE_CHECK_STATUSES` is a shared constant, so the two sides cannot drift |
| R3 | `drizzle-kit` may not emit an ALTER for a CHECK whose definition changed, leaving phase 2's loose constraints in place while the schema file claims they are tight | 2b's acceptance reads the generated SQL and then `\d+ pages`. **VERIFY:** whether drizzle-kit 0.31 diffs CHECK definitions; if it does not, the tightening needs its own `--custom` migration |
| R4 | Adding a catalogue check between the phases makes every page show a `notYetChecked` row until its client is re-crawled | Designed behaviour (D4, §11.2), named here so it is not reported as a defect. The subtitle makes the count visible |
| R5 | The pages list's ordering regresses while the counters are touched | `page-list.repository.int-spec.ts` and `pages.e2e-spec.ts:38`, run unchanged in 1c and 1g |
| R6 | A fresh database runs 0009 before the `array_is_clean` function exists and the migration aborts | Migrations run in journal order and 0008 precedes 0009; proved by `docker compose up -d --build` from an empty volume, which is 1g's acceptance |
| R7 | `varchar(64)[]` is not what Drizzle emits for `.array()` on a length-bounded varchar | 1c's acceptance reads the generated SQL before migrating. **VERIFY:** the exact emitted type |

---

## 17. Cross-workspace touchpoints

- **`packages/contracts`** — the catalogue widening, `CONDITIONAL_ISSUE_CODES`, `IPageCheck`,
  `IPageDetail.checks`. The root `lint`, `typecheck` and `test` scripts already build it first
  (`package.json:11-13`), so nothing in CI needs changing.
- **`be`** — schema, two migrations, the registry, the crawl path, the read path, the e2e suite.
- **`fe`** — the gateway schema, two ViewModel services, two components, the screen.
- **`docker`** — no compose change. The `migrate` service (`docker-compose.yml:29`) runs 0008–0009
  before `be` starts (`:53`), which is what makes `docker compose up -d --build` a real acceptance
  for the migration order (R6).
- **CI / `.github`** — unchanged. `pnpm --filter be test:db` already covers both `*.int-spec.ts`
  and `*.e2e-spec.ts` (`be/test/jest-db.config.json:4`); there is no separate `test:e2e` script,
  and the plan's commands say `test:db` for both.

---

## 18. README and harvest

**README.** The decisions section gains one line: the detail names every check and its outcome,
and a check the crawl could not judge is listed with its reason rather than counted as a pass — so
the score's denominator is visible as a list, not only as a number.

**Harvest, before archiving either change.**

| fact | owning document |
| --- | --- |
| the two arrays come from the same single pass, their union is the catalogue that ran, and why no constraint can say so (P3, I5) | `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`, extending its "Three outcomes, and the denominator" bullet |
| the five conditional codes now carry their reasons in the catalogue, and the test that ties the catalogue's conditional set to the rules (I7) | the same bullet |
| the four-valued status, the composition precedence of §10.2, and why the composition iterates the catalogue and not the array (I10, I11) | `be/src/modules/pages/PAGES_MODULE.md` |
| the two-phase nullable→NOT NULL column, and why reconstruction in the migration was refused (D5) | `be/skills/architecture-decisions/SKILL.md` |
| why a CHECK needs an IMMUTABLE function for array distinctness, and the limit of a function-backed CHECK | `practices/be/drizzle/database-patterns/SKILL.md` |
| the score's permitted claim and the Lighthouse band precedent | already in `practices/search-engines/references/ranking-signals.md` and the comment on `pageScoreOf` — cited, never copied |

**Deposit** (after `/opsx:archive`, per `openspec/README.md` §8): ANALYSIS-011 into
`PAGE_ANALYSIS_MODULE.md`, PAGES-012 into `PAGES_MODULE.md`, PAGEDETAIL-009 and PAGEDETAIL-010 into
the frontend document that owns the detail screen — **VERIFY:** no `fe/` module document exists
today, so the deposit either creates one or goes into `fe/skills/folder-structure/SKILL.md`'s
owner; decide at deposit time, do not create a document speculatively here.

---

## 19. Out of scope

- **A history of check outcomes across crawls.** Each crawl overwrites; the row describes the last
  fetch, like the issues beside it. Storing a series would need a new table and a retention answer,
  and nothing on either screen asks the question.
- **Filtering or sorting the list by a check's status.** D8 keeps the list untouched, and a filter
  over an array column needs a GIN index and a query the list does not have.
- **Showing the measurement on a passed check** ("the title is 45 characters, within 30–60"). The
  measurement is only stored for a FAILING verdict (`TIssueDetails` is on the issue, not the page),
  so this would need the crawl to store every verdict's details — a far larger write.
- **Re-crawling automatically when the catalogue grows.** D4 deliberately makes it a visible reason
  for a person to re-crawl; an automatic re-crawl of every client on deploy is a different feature
  with a rate-limit question attached.
- **Merging the two new sections, or folding SEO issues into the Checks list.** Closed by D6.

---

## 20. Open questions

**O1 — what decides that phase 2 is ready.** Default: `select count(*) from pages where
checks_judged is null` returns zero, run after every client has been re-crawled, on every database
the change will be deployed to. Reopens: before the phase-2 migration is written.

**O2 — the section copy.** Accepted as drafted in §1.2; revisable against the real screen without
returning to this plan.

**O3 — the `array_is_clean` function.** D2 requires the database to fix element-distinctness, and
PostgreSQL cannot express it in a CHECK without a function (§3). Default: generate the custom
migration and build the function. Reopens: at review of `0008_check_array_helpers.sql`. If it is
refused, the two `*_clean` CHECKs are dropped, I3 moves to "pinned by a unit test at the writer,
not by a constraint", and §13 is corrected to say so.

**O4 — the arithmetic sentence's rendering.** §1.2 deviates from the approved copy ("≈ 88.89"
rather than "88.9") because one decimal can print a number that rounds the other way from the
score beside it. Default: the §10.4 rule. Reopens: if the user prefers the original wording, in
which case the sentence must drop the quotient entirely rather than print a misleading one.

### Decision log, verbatim

**D1.** The skipped-code set lives in an array column `checks_not_applicable` on `pages`, written
by the same upsert as both counters. Why: it is a fact of the same single fetch as the counter it
must agree with, so it belongs to the row that one statement writes whole. Closed: widening
`seo_issues` to hold all verdicts; a separate `page_check_skips` table.

**D2.** The database fixes CHECK constraints on the arrays' contents: elements distinct and
non-empty. Tying the array to the counter via the catalogue size is impossible — any such
constraint breaks old rows when the catalogue grows. Closed: a pgEnum array, which would contradict
the deliberate varchar at `seo_issues.code` ("a set that grows with new rules, so varchar").
Rewritten by D4.

**D3.** The wire carries `checks: IPageCheck[]` — `{ code, status }` in catalogue order, composed
on the backend. Labels, hints and thresholds continue to come from the shared catalogue, not the
payload. Why: the ambiguity introduced by catalogue growth is resolvable only where
`checks_applicable` is; handing it to the frontend guarantees it is resolved wrongly and silently.
Closed: deriving statuses on the frontend; duplicating catalogue copy in the payload.

**D4.** Two disjoint arrays are stored: `checks_judged` (13–18 codes) and `checks_not_applicable`
(0–5); their union is the catalogue as of that crawl. The status is four-valued: `notYetChecked` is
added for a code that did not exist at that crawl. Why: it removes the special case instead of
handling it, and makes adding a check a visible reason to re-crawl. Rewrites D2: adds CHECK
`checks_applicable = cardinality(checks_judged)` and a disjointness CHECK
(`checks_judged && checks_not_applicable = '{}'`) — the counter-to-array tie that node 2 could not
find. Closed: a banner over a lying table; degrading to counts.

**D5.** The columns are added nullable; the CHECK is written as `checks_judged is null or
checks_applicable = cardinality(checks_judged)`. After every client has been re-crawled, a second
phase tightens to NOT NULL and removes `| null` from the wire and the branch from the component.
Why: phase 1 equals the "nullable forever" option, so the two-phase shape costs nothing until the
re-crawl has already happened. Closed: reconstruction in the migration — the only option that
manufactures a fact that was never observed. (Of the five conditional checks, the stored row can
honestly answer only two: TITLE_LENGTH is skipped exactly when `title is null`,
META_DESCRIPTION_LENGTH when `meta_description is null`. CANONICAL_MISMATCH, IMAGES_MISSING_ALT and
HEADING_SKIP are unknowable from the row — it holds no canonical, no images and no headings.)

**D6.** Two sections, not one. "Checks" lists every check with status and label; measurements,
hints and `pagesAffected` stay in "SEO issues". Why: an enumeration with the failures removed stops
answering the question it was asked for, and the severity ordering is the one thing on this screen
that this feature could break. Closed: merging the sections and deleting `IssuesSection`.

**D7.** The skip reason is a static sentence per code in the contracts catalogue, beside `label`
and `hint`, plus a test that fails when a conditional check has no reason. Why: the reason does not
vary by page, so storing it on the page pays storage for a constant.

**D8 (derived, not chosen).** The page list and its ordering do not change. `checks_applicable` and
`checks_failed` stay stored: applicability cannot be derived from the current catalogue, because a
page crawled under 18 checks and read under 20 would claim what its crawl never saw.
`order by (checks_applicable - checks_failed)::numeric / checks_applicable` is untouched.


**D9 (reversal of D5's second phase, 2026-10-04).** The tightening to NOT NULL is withdrawn, and
the columns stay nullable permanently. D5 rested on "after every client has been re-crawled";
every client WAS re-crawled, and O1 answers 17 of 105. It cannot reach zero, for a reason D5 did
not consider: a re-crawl refreshes the pages the crawl STILL FINDS, so the rows it no longer finds
keep their null, and `PAGES_MODULE.md` keeps those rows on purpose. Backfilling them is not merely
dishonest but unrepresentable — CHECK `checks_applicable = cardinality(checks_judged)`, written
under D4 to protect the column, refuses an invented `'{}'` on a row claiming eighteen applicable
checks. NOT NULL would therefore require deleting pages, which an invariant forbids.

Removing the null from the WIRE alone was tried and reverted the same day. It is unsound rather
than merely bold: `findCurrentPage` returns any page on its client's latest succeeded or partial
run, so a database where migration 0008 has run and a re-crawl has not has CURRENT pages with null
lists, and a non-null contract turns each into a failed request. It also contradicts PAGES-012,
which requires that a page whose crawl predates the recording says so.

What stands: `IPageDetail.checks` is `IPageCheck[] | null`, and the section says "Re-crawl this
page to see each check." for a page it cannot enumerate. Harvested to `PAGES_MODULE.md` and to
`be/skills/architecture-decisions/SKILL.md` — ask which rows the refilling act cannot reach before
promising a tightening phase.

**D10 (O4, answered).** The arithmetic sentence renders the quotient to two decimals with `≈` when
it does not terminate, not to one. At one decimal, 1 of 16 passed prints "6.3" above "rounded
half-up to 6". Pinned by `explainScore.test.ts` -> "never prints a quotient that rounds away from
the score", which walks every denominator the catalogue allows.
