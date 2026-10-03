<!-- ARCHIVED. Present tense below describes what this plan intended, not what is true. -->

# ARCHIVE HEADER

**Status:** archived 2026-10-03. **Branch:** `feat/page-health-and-catalogue`, 29 commits,
branched from `feat/keyword-tracker`. The plan's own `**Branch:** feat/keyword-tracker` line
below was written before that branch existed and is wrong; nothing else in the body was edited,
so it still reads as the plan that was executed.

**Built, and where it is pinned.** All three changes implemented in phase order, test-first.
Final state: lint and typecheck clean, 61 contracts + 347 backend + 156 frontend unit tests, 121
database tests, and a stack built, migrated and seeded from the live sites
(`docker compose -p skt-accuracy`, port 8081).

**Harvested into:**

| fact | now lives in |
| --- | --- |
| the applicability table of §10.1 — which five checks are conditional and on what, and why the denominator cannot be recovered at read time | `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` |
| why a threshold's bounds are snapshotted into the row (P3/D2) | the same document, plus `ANALYSIS-001` in `openspec/changes/page-analysis/` |
| the three-outcome verdict and why `null` could not be kept | the same document, and the comment on `TRuleVerdict` in `seo-rule.interface.ts` |
| why SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE were retired, with the measurements | already in `practices/search-engines/references/field-study-2026-10.md`, findings 3 and 4 — cited from the module document, never copied |
| the score's permitted claim and the Lighthouse band precedent | `practices/search-engines/references/ranking-signals.md`, cited from `page-score.util.ts` |
| the extraction defect and its two causes | the `HIDDEN_TEXT` comment in `extract-page.ts`, naming field study finding 7, plus the test name in `extract-page.spec.ts` |
| the score's honest denominator and the worst-first order, for a reviewer | `README.md`, decisions section |
| the status line that said the research binds nothing | `practices/search-engines/SKILL.md` |

**Left open, for a person:**

1. **The browser walks** — `seo-check-catalogue-correction` 4.6, `page-health-score` 4.4,
   `site-wide-issue-grouping` 2.5, and `readme-and-clean-clone` 2.3 before them. No browser was
   available where this ran. A seeded stack was left running at http://localhost:8081 for them.
2. **The OpenSpec archive and the deposit** — `site-wide-issue-grouping` 3.3 and 3.4. Sequenced
   after the walks, because an archive turns a delta into approved truth. Note for whoever does
   it: `PAGE_ANALYSIS_MODULE.md` **already exists** — §18 of this plan says no `*_MODULE.md` does,
   which stopped being true when `docs(be): module documents` landed. The deposit extends that
   file rather than creating it, and most of its content is already there.
3. **A stale developer database.** The shared `seo_tracker` database behind the default compose
   project still holds `KEYWORD_NOT_IN_TITLE` and `SLOW_RESPONSE` rows, which the new validator
   refuses — the detail screen would blank, I10 working as designed. OQ2's recovery was not run
   there because another session owns that stack. Never `docker compose down -v`.
4. **OQ5** — whether a future catalogue change needs the stale-analysis mechanism D9 declined.
   Carried into the README's unfinished section. Trigger unchanged: the first production deploy.

**Corrected while building** — the full trail is in the `AMENDED during implementation:` lines of
the three `tasks.md`. The one worth reading: §13's I9 test ("two pages scoring 50 and 90 come back
worst first") does **not** catch a missing `::numeric` cast. Under integer division both scores
collapse to 0, the rows tie, and `checks_failed desc` happens to produce the right order anyway —
the assertion passes while the bug is present. Catching it needs a case where the tie-break
*inverts* the order: 3 of 4 passed (75) against 8 of 10 (80). Verified by removing the cast.

---

# SEO analysis accuracy — a catalogue that can fail, a score with an honest denominator

The tracker already computes an SEO verdict for every crawled page and already shows it. This
work corrects the verdict itself against `practices/search-engines/` — the field study of
2026-10-03, which ran this repository's own `extractPage`, `extractKeywords` and
`evaluateSeoRules` against fifteen live blog pages from moz.com, vercel.com and
blog.cloudflare.com. Two checks that cannot tell a reader anything leave the catalogue, one that
varies on real data joins it, a threshold verdict starts carrying the bounds it was judged
against so an old row still explains itself, every page gains a **health score** whose
denominator counts only the checks that could apply to that page, the pages list is ordered
**worst first** so triage starts at the top, and a finding shared by several pages of one client
reads as one finding rather than five. A confirmed extraction defect found on a live page — a
copy-link control fused into a heading, which put `headingagentic infrastructure` into a page's
keywords — is fixed alongside.

**Status:** active
**Branch:** `feat/keyword-tracker`
**Changes:** readme-and-clean-clone (existing, prerequisite), seo-check-catalogue-correction,
page-health-score, site-wide-issue-grouping

## How to read this

Present tense describes the intended state, not the current one. Names marked **new** do not
exist yet; everything else was read in the tree while this was written, and anything that could
not be verified is written as `VERIFY:` rather than asserted. §1–§12 are the specification;
§13–§14 say what pins it; §15 is the sequence, and each change's `tasks.md` is **generated from
§15** and corrected through this document, never beside it. The requirement-id convention, the
delta heading form, the harvest rule and the task vocabulary are owned by `openspec/README.md`
and `openspec/config.yaml` and are not restated here.

---

## 1. User-visible behaviour

### 1.1 Pages (`/pages`)

- A new **Score** column sits immediately after **Page**: a number 0–100 with a coloured band —
  red 0–49, yellow 50–89, green 90–100 — and, beneath it in small dimmed text, the fraction it
  came from, e.g. `14/16 checks`. The denominator is the number of checks that *could* be judged
  on that page, so two pages with different denominators do not silently compare as equals.
- **The list is ordered worst first.** The lowest score is row one. Pages are no longer grouped
  by client name; with several clients the list interleaves them, and each row's client badge
  keeps the origin visible. That interleaving is the point: the score exists so a user can triage
  a portfolio, and an order that buries the worst page of the second client under the best page
  of the first defeats it.
- The **SEO issues** cell keeps its severity badges and gains, when it applies, a dimmed suffix
  `· N site-wide` — the number of this page's findings that also appear on at least one other
  current page of the same client. A number that appears on every row of a client is the signal
  that the fix belongs in a template, not on a page.
- Nothing else about the row changes: the keyword chips, the best position, the last capture date
  and the whole-row link are as they are.

### 1.2 Page detail (`/pages/:pageId`)

- The header's facts line gains the fetch's response time:
  `1,874 words · HTTP 200 · en · 234 ms to first byte · crawled 3 Oct 2025, 14:02`. It is a fact
  of the crawl, never a verdict. The screen says so in the one place it can: hovering the value
  shows "Time to first byte of one fetch from our crawler — not a field measurement of your
  visitors."
- A fifth KPI card, first in the row: **Health score**, the number with its band colour, noted
  `14 of 16 checks passed`.
- Each line of the **SEO issues** section gains, when the code appears on more than one of the
  client's current pages, a dimmed clause `· on 5 of 15 pages`. The sentence itself is unchanged.
- A measured finding reads from its own stored numbers: `The title is 72 characters; aim for
  30–60.` — and the 30–60 is the bound the crawl judged it against, not today's catalogue.
- Two sentences disappear from the screen because their checks no longer exist: "Slow server
  response" and "Top keyword not in the title". One appears: "No article structured data —
  Article or BlogPosting markup makes the post eligible for rich results; Google requires none."

### 1.3 What a user does NOT see

No sort control, no score filter, no "re-analyse" button, no score history. §19 says why for each.

## 2. Principles

Derived from the decision log in §20; used to settle anything this document forgot.

**P1 — A check that cannot fail is not a check.** A rule that cannot produce a finding by
construction reports success forever and, under a share-of-passed score, lifts every page by a
constant. Consequence: `KEYWORD_NOT_IN_TITLE` leaves the catalogue (D6), and any future rule must
come with the page shape that makes it fire.

**P2 — A measurement of the crawler is not a property of the page.** Consequence: `SLOW_RESPONSE`
leaves the catalogue and `response_ms` is shown as a fact of the fetch (D7). The same reasoning
refuses, in advance, any rule built on a single server-side timing.

**P3 — A row explains its own verdict.** The bounds a value was judged against are written into
the row at crawl time, not read from the catalogue when the screen renders. Consequence: changing
a threshold does not retroactively rewrite what an old crawl concluded (D2).

**P4 — A denominator is only honest where applicability is still known.** The parsed page knows
whether it had a canonical, an image, a second heading; the `pages` row does not — it holds no
canonical, no Open Graph, no JSON-LD. Consequence: applicability is counted at crawl time and
stored; the score is divided at read time (D3).

**P5 — A number a user acts on invents no weights.** The score is the share of applicable checks
that passed, each check equal. Consequence: severity is presentation, not arithmetic, and moving
`TITLE_LENGTH` from warning to notice changes how the screen reads and nothing else (D4).

**P6 — Presentation is computed at read time; only facts are stored.** `bestPosition` and
`lastCapturedAt` already work this way. Consequence: "on N pages" is a query, not a column (D11).

**P7 — A catalogue the code does not BUILD from is a second description.** Every list that
mirrors the catalogue — the rule registry, the measured-code set, the frontend sentence map, the
response validator — is derived from `SEO_ISSUE_CATALOGUE` or typed by it, so a code added or
removed without its companion does not compile.

**P8 — Nothing has been deployed, so nothing is carried.** No stale-analysis mechanism, no
nullable counters, no "no score yet" state on any screen (D9).

## 3. Data model

One table changes. The style follows the column factories in
`be/src/persistence/schema/_shared/columns/`.

```ts
// be/src/persistence/schema/tables/pages/pages.schema.ts — added inside pgTable('pages', {...})

    // Time to first byte of the crawler's single fetch. A fact of the crawl, never a verdict:
    // the same site answered in 41 ms and 1728 ms minutes apart (field study, finding 3).
    responseMs: integer('response_ms').notNull(),      // CHANGED: comment only

    // How many catalogue checks could be judged on this page, and how many of them failed.
    // Written by the same act that writes the page's issues, because applicability is only
    // knowable while the parsed page is in hand — this row holds no canonical, no Open Graph
    // and no JSON-LD, so it cannot be recovered later (P4). The score is applicable-minus-failed
    // over applicable, derived at read time.
    checksApplicable: smallint('checks_applicable').notNull(),
    checksFailed: smallint('checks_failed').notNull(),
```

and, in the table's second argument beside the existing indexes:

```ts
    check('pages_checks_applicable_positive', sql`${t.checksApplicable} > 0`),
    check('pages_checks_failed_range',
      sql`${t.checksFailed} >= 0 and ${t.checksFailed} <= ${t.checksApplicable}`),
```

| column | type | null means | why it exists |
| --- | --- | --- | --- |
| `checks_applicable` | `smallint NOT NULL` | — (never null, P8) | the score's denominator; `> 0` is a database fact, so the division cannot be by zero |
| `checks_failed` | `smallint NOT NULL` | — (never null, P8) | the numerator's complement; `<= applicable` is a database fact, so a score cannot exceed 100 |

**No default.** `ALTER TABLE pages ADD COLUMN ... NOT NULL` without a default fails on a table
that already has rows (`ERROR: column "checks_applicable" of relation "pages" contains null
values`). That is correct for the reviewer's path — clone, migrate onto an empty database, seed
(C2) — and it is a developer-only inconvenience locally; §20 OQ2 states the recovery, which never
touches a docker volume.

`seo_issues` is unchanged: `details_json` keeps holding whatever the rule returned, and what
changes is the SHAPE the rule is allowed to return (§5). The migration is generated with
`pnpm db:generate`, read, then applied — never hand-written.

## 4. Invariants and their enforcement

| # | invariant | the mechanism that makes violating it impossible |
| --- | --- | --- |
| I1 | every catalogued code has exactly one rule | `SEO_RULES: { [K in TSeoIssueCode]: TSeoRule<K> }` — a mapped type; a missing key is TS2741 |
| I2 | a measured code's finding is a measurement, a plain code's is details | `TSeoRule<K>`'s return type is conditional on `K extends TMeasuredIssueCode`; returning the wrong one does not compile |
| I3 | the measured-code set is exactly the catalogue entries carrying a bound | `MEASURED_ISSUE_CODES` is *derived* from `SEO_ISSUE_CATALOGUE` at runtime and its type from the same object; no second list exists to drift |
| I4 | the frontend has a sentence for every code | `DESCRIBE: Record<TSeoIssueCode, …>` in `groupIssues.ts` — already in place; a removed code makes its entry an excess-property error, an added code a missing-property error |
| I5 | the score's denominator is never zero | `CHECK pages_checks_applicable_positive` |
| I6 | the score is never above 100 or below 0 | `CHECK pages_checks_failed_range` |
| I7 | every page has both counters | `NOT NULL`, no default (P8) |
| I8 | a page appears exactly once across the paginated list | the `ORDER BY` ends in `p.id`, which is unique, so the order is total (C1) |
| I9 | the score's SQL ordering and the displayed score agree in direction | one shared formula in `@app/contracts` for display; a monotonic SQL expression for the order, pinned by the int-spec in §13 |
| I10 | a stored issue code is always a catalogue code | `z.enum(SEO_ISSUE_CODES)` in `seoIssueSchema` — a retired code reaching the browser is a parse error, by design |
| I11 | heading text contains no accessibility-only label | the extractor removes `[aria-hidden="true"]`, `[hidden]` and the visually-hidden class set before reading, and strips controls from headings |
| I12 | "on N pages" counts the client's current pages, not the filtered slice | the spread subquery is built from the unfiltered `current_pages` set; pinned by the int-spec in §13 |

## 5. Wire contract (`@app/contracts`)

Everything below ships together — the backend writes it and the frontend's zod schemas are
declared `satisfies z.ZodType<…>`, so a contract field added without its validator fails
`pnpm typecheck` in `fe`. That is the mechanism, not a convention.

### 5.1 The catalogue, 19 codes → 18

```ts
// packages/contracts/src/domain/seo/seo-issue-catalogue.constant.ts
  TITLE_LENGTH: {
    severity: 'notice',                                   // was 'warning' (D4)
    label: 'Title length',
    hint: 'Titles outside 30–60 characters are cut off or waste the space in results.',
    min: 30, max: 60,                                     // numbers unchanged (D4)
  },
  …
  STRUCTURED_DATA_MISSING: {                              // new (D8)
    severity: 'notice',
    label: 'No article structured data',
    hint: 'Article or BlogPosting markup makes the post eligible for rich results; Google requires none.',
  },
```

Removed: `SLOW_RESPONSE` (P2/D7) and `KEYWORD_NOT_IN_TITLE` (P1/D6). The `hint` of
`STRUCTURED_DATA_MISSING` speaks about eligibility, never about a violation — Google requires no
structured data, and a hint that implies otherwise is the kind of false urgency an audit tool is
judged for (`practices/search-engines/references/ranking-signals.md`, "correct markup earns
eligibility, not display").

### 5.2 The measurement and the issue

```ts
// packages/contracts/src/domain/seo/seo-measurement.interface.ts — new
/** A measured verdict: the value as found, and the bounds it was judged against. */
export interface ISeoMeasurement {
  value: number;
  min?: number;
  max?: number;
}

// packages/contracts/src/domain/seo/measured-issue-codes.constant.ts — new
/** Codes whose catalogue entry declares a bound. Derived: there is no second list (I3). */
export type TMeasuredIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends { min: number } | { max: number }
    ? K
    : never;
}[TSeoIssueCode];

export const MEASURED_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => 'min' in SEO_ISSUE_CATALOGUE[code] || 'max' in SEO_ISSUE_CATALOGUE[code],
) as TMeasuredIssueCode[];

// packages/contracts/src/domain/seo/seo-issue.interface.ts — rewritten
export type TIssueDetails<TCode extends TSeoIssueCode> =
  TCode extends TMeasuredIssueCode ? ISeoMeasurement : Record<string, unknown>;

/** One issue on a page. A union over the code, so `details` is narrowed by it. */
export type TSeoIssue = {
  [K in TSeoIssueCode]: {
    code: K;
    severity: TSeoIssueSeverity;
    details: TIssueDetails<K>;
  };
}[TSeoIssueCode];
```

After the change, `MEASURED_ISSUE_CODES` is exactly `TITLE_LENGTH`, `META_DESCRIPTION_LENGTH`,
`THIN_CONTENT`, `LARGE_PAGE`. Their stored details become `{ value, min?, max? }` — so
`TITLE_LENGTH` is `{ value: 72, min: 30, max: 60 }` where it used to be
`{ length: 72, min: 30, max: 60 }`, and `THIN_CONTENT` is `{ value: 227, min: 300 }` where it
used to be `{ words: 227, min: 300 }`. One field name across all measured codes is what lets the
frontend read them without a per-code accessor.

**`ISeoIssue` is renamed `TSeoIssue`.** It is a union, and `practices/naming/SKILL.md` gives `T`
to a type alias and `I` to an interface. Not pinned by a lint rule — there is no
`@typescript-eslint/naming-convention` entry in `be/eslint.config.mjs` — so review holds it. The
rename touches the contracts barrel, `page-analysis.service.ts`, `crawl-results.service.ts`,
`seo-rules.registry.ts` and `seo-issues.repository.ts`; the frontend's own
`TSeoIssue = z.infer<typeof seoIssueSchema>` is a different module's name and stays.

### 5.3 The score

```ts
// packages/contracts/src/domain/pages/page-score/page-score.util.ts — new
export interface IPageScore {
  /** 0–100: the share of applicable checks that passed. */
  value: number;
  /** Checks that could be judged on this page. Always > 0. */
  applicable: number;
  failed: number;
}

/** One formula, both sides. Rounded half-up; the band is the caller's business. */
export function pageScoreOf(applicable: number, failed: number): IPageScore { … }

// packages/contracts/src/domain/seo/score-band.constant.ts — new
/** Lighthouse's published bands, adopted because its model is public and ours matches it:
 *  a share of equally weighted binary audits. */
export const SCORE_BANDS = [
  { max: 49, band: 'poor' },
  { max: 89, band: 'average' },
  { max: 100, band: 'good' },
] as const;
```

### 5.4 The payloads

```ts
// IPageListItem gains
  score: IPageScore;
  issues: IPageIssueCounts;           // gains one field:
    //   siteWide: number — of this page's findings, how many also appear on at least one
    //   other current page of the same client.

// IPageDetail gains
  score: IPageScore;
  page.responseMs: number;            // the crawl fact (D7/P2)
  issues: (TSeoIssue & { pagesAffected: number })[];
    //   pagesAffected — how many of the client's current pages carry this code, including
    //   this one. 1 means it is this page's problem.
```

`score` and `page.responseMs` are required, not optional: there is no page without them (P8), and
an optional field invites a "—" state the design does not have.

## 6. API surface

No endpoint is added, removed or renamed. `GET /api/pages`, `GET /api/pages/:id` and
`GET /api/pages/:id/positions` keep their paths, their DTOs and their authorization — every query
stays scoped to `scope.userId` inside the SQL, and a foreign `clientId` or page id stays a 404
(`ISO-002`).

Changed response shapes: `GET /api/pages` items gain `score` and `issues.siteWide`;
`GET /api/pages/:id` gains `score`, `page.responseMs` and `pagesAffected` per issue, and its
measured issues carry `{ value, … }`.

**Explicitly NOT added:**

- **No `sort` query parameter.** A second order needs a second deterministic tie-breaker and a
  second thing to keep stable across pages (C1); nothing in the brief asks for one, and
  worst-first is the order the score exists to produce (D10).
- **No `minScore` / `maxScore` filter.** The list is 15 pages per client; a filter would be
  scaffolding around a problem nobody has.
- **No re-analysis endpoint.** Re-crawl already replaces a page's issues and now its counters
  (`CRAWL-009`, `ANALYSIS-007`); a second way to reach the same state is a second way to be wrong.

## 7. Services and modules

No new NestJS module. The changes land where the ownership already is:

| unit | change | why here |
| --- | --- | --- |
| `be/src/modules/page-analysis/services/seo-rules/seo-rule.interface.ts` | `TSeoRule<K>` returns a verdict union; `ISeoRuleInput` loses `topKeyword` and `responseMs` | the rule's contract is the one place the three outcomes can be made exhaustive |
| `…/seo-rules/rules/structured-data-rules/structured-data-rules.ts` **new** | `STRUCTURED_DATA_MISSING` | a seventh group, one subject per group as the other six are |
| `…/seo-rules/rules/keyword-rules/` **deleted** | its only code is retired | an empty group left behind is an invitation to refill it |
| `…/seo-rules/rules/transport-rules/transport-rules.ts` | loses `SLOW_RESPONSE` | P2 |
| `…/seo-rules/seo-rules.registry.ts` | `evaluateSeoRules` returns `{ issues, applicable, failed }` | the three counts come from one pass over the rules; computing them twice is how they disagree |
| `…/services/page-analysis/page-analysis.service.ts` | `IPageAnalysis` gains `checksApplicable`, `checksFailed`; rules no longer need the keyword result | with `topKeyword` gone, issue evaluation no longer depends on keyword extraction — a dependency that existed only for the retired rule |
| `…/services/html-extraction/extract-page.ts` | separator pass moves before heading and block collection; accessibility-only elements and in-heading controls are removed | the defect is in what the extractor reads, so the fix belongs where reading happens, not in a downstream filter |
| `be/src/modules/pages/services/crawl-results/crawl-results.service.ts` | `IRunPage` and `IUpsertPage` carry the two counters | the counters are written in the same statement as the page, in the same transaction as the issues (`ANALYSIS-007`) |
| `be/src/modules/pages/repositories/pages/pages.repository.ts` | the upsert's `set` block adds both counters | a re-crawl that refreshed the issues but kept the old counters would produce a score that contradicts the issue list |
| `be/src/modules/pages/repositories/page-list/page-list.repository.ts` | the slice selects both counters and orders worst-first; a fifth statement returns the per-client code spread | the list's four-statements-whatever-the-page-size rule becomes five; still constant, still no query per row |
| `be/src/modules/pages/repositories/page-detail/page-detail.repository.ts` | `findCurrentPage` selects `response_ms` and both counters; `issuesForPage` returns `pagesAffected` | one more column and one more join, no new round trip |
| `be/src/modules/pages/services/page-read/page-read.service.ts` | maps `pageScoreOf(...)` into both payloads; counts `siteWide` | the read service is already where `bestPosition` and `lastCapturedAt` are derived (P6) |

## 8. Catalogues and their execution

No API error code is added — `packages/contracts/src/domain/http/api-error-code.constant.ts` is
untouched, and nothing in this work can fail in a way a user must be told about by code.

The catalogue this work does change is `SEO_ISSUE_CATALOGUE`, and P7 is the rule it must satisfy.
Four pieces of code must BUILD from it, each with the thing that ties them together:

| what reads the catalogue | how | what catches a drift |
| --- | --- | --- |
| the rule registry | `{ [K in TSeoIssueCode]: TSeoRule<K> }` | `pnpm typecheck` (TS2741) |
| the measured-code set | `SEO_ISSUE_CODES.filter(code => 'min' in … \|\| 'max' in …)` | `measured-issue-codes.test.ts` asserts the derived list equals the four expected codes AND that every catalogue entry with a bound is in it — so adding a bounded code without noticing fails the test |
| the frontend sentence map | `Record<TSeoIssueCode, (details) => string>` | `pnpm --filter fe typecheck` |
| the response validator | `z.enum(SEO_ISSUE_CODES)` and a per-code details schema built by mapping `SEO_ISSUE_CODES`, measured codes getting `measurementSchema` | `PageSchemas` is `satisfies z.ZodType<IPageDetail>`; plus a unit test that a `TITLE_LENGTH` payload with no `value` fails to parse |

## 9. Background work

The analysis runs where it already runs: inside the crawl worker, after every page of a run is
fetched, pure and outside any transaction
(`be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.ts`, `analyseRun`
at line 125). The counters are produced by the same call that produces the issues and travel with
them into `finalize`'s single transaction, so a run cannot store issues without counters or
counters without issues.

Failure behaviour is unchanged and needs no new case: a page that could not be fetched never
reaches the analysis, so it has no row and no counters; a run that dies mid-way writes nothing
(`CRAWL-003`); a retried attempt that loses the race is dropped whole. The one new way the write
can fail is a CHECK violation, and that is the intended outcome — a bug that produced
`failed > applicable` must abort the run's finalize rather than store an impossible score.

## 10. Algorithms

### 10.1 A rule's verdict, in three outcomes

```ts
// be/src/modules/page-analysis/services/seo-rules/seo-rule.interface.ts
export type TRuleVerdict<TCode extends TSeoIssueCode> =
  | { outcome: 'pass' }
  | { outcome: 'notApplicable' }
  | { outcome: 'fails'; details: TIssueDetails<TCode> };

export type TSeoRule<TCode extends TSeoIssueCode> =
  (input: ISeoRuleInput) => TRuleVerdict<TCode>;

export type TSeoRuleGroup<TCode extends TSeoIssueCode> = { [K in TCode]: TSeoRule<K> };
```

`pass` and `notApplicable` both produce no issue and differ only in the denominator. That is the
whole reason the third outcome exists, and it is why the previous `null` return could not be kept:
`TITLE_LENGTH` returning `null` meant *either* "the title is 45 characters" *or* "there is no
title", and no caller could tell them apart.

Rewritten rules, with their applicability condition:

| code | not applicable when | fails when |
| --- | --- | --- |
| `TITLE_MISSING` | never | `parsed.title === null` |
| `TITLE_LENGTH` | `parsed.title === null` | length `< 30` or `> 60` → `{ value, min, max }` |
| `META_DESCRIPTION_MISSING` | never | `parsed.metaDescription === null` |
| `META_DESCRIPTION_LENGTH` | `parsed.metaDescription === null` | length `< 70` or `> 160` → `{ value, min, max }` |
| `H1_MISSING` | never | `parsed.h1s.length === 0` |
| `H1_MULTIPLE` | never | `parsed.h1s.length > 1` |
| `HEADING_SKIP` | `parsed.headings.length < 2` | a jump of more than one level |
| `CANONICAL_MISSING` | never | `parsed.canonical === null` |
| `CANONICAL_MISMATCH` | `parsed.canonical === null` | canonical is not the same document as `finalUrl` |
| `NOINDEX` | never | `noindex`/`none` in the meta robots or `X-Robots-Tag` |
| `IMAGES_MISSING_ALT` | `parsed.images.length === 0` | at least one image with an absent `alt` |
| `THIN_CONTENT` | never | `wordCount < 300` → `{ value, min }` |
| `LANG_MISSING` | never | `parsed.lang === null` |
| `OG_TAGS_MISSING` | never | any of `og:title`, `og:description`, `og:image` absent |
| `NOT_HTTPS` | never | `finalUrl` starts with `http:` |
| `REDIRECTED` | never | `redirected` |
| `LARGE_PAGE` | never | `htmlBytes > 1_048_576` → `{ value, max }` |
| `STRUCTURED_DATA_MISSING` | never | `parsed.jsonLd.types` intersects `ARTICLE_TYPES` nowhere |

Thirteen checks always apply; five are conditional. So on any page
`13 <= checks_applicable <= 18`, which is the floor §13 pins and the reason OQ1's "a page with a
denominator of 2" cannot occur with this catalogue.

```ts
// …/rules/structured-data-rules/structured-data-rules.ts
/** Google's documented article types and the subtypes a blog realistically emits. A page
 *  declaring any of them is eligible for the article rich result; one declaring none is not. */
const ARTICLE_TYPES = new Set([
  'Article', 'NewsArticle', 'BlogPosting', 'TechArticle',
  'ScholarlyArticle', 'Report', 'LiveBlogPosting',
]);
```

### 10.2 One pass, three results

```ts
export interface ISeoEvaluation {
  issues: TSeoIssue[];        // catalogue order, as today
  checksApplicable: number;   // outcomes that were not 'notApplicable'
  checksFailed: number;       // outcomes that were 'fails' — always issues.length
}
export function evaluateSeoRules(input: ISeoRuleInput): ISeoEvaluation
```

`checksFailed === issues.length` always, and the assertion that says so lives in the registry
spec. Storing both anyway is deliberate: the column is what the score reads, and a column derived
from a count the reader cannot see is worse than a redundant one the database can check.

### 10.3 The score

```
value = round(100 * (applicable - failed) / applicable)
```

Half-up rounding, one implementation in `pageScoreOf`. The claim it is allowed to make is the one
`ranking-signals.md` permits: *this page has no obvious technical defects.* Not a traffic
prediction, not a comparison with a competitor, not a quality judgement. The wording on both
screens stays inside that.

### 10.4 The list's order, and why pagination survives it

```sql
order by (p.checks_applicable - p.checks_failed)::numeric / p.checks_applicable asc,
         p.checks_failed desc,
         c.name, c.id, p.sitemap_position, p.id
```

Three things here are load-bearing and each has a defect behind it:

1. **`::numeric`.** `checks_applicable` and `checks_failed` are `smallint`; without the cast
   Postgres does integer division and every score collapses to `0` or `1`. The int-spec in §13
   seeds two pages scoring 50 and 90 and asserts the order, which is exactly the assertion an
   integer division fails.
2. **`p.id` last.** The key is unique, so the order is total. Without it, pages with equal scores
   have no defined relative order and the database is free to return them differently for
   `offset 0` and `offset 20` — rows repeat and vanish between pages. This is C1, and it is the
   same discipline the repository already adopted (one current-run order everywhere).
3. **`checks_failed desc` second.** Among equal scores, the page with more failures is the bigger
   job. It is a tie-breaker with a meaning, not a coin toss.

The sort runs over the `current_pages` CTE, which is at most the user's current pages across all
their clients — 30 rows in the seeded database. No index serves a sort through a CTE and none is
added; §15 phase 2c's acceptance is an `EXPLAIN (ANALYZE, BUFFERS)` recorded in the commit body,
showing the plan and the row count, so the decision is evidence and not assumption. The large
table in this system is `rank_snapshots` (50,000+ rows, `SEED-003`) and this ordering does not
touch it.

### 10.5 The spread — "on N pages"

```sql
-- a fifth statement, over the client's CURRENT pages, NOT over the filtered slice
with client_pages as (            -- the same current_runs join, WITHOUT the search filter
  …
)
select p.client_id, i.code, count(*)::int as pages
from client_pages p
join seo_issues i on i.page_id = p.id
where p.client_id in (<the slice's distinct client ids>)
group by p.client_id, i.code
```

The detail screen's `pagesAffected` is the same number for one client. **The search filter must
not reach this query**: with `?q=audit` matching one page, a code affecting five pages must still
report five. That is I12, and §13 names the test; the defect it prevents is the one a reader
would never question, because "on 1 page" looks plausible.

For the list, `issues.siteWide` for a page is the number of its distinct codes whose spread for
that client is `> 1`.

### 10.6 The extraction defect

Two causes, from `practices/search-engines/references/field-study-2026-10.md` finding 7. Vercel
puts a copy-link control inside each `<h2>`; the heading text came back as
`Copy link to headingAgentic infrastructure`, and `headingagentic infrastructure` and
`headingthe future` were returned as that page's keywords.

**Cause 1 — nodes fuse.** `extractPage` inserts a separating space after block and layout
elements (`main.find(...).after(' ')`, line 52) but does it *after* headings and blocks have
already been collected (lines 34–50), so the headings never see it. **Fix:** run the separator
pass first, on the cloned main content, before any text is read, and add `button, label, a` to
the elements it follows. Collapsing afterwards removes the doubled spaces, so nothing else moves.

**Cause 2 — accessibility-only labels are content to `.text()`.** **Fix:** remove from the clone,
alongside the existing `NON_CONTENT` removal:

```ts
/** Text present only for assistive technology, or hidden from it; neither is page content.
 *  A copy-link control inside a heading made "Copy link to headingAgentic infrastructure"
 *  on vercel.com (field study, finding 7). */
const HIDDEN_TEXT =
  '[aria-hidden="true"], [hidden], .sr-only, .visually-hidden, .visuallyhidden, ' +
  '.screen-reader-text, .screen-reader-only, .a11y-hidden';
```

and, inside a heading only, drop `button, [role="button"]` — a control is chrome, not heading
text. Scoped to headings because a button's label in body copy is sometimes the only word a
paragraph has.

**This moves the golden fixture output.** `extract-keywords.spec.ts` runs over 15 recorded Yoast
posts and asserts properties, not snapshots — 5–8 keywords, top relevance 1, a slug phrase in the
top 3 of at least 12 pages, no bare "yoast" in any top 3 — so it may well still pass. If a
property assertion fails, that is a finding to record as an `AMENDED during implementation:` line
with the before and after, never a bound to loosen quietly. The commit body records the top three
keywords of `/how-to-remove-www-from-your-url/` before and after, so the diff is visible to a
reviewer who was not there.

## 11. Scenario walkthroughs

**11.1 A Moz page is crawled, scored and triaged.** The crawler fetches
`moz.com/blog/mozcon-london-2025`: a 63-character title, a 149-character description, two `h1`s,
an irregular outline, `Article` + `Organization` + `BreadcrumbList`. Every rule runs once. All
eighteen are applicable except none — the page has a title, a description, a canonical, images
and many headings, so `checks_applicable = 18`. `TITLE_LENGTH` fails with
`{ value: 63, min: 30, max: 60 }`, `H1_MULTIPLE` with `{ count: 2 }`, `HEADING_SKIP` with its
jump; `STRUCTURED_DATA_MISSING` passes. `checks_failed = 3`, and the same transaction writes the
page, its keyword pairs, its three issue rows and `18 / 3`. The user opens `/pages`: the page
shows **83**, yellow, `15/18 checks`, and sits below the three pages scoring worse. Its issues
cell reads `1 warning 2 notices · 2 site-wide` — `H1_MULTIPLE` and `HEADING_SKIP` are on all five
Moz pages, so the user opens one, sees `· on 5 of 5 pages` beside each, and fixes the template
once.

**11.2 A threshold is changed later, and an old verdict still explains itself.** Somebody decides
titles up to 65 characters are fine and edits the catalogue. The Moz page's row still says
`{ value: 63, min: 30, max: 60 }`, so the screen still reads "The title is 63 characters; aim for
30–60." — the verdict and its justification agree, because the crawl that made the judgement
wrote both (P3). The next crawl re-evaluates against 65, the row is replaced whole
(`replaceForPagesForWorker`), the issue disappears and `checks_failed` drops to 2. Nothing
anywhere has to know that a threshold moved.

**11.3 A page with no description and no images.** A short announcement page: no meta
description, no images, two headings, a canonical. `META_DESCRIPTION_LENGTH` is **not
applicable** — there is nothing to measure — and so is `IMAGES_MISSING_ALT`.
`checks_applicable = 16`. It fails `META_DESCRIPTION_MISSING` and `THIN_CONTENT`
(`{ value: 227, min: 300 }`), so `14/16` → **88**. The page is not punished twice for the missing
description, and it is not rewarded for having no images — which is exactly what a fixed
denominator of 18 would have done, in one direction or the other.

## 12. Frontend

Routes are unchanged: `/sign-in`, `/pages`, `/pages/$pageId`, `/clients` all exist today, and
`pagesSearchSchema` gains no key (no sort parameter, §6).

| unit | change | states it must render |
| --- | --- | --- |
| `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` | `pageScoreSchema`; `seoIssueSchema` becomes a per-code union with `measurementSchema` for measured codes; `pageListItemSchema.issues` gains `siteWide`; `pageDetailSchema.page` gains `responseMs` | a response missing `score` is a parse error, surfaced by the existing gateway error path — not a blank cell (`GATEWAY-001`) |
| `fe/src/Modules/_Shared/ScoreBadge/ScoreBadge.tsx` **new** | the number, its band colour, and an optional `14/16 checks` note | one state: there is always a score (P8) |
| `fe/src/Modules/Pages/PagesTable/PagesTable.tsx` | a **Score** column after **Page**; `IssueCounts` gains the `· N site-wide` suffix | loading (the existing skeleton rows, now one column wider), error, four empty kinds, and the stale-while-reloading class — all already built, none new |
| `fe/src/Modules/PageDetail/KpiCards/KpiCards.tsx` | a fifth card, **Health score**, first; grid `cols={{ base: 1, xs: 2, md: 5 }}` | no new state; the card is never absent |
| `fe/src/Modules/PageDetail/PageDetailHeader/PageDetailHeader.tsx` | `· 234 ms to first byte` in the facts line, with the tooltip from §1.2 | no new state |
| `fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts` | `DESCRIBE` loses two entries, gains `STRUCTURED_DATA_MISSING`, and the four measured codes read `d.value` with the stored `d.min`/`d.max`; `IIssueView` gains `pagesAffected` | — |
| `fe/src/Modules/PageDetail/IssuesSection/IssuesSection.tsx` | the `· on N of M pages` clause when `pagesAffected > 1` | — |

**An observed divergence, not fixed here.** `PAGEDETAIL-001` says the fourth KPI card is "last
crawl status"; `KpiCards.tsx` currently renders "Average position". `tracker-screens` is 0/13 in
its `tasks.md` and the screen is still being built, so this plan adds the score card beside what
is there and leaves the divergence to that change. Recorded so the next reader does not treat
the spec as a description of the code.

## 13. Invariants ↔ tests

| # | pinned by |
| --- | --- |
| I1 | `seo-rules.registry.spec.ts` → "has exactly one rule per catalogued code" (exists), plus `pnpm typecheck` — the mapped type is the real guard; the test documents it |
| I2 | **typecheck.** `title-rules.spec.ts` → "a 61-character title fails with `{ value: 61, min: 30, max: 60 }`" pins the runtime shape |
| I3 | `packages/contracts/src/domain/seo/measured-issue-codes.test.ts` → "the derived set is exactly the four bounded codes" and "every catalogue entry with a min or a max is in it" |
| I4 | **typecheck** (`pnpm --filter fe typecheck`) — `Record<TSeoIssueCode, …>` |
| I5, I6 | `pages.repository.int-spec.ts` → "a page with `checks_failed` above `checks_applicable` violates `pages_checks_failed_range`" and "`checks_applicable = 0` violates `pages_checks_applicable_positive`", using `be/test/support/expect-pg-error.ts` |
| I7 | **typecheck** on `IUpsertPage`, plus the same int-spec inserting without the counters |
| I8 | `page-list.repository.int-spec.ts` → "walking every page at `pageSize = 3` returns each id exactly once and all of them" — seeded with pages that tie on score |
| I9 | `page-list.repository.int-spec.ts` → "two pages scoring 50 and 90 come back worst first" (the assertion integer division fails) and `page-read.service.spec.ts` → "the items' scores are non-decreasing" |
| I10 | `PageSchemas.test.ts` → "an issue with an unknown code fails to parse" (follow the existing gateway test placement) |
| I11 | `extract-page.spec.ts` → "a copy-link control inside an h2 is not part of the heading (vercel.com, field study finding 7)" and "an element with `aria-hidden` contributes no text" |
| I12 | `page-list.repository.int-spec.ts` → "a search matching one page still reports the code as affecting five" |

Every invariant in §4 appears above; none is left `not pinned by a test`.

## 14. Test plan

Conventions are owned by `practices/be/nestjs/testing-patterns/SKILL.md`,
`practices/fe/react/testing/SKILL.md` and `fe/skills/testing/SKILL.md`; what follows is the kind,
the placement and what only that kind proves.

**unit (be, jest, `*.spec.ts` beside the unit)**

- `title-rules.spec.ts`, `meta-rules.spec.ts`, `content-rules.spec.ts`, `transport-rules.spec.ts`,
  `heading-rules.spec.ts`, `indexing-rules.spec.ts` — rewritten for the verdict union: each
  threshold at, below and above its bound, plus **the not-applicable case for each of the five
  conditional rules**. Only a unit test can assert that a missing title yields `notApplicable`
  and not `pass`; nothing downstream can see the difference except through the counter.
- `structured-data-rules.spec.ts` **new** — `Article` passes, `BlogPosting` passes,
  `Organization` alone fails, no JSON-LD fails. What makes it fail: delete a member of
  `ARTICLE_TYPES`.
- `seo-rules.registry.spec.ts` — extended: `checksApplicable + notApplicable = 18`,
  `checksFailed === issues.length`, and over **every recorded fixture post**
  `13 <= checksApplicable <= 18`. That last assertion is what makes OQ1 a measured claim rather
  than a hope; it fails the day a rule's applicability condition is written too broadly.
- `extract-page.spec.ts` — the two I11 cases, written from the real markup shape.
- `pick-best-position.spec.ts`, `page-read.service.spec.ts` — the latter extended for score
  mapping and `siteWide` counting with a mocked repository.
- `page-score.util.test.ts` (contracts, vitest) — `18/0 → 100`, `16/2 → 88`, `3/3 → 0`,
  half-up rounding at `.5`.
- `measured-issue-codes.test.ts` (contracts, vitest) — I3.

**fixture (be, jest, offline, never the network)**

- `extract-keywords.spec.ts` — unchanged assertions, re-run after §10.6. It is the only check
  that the extraction fix did not quietly degrade keyword quality across 15 real pages.

**integration / DB (be, `*.int-spec.ts`, `pnpm --filter be test:db`)**

- `pages.repository.int-spec.ts` — I5, I6, I7: only a real Postgres decides whether a CHECK
  constraint rejects a row, and only a real upsert proves the counters are refreshed on conflict
  rather than left at their first value.
- `page-list.repository.int-spec.ts` — I8, I9, I12 and the five-statement count. The pagination
  walk needs real `LIMIT/OFFSET` against a real planner; a mocked repository cannot produce the
  defect it exists to catch.

**e2e (API, `be/test/e2e/*.e2e-spec.ts`)**

- `pages.e2e-spec.ts` — the list's first item has the lowest score; a detail response carries
  `score`, `page.responseMs` and a `TITLE_LENGTH` issue shaped `{ value, min, max }`. What only
  this kind proves: the wire shape after serialization, through the real controller and guard.
- `isolation-matrix.e2e-spec.ts` — unchanged, re-run: the new columns and the new statement must
  not open a path to another user's page.
- `crawl.e2e-spec.ts` — after a crawl, every stored page has `checks_applicable` between 13 and
  18 and `checks_failed` equal to its issue count. This is the only test that exercises the write
  path end to end, and the seeding step's run status is asserted, not assumed.

**fe (vitest, `*.test.tsx` beside the component)**

- `PagesTable.test.tsx` — the score cell renders the band colour; `· 2 site-wide` appears only
  when `siteWide > 0`.
- `IssuesSection.test.tsx` — `· on 5 of 15 pages` appears when `pagesAffected > 1` and not when
  it is 1.
- `groupIssues.test.ts` — the measured sentence reads from `value`/`min`/`max`;
  `STRUCTURED_DATA_MISSING` has a sentence.
- `PageSchemas.test.ts` — I10, and a measured issue without `value` fails to parse.

**typecheck / lint** — I1, I2, I4, I7 and the whole §5 wire contract, at no runtime cost.

**What makes each new test fail** is stated above for the ones where it is not obvious. For the
rest the rule is: write it before the change and watch it fail for the stated reason (§15 names
which), because a test first seen green has proved nothing.

## 15. Work order

Phase acceptance always ends with `pnpm lint && pnpm typecheck && pnpm test`, plus
`pnpm --filter be test:db`, plus `docker compose up -d --build` followed by
`curl -fsS http://localhost:8080/api/health`. A phase closes only when every task of the change
it names is closed. Commits are Conventional Commits on `feat/keyword-tracker`
(`skills/claude-workflow/SKILL.md`). Never `docker compose down -v`.

### Phase 0 — README and clean clone · change `readme-and-clean-clone` (existing, 0 of 6)

**This work does not start before this phase closes.** The README is the one outstanding
requirement of the brief: it still says "Work in progress", omits `pnpm seed` from the run
sequence, and carries no decisions, no unfinished section and no AI-tools section — four required
things, none of them present, in a document a reviewer reads first. Everything in phases 1–3
improves something that already works and already satisfies the brief. Shipping an improvement
over a missing README is optimising the wrong end.

The change owns its own six tasks; this plan adds none to it and copies none of them.

- Acceptance: `pnpm exec openspec status` shows `readme-and-clean-clone` at 6 of 6, and the
  change's own task 2.4 command has been run — `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter be test:db`
  from the clean-clone directory.
- Regression guard: none of phases 1–3 has begun, so nothing can have broken.
- Rollback: not applicable — a document and a verification run.

### Phase 1 — The catalogue says only what it can judge · change `seo-check-catalogue-correction`

Depends on: phase 0. Decisions D2, D4, D6, D7, D8 and the extraction defect. No schema change, so
this phase is deployable on its own and a user who stops here has a smaller, more honest
catalogue and correct keywords.

**1a. The catalogue and the measurement, in contracts**
- Deliverables: changed
  `packages/contracts/src/domain/seo/seo-issue-catalogue.constant.ts` (TITLE_LENGTH → notice;
  SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE removed; STRUCTURED_DATA_MISSING added);
  changed `…/seo/seo-issue.interface.ts` (`ISeoIssue` → `TSeoIssue`, union over the code); new
  `…/seo/seo-measurement.interface.ts`, `…/seo/measured-issue-codes.constant.ts`,
  `…/seo/measured-issue-codes.test.ts`; changed `packages/contracts/src/index.ts`.
- Pre-conditions: phase 0 closed.
- TDD: write `measured-issue-codes.test.ts` first → "the derived set is exactly TITLE_LENGTH,
  META_DESCRIPTION_LENGTH, THIN_CONTENT, LARGE_PAGE" — fails: the module does not exist.
- Acceptance: `pnpm --filter @app/contracts run test:ci`; `pnpm --filter @app/contracts run build`;
  `pnpm typecheck` **fails loudly** in `be` and `fe` with missing/excess catalogue keys — that
  failure is the deliverable of this sub-phase, and 1b and 1d clear it.
- Regression guard: nothing yet consumes the new types; the catalogue edit is what breaks the
  build, by design (P7).
- Rollback: revert; no data, no schema.
- Commits: `feat(contracts): a typed measurement for threshold findings`;
  `feat(contracts): retire SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE, add STRUCTURED_DATA_MISSING`;
  `refactor(contracts): ISeoIssue is a union, so it is TSeoIssue`.

**1b. The rules, in three outcomes' clothing minus the third**
- Deliverables: changed `be/src/modules/page-analysis/services/seo-rules/seo-rule.interface.ts`
  (measured return type; `ISeoRuleInput` loses `topKeyword` and `responseMs`); changed
  `…/rules/{title,meta,content,transport,heading,indexing}-rules/*.ts` and their `*.spec.ts`; new
  `…/rules/structured-data-rules/{structured-data-rules.ts,structured-data-rules.spec.ts}`;
  deleted `…/rules/keyword-rules/`; changed `…/seo-rules.registry.ts`,
  `…/_testing/make-rule-input.ts`, `…/services/page-analysis/page-analysis.service.ts` and its
  spec; changed `be/src/modules/pages/services/crawl-results/crawl-results.service.ts` and
  `…/repositories/seo-issues/seo-issues.repository.ts` (the rename only).
- Pre-conditions: 1a green in contracts.
- TDD: first `structured-data-rules.spec.ts` → "a page declaring only Organization fails" — fails:
  no module. Then the edited threshold specs → "a 61-character title fails with
  `{ value: 61, min: 30, max: 60 }`" — fails on the old `{ length: 61, … }`.
- Acceptance: `pnpm --filter be test:ci -- src/modules/page-analysis`; `pnpm typecheck`;
  `git grep -n "SLOW_RESPONSE\|KEYWORD_NOT_IN_TITLE" -- be packages` prints nothing.
- Regression guard: `evaluateSeoRules`'s catalogue ordering — `seo-rules.registry.spec.ts`'s
  "reports catalogue severity and order" still passes with the new catalogue.
- Rollback: revert; nothing persisted yet.
- Commits: `feat(be): a structured-data check for Article and BlogPosting`;
  `refactor(be): a threshold rule returns its measurement, not loose details`;
  `refactor(be): drop the timing and top-keyword rules and the inputs they needed`.

**1c. The extractor reads a heading as a reader sees it**
- Deliverables: changed `be/src/modules/page-analysis/services/html-extraction/extract-page.ts`
  (separator pass before collection; `HIDDEN_TEXT` removal; in-heading control removal); changed
  `…/html-extraction/extract-page.spec.ts`.
- Pre-conditions: 1b green.
- TDD: first the two cases in `extract-page.spec.ts` — "a copy-link control inside an h2 is not
  part of the heading (vercel.com, field study finding 7)" asserting the heading text is exactly
  `Agentic infrastructure`, and "an `aria-hidden` element contributes no text" — both fail,
  returning `Copy link to headingAgentic infrastructure`.
- Acceptance: `pnpm --filter be test:ci -- src/modules/page-analysis/services/html-extraction`;
  then `pnpm --filter be test:ci -- src/modules/page-analysis/services/keyword-extraction`, whose
  golden fixture test must still pass. Record the top three keywords of
  `/how-to-remove-www-from-your-url/` before and after in the commit body.
- Regression guard: the golden fixture test over 15 Yoast posts is the guard; if a property
  assertion fails, record it as an `AMENDED during implementation:` line with the before and
  after rather than relaxing the bound.
- Rollback: revert the one file; keyword rows are rewritten by the next crawl either way.
- Commits: `fix(be): a control inside a heading is not part of the heading`.

**1d. The screens stop describing checks that no longer exist**
- Deliverables: changed
  `fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts` and its test;
  changed `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts` (per-code details union) and
  **new** `fe/src/Gateways/PageGateway/Validation/PageSchemas.test.ts` — the validators have no
  test of their own today, only `PageGateway.test.ts`; changed
  `fe/src/Modules/PageDetail/PageDetailHeader/PageDetailHeader.tsx`; changed
  `packages/contracts/src/domain/pages/page-detail.interface.ts` (`page.responseMs`); changed
  `be/src/modules/pages/repositories/page-detail/page-detail.repository.ts` and
  `…/services/page-read/page-read.service.ts` to carry it.
- Pre-conditions: 1b green.
- TDD: first `groupIssues.test.ts` → "a TITLE_LENGTH issue reads 'The title is 72 characters; aim
  for 30–60.' from value/min/max" and "STRUCTURED_DATA_MISSING has a sentence" — fail on the old
  map. Then `PageSchemas.test.ts` → "a TITLE_LENGTH issue without `value` fails to parse".
- Acceptance: `pnpm --filter fe test:ci`; `pnpm typecheck`; `pnpm --filter be test:db -- pages`;
  then `docker compose up -d --build` and a browser walk of `/pages/<id>` showing the response
  time in the facts line.
- Regression guard: **a developer database may still hold rows with a retired code**, and
  `seoIssueSchema`'s `z.enum(SEO_ISSUE_CODES)` turns one into a parse error that blanks the detail
  screen (I10 working as designed). Check before the walk:
  `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "select distinct code from seo_issues"`
  lists only catalogue codes; if not, follow OQ2's recovery. On a clean clone the table is empty
  and this cannot happen.
- Rollback: revert the frontend commits; the backend's extra field is additive and harmless.
- Commits: `feat(fe): read a threshold finding from its own measurement`;
  `feat(fe): response time as a fact of the crawl, not a verdict`.

**1e. The research that drove this stops saying it binds nothing**
- Deliverables: changed `practices/search-engines/SKILL.md` — the "Status: background, binding
  nothing" paragraph names this plan and the change that acted on it, because the paragraph's own
  condition ("work that starts after the current screens change ships") has been met.
- Pre-conditions: 1a–1d green.
- TDD: none — a document. Its failure mode is a reader believing a stale status line, which no
  test sees.
- Acceptance: `git diff --stat practices/search-engines/SKILL.md` shows only that paragraph; the
  references are untouched, because a field study is a record of a day and is never rewritten.
- Regression guard: none needed — nothing imports a markdown file.
- Rollback: revert.
- Commits: `docs(practices): the search-engines study has been acted on`.

### Phase 2 — Every page carries an honest score · change `page-health-score`

Depends on: phase 1 (the third outcome is only meaningful once the catalogue is correct, and
scoring a retired check would bake it into a number). Decisions D1, D3, D9, D10 and cautions
C1, C2, OQ1.

**2a. Applicability is counted where it is known, and stored**
- Deliverables: changed `be/src/modules/page-analysis/services/seo-rules/seo-rule.interface.ts`
  (`TRuleVerdict` gains `notApplicable`); changed the seven rule groups and their specs; changed
  `…/seo-rules.registry.ts` (`evaluateSeoRules` → `ISeoEvaluation`) and its spec; changed
  `…/services/page-analysis/page-analysis.service.ts`; changed
  `be/src/modules/crawl/services/crawl-run-executor/crawl-run-executor.service.ts` (`toRunPage`);
  changed `be/src/modules/pages/services/crawl-results/crawl-results.service.ts`,
  `…/repositories/pages/pages.repository.ts`,
  `be/src/persistence/schema/tables/pages/pages.schema.ts`; generated
  `be/drizzle/00NN_*.sql` + meta; changed `…/repositories/pages/pages.repository.int-spec.ts`;
  changed `be/test/e2e/crawl.e2e-spec.ts`.
- Pre-conditions: phase 1 closed.
- TDD: first the int-spec cases → "`checks_failed` above `checks_applicable` violates
  `pages_checks_failed_range`" and "`checks_applicable = 0` violates
  `pages_checks_applicable_positive`" — fail: the columns do not exist. Then the registry spec →
  "a page with no title reports TITLE_LENGTH as not applicable, so checksApplicable is 17" —
  fails: there is no third outcome. Then `crawl.e2e-spec.ts` → "every crawled page stores 13–18
  applicable checks and checks_failed equal to its issue count" — fails.
- Acceptance: `pnpm db:generate`, then **read the generated SQL** (two `ADD COLUMN … NOT NULL`,
  two `ADD CONSTRAINT … CHECK`, nothing dropped or renamed), then `pnpm db:migrate`;
  `pnpm --filter be test:ci -- src/modules/page-analysis`;
  `pnpm --filter be test:db -- pages crawl`; `pnpm typecheck`.
- Regression guard: the migration fails on a non-empty `pages` table — intended (§3), and the
  recovery is OQ2's. `ANALYSIS-007` must still hold: `git grep -n -E "\.delete\((pages|pageKeywords)\)" -- be/src ':!*spec.ts'` prints nothing.
- Rollback: the columns are additive; reverting the code leaves two unread columns, which is
  harmless. A down migration is not written — this repository generates forward migrations only.
- Commits: `feat(be): a rule can be not applicable, and the page counts both`;
  `feat(be): store how many checks applied to a page and how many failed`.

**2b. The score crosses the wire**
- Deliverables: new
  `packages/contracts/src/domain/pages/page-score/{page-score.util.ts,page-score.util.test.ts}`,
  new `packages/contracts/src/domain/seo/score-band.constant.ts`, changed
  `packages/contracts/src/index.ts`, `…/pages/page-list-item.interface.ts`,
  `…/pages/page-detail.interface.ts`; changed
  `be/src/modules/pages/repositories/{page-list,page-detail}/*.repository.ts`,
  `…/services/page-read/page-read.service.ts` and its spec; changed
  `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`; changed `be/test/e2e/pages.e2e-spec.ts`.
- Pre-conditions: 2a green and migrated.
- TDD: first `page-score.util.test.ts` → "16 applicable, 2 failed is 88" — fails: no module. Then
  `pages.e2e-spec.ts` → "the detail carries a score of 88 with its applicable and failed counts" —
  fails: the field is absent.
- Acceptance: `pnpm --filter @app/contracts run test:ci`; `pnpm --filter be test:db -- pages`;
  `pnpm typecheck` — which is where the frontend's `satisfies z.ZodType<IPageListItem>` forces the
  zod schema to be updated in this same sub-phase, even though nothing renders the score yet.
- Regression guard: `isolation-matrix.e2e-spec.ts` re-run — new columns on a scoped query must not
  widen it.
- Rollback: revert; additive fields only.
- Commits: `feat(contracts): a page score with the denominator it was computed from`;
  `feat(be): the pages API answers with each page's score`.

**2c. Worst first, and the same page on exactly one page of the list**
- Deliverables: changed `be/src/modules/pages/repositories/page-list/page-list.repository.ts`
  (the `ORDER BY` of §10.4); changed
  `…/repositories/page-list/page-list.repository.int-spec.ts`.
- Pre-conditions: 2b green.
- TDD: first the int-spec → "two pages scoring 50 and 90 come back worst first" (fails on
  integer division if the cast is forgotten; fails now because the order is by client name) and
  "walking every page at `pageSize = 3` returns each id exactly once and all of them", seeded with
  at least four pages tying on score so the tie-breaker is actually exercised. A walk over rows
  that never tie proves nothing, which is why the seed is part of the test and its row count is
  asserted.
- Acceptance: `pnpm --filter be test:db -- page-list`; then on the seeded stack
  `docker compose exec -T postgres psql -U tracker -d seo_tracker -c "explain (analyze, buffers) <the slice query>"`
  with the plan and the row count pasted into the commit body — the record that no index was
  needed at this size, rather than the assumption.
- Regression guard: `countMatching` is untouched and `page-read.service.spec.ts`'s existing
  assertions on `page`/`pageSize`/`total` still pass; `PAGELIST-001`'s URL round-trip is
  unaffected because no search key changed.
- Rollback: revert the `ORDER BY`; the previous order is a one-line restore.
- Commits: `feat(be): order the pages list worst first, with a total order`.

**2d. The score on both screens**
- Deliverables: new
  `fe/src/Modules/_Shared/ScoreBadge/{ScoreBadge.tsx,ScoreBadge.module.scss,ScoreBadge.test.tsx}`;
  changed `fe/src/Modules/Pages/PagesTable/PagesTable.tsx` and its test; changed
  `fe/src/Modules/PageDetail/KpiCards/KpiCards.tsx`.
- Pre-conditions: 2c green.
- TDD: first `PagesTable.test.tsx` → "a page scoring 42 renders in the poor band" and "the first
  row is the lowest score the gateway returned" — fail: there is no column.
- Acceptance: `pnpm --filter fe test:ci`; `pnpm lint && pnpm typecheck`;
  `docker compose up -d --build` then a browser walk of `/pages` and `/pages/<id>` as both seed
  users, with no console error.
- Regression guard: `PagesTable`'s loading skeleton, four empty kinds and error state are
  re-rendered with the extra column — the existing tests cover them and must still pass.
- Rollback: revert the frontend commits; the API keeps answering with a field nobody renders.
- Commits: `feat(fe): a health score badge with its band`;
  `feat(fe): the pages list leads with the score, worst first`.

**2e. The README learns the two new facts**
- Deliverables: changed `README.md` — the decisions section gains the score's honest denominator
  and the worst-first order; the unfinished section gains OQ5.
- Pre-conditions: 2a–2d green. Phase 0 wrote the README; this edits it rather than inventing a
  second one.
- TDD: none — a document.
- Acceptance: the README is still one page; the command block still matches what phase 0 ran
  verbatim.
- Regression guard: none.
- Rollback: revert.
- Commits: `docs: the page score and the list's order`.

### Phase 3 — A site-wide finding reads as one finding · change `site-wide-issue-grouping`

Depends on: phase 1 (the codes must be the final set before counting how many pages share one).
Independent of phase 2 in the code, and sequenced after it only because phase 2 changes the same
two repository files and the same two screens — two patches to one `ORDER BY` in one branch is a
conflict nobody needs. Decision D11; OQ3 settles here.

**3a. The spread, at read time**
- Deliverables: changed
  `be/src/modules/pages/repositories/page-list/page-list.repository.ts` (a fifth statement:
  the per-client code spread over the client's unfiltered current pages),
  `…/repositories/page-detail/page-detail.repository.ts` (`issuesForPage` returns
  `pagesAffected`), `…/services/page-read/page-read.service.ts`; changed
  `packages/contracts/src/domain/pages/page-list-item.interface.ts` (`IPageIssueCounts.siteWide`)
  and `…/page-detail.interface.ts`; changed
  `…/repositories/page-list/page-list.repository.int-spec.ts`, `page-read.service.spec.ts`,
  `be/test/e2e/pages.e2e-spec.ts`; changed
  `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`.
- Pre-conditions: phase 2 closed.
- TDD: first the int-spec → "a code on five of a client's pages reports five" and **"a search
  matching one page still reports five"** — the second fails the moment the spread query inherits
  the search filter, which is the easy way to write it.
- Acceptance: `pnpm --filter be test:db -- page-list pages`; `pnpm typecheck`;
  `curl -s -b c.txt 'http://localhost:8080/api/pages?pageSize=20' | grep -o '"siteWide":[0-9]*' | head`
  against the seeded stack shows non-zero values for the Moz-like template issues.
- Regression guard: the list's statement count — `page-list.repository.int-spec.ts` asserts five
  statements, not a query per row, so a future "just one more lookup" is caught.
- Rollback: revert; additive fields.
- Commits: `feat(be): count how many of a client's pages share each finding`.

**3b. Where the user sees it**
- Deliverables: changed
  `fe/src/ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues.ts` and its test;
  changed `fe/src/Modules/PageDetail/IssuesSection/IssuesSection.tsx` and its test; changed
  `fe/src/Modules/Pages/PagesTable/PagesTable.tsx` and its test.
- Pre-conditions: 3a green.
- TDD: first `IssuesSection.test.tsx` → "an issue on five of fifteen pages reads 'on 5 of 15
  pages'" and "an issue on one page says nothing extra" — fail: the clause does not exist.
- Acceptance: `pnpm --filter fe test:ci`; `docker compose up -d --build` and a browser walk
  confirming a Moz-style template issue reads the same number on every page of the client.
- Regression guard: `IssuesSection`'s "No issues found" state and the severity grouping are
  covered by existing tests and must still pass.
- Rollback: revert the frontend commits.
- Commits: `feat(fe): a finding shared across a client's pages says so`.

## 16. Risks

| risk | the check that catches it |
| --- | --- |
| integer division collapses every score to 0 or 1 in the `ORDER BY` | the int-spec seeding scores 50 and 90 and asserting the order (§13 I9) |
| the SQL ordering expression and `pageScoreOf` drift apart | `page-read.service.spec.ts` asserts the returned items' scores are non-decreasing — a drift in either direction breaks it |
| the spread query inherits the search filter and understates "on N pages" | the int-spec case "a search matching one page still reports five" (I12) |
| pagination repeats or drops a row once the order is no longer by sitemap position | the full-walk int-spec at `pageSize = 3` over tying scores (I8) |
| the extraction fix degrades keyword quality on real pages | the golden fixture test over 15 Yoast posts, re-run in 1c with the before/after recorded |
| a developer's database holds a retired code and the detail screen blanks | the `select distinct code from seo_issues` check in 1d's regression guard |
| the migration cannot apply to a database with pages | intended and stated (§3); OQ2's recovery is in this document, and the reviewer's path is an empty database (C2) |
| applicability is written too broadly and a denominator falls to 2 | the registry spec's `13 <= checksApplicable <= 18` over every recorded fixture post |
| a future rule reintroduces a crawler-side timing | P2, and §19's entry saying why — a bare prohibition gets optimised away, so the reason travels with it |

## 17. Cross-workspace touchpoints

| workspace | what changes, and with what |
| --- | --- |
| `packages/contracts` | the catalogue, `TSeoIssue`, `ISeoMeasurement`, `MEASURED_ISSUE_CODES`, `IPageScore`, `pageScoreOf`, `SCORE_BANDS`, the two payload interfaces. Ships **before** both consumers; `pnpm --filter @app/contracts run build` is a precondition of every `pnpm typecheck` |
| `be` | rules, extraction, the two columns and their migration, the read path, the ordering, the spread statement |
| `fe` | the zod schemas (forced by `satisfies z.ZodType<…>`), the score badge, the table column, the KPI card, the issue sentences |
| `docker` / `caddy` | nothing. No new service, no new env var, no port, no volume |
| CI | nothing new. The existing `checks`, `db-tests` and `docker` jobs cover every acceptance command in §15; the migration runs in the `migrate` service on `docker compose up` |
| `openspec/` | three new changes; amendments to the in-flight `page-analysis` and `tracker-screens` deltas (§20 OQ4) |

## 18. README and harvest

**README.** Phase 0 writes it; phase 2e edits it. When this work is done the README's decisions
section says, in two lines, that a page's score is the share of the checks that could apply to it
— so two pages with different denominators do not compare as equals — and that the list is
ordered worst first for triage. The unfinished section carries OQ5. Nothing else moves; the
README stays one page, and its command block stays identical to the one phase 0 ran verbatim.

**Harvest, before each change is archived.** A change archived with its harvest undone is the
same lost knowledge as a deletion, filed more neatly.

| fact | owning document |
| --- | --- |
| the applicability table of §10.1 — which five checks are conditional and on what | `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md` **new**. No `*_MODULE.md` exists anywhere under `be/src/modules/` today; this work creates exactly one, because D3's denominator is the first fact in this repository that is wrong-by-omission if nobody writes it down. It is created with the deposit, not before |
| why the bounds are snapshotted into the row (P3) | the same document, as an invariant with its `<!-- invariant: ANALYSIS-00N -->` marker and the spec path |
| why `SLOW_RESPONSE` and `KEYWORD_NOT_IN_TITLE` were retired, with the measurements | already recorded in `practices/search-engines/references/field-study-2026-10.md` findings 3 and 4 — **do not copy it**; the module document cites the finding |
| the score's permitted claim and the Lighthouse band precedent | already in `practices/search-engines/references/ranking-signals.md` — cited, not restated |
| the status line that said the research binds nothing | `practices/search-engines/SKILL.md`, phase 1e |
| the extraction defect and its two causes | the code comment at `HIDDEN_TEXT` in `extract-page.ts`, naming the field study's finding 7, plus the test name |

**Deposit, after each archive** (`openspec/README.md` §8): archive → rewrite the delta headings
into the `[ID]` form → carry each requirement into the owning document with its marker, its
pinning line and the spec file's own path.

**This plan is archived, not deleted**, into `docs/_plans-archive/` with the branch, what was
harvested where, and what was left open.

## 19. Out of scope

| not done | why, so it is not re-proposed |
| --- | --- |
| any network-based performance check (Core Web Vitals, Lighthouse, PageSpeed) | P2. Field metrics are 75th-percentile measurements of real visitors; a single server-side fetch cannot approximate one, and the same site answered in 41 ms and 1728 ms minutes apart |
| a `viewport` check | present on 15 of 15 pages in the field study — a rule that never fires is P1 again |
| a link-text-quality check | Cloudflare's pages carry about a thousand anchors, ~20 with no text, all of them icon links named by `aria-label` or an image's alt. A naive rule fires on effectively every page; a correct one must consult `aria-label`, `title` and nested alt text and scope itself to the main content. That is a project, not a line |
| an `hreflang` check | only one of three sites emitted any; nothing to learn yet |
| weighting the score by severity | P5. Weights invent a model of Google that nobody can justify; Lighthouse's own SEO category weights its audits equally and says so |
| touching the declared-metadata bonus in keyword scoring | D5, and it is the one decision in §20 that changes no code. The field study's "the bonus never applies" was an artefact of sampling three bespoke technology blogs: 20 of the 23 recorded Yoast fixtures in `be/test/fixtures/sites/yoast/` carry a non-empty JSON-LD keywords array, and `ANALYSIS-005` pins the bonus explicitly. WordPress-with-Yoast sites are what an agency's clients mostly are. Treat any "X never happens" conclusion from those three sites the same way |
| a stale-analysis mechanism | D9. Nothing has been deployed, so there is no pre-existing data to carry. Reopened by OQ5's trigger, not before |
| deduplicating near-identical keywords (`post quantum`, `post quantum cryptography`) | field study finding 6 is real and the fix is a change to `select-keywords`' subsumption ratio, which would move the golden fixture a second time in the same branch. One keyword-affecting change per branch, so the fixture diff has one cause |
| a sort control, a score filter, a re-analysis endpoint, score history | §6 |
| fixing `KpiCards`' "Average position" vs `PAGEDETAIL-001`'s "last crawl status" | §12. It belongs to `tracker-screens`, which is still building that screen |

## 20. Open questions and the decision log

### Open questions

**OQ1 — a tiny denominator at the top of the list.** With 2 applicable and 1 failed a page scores
50 and outranks real problems. *Default:* a secondary sort key or a minimum-applicable floor,
chosen against real seeded data during implementation; resolved together with C1.
*Where it stands:* §10.1 shows thirteen checks always apply, so with this catalogue the
denominator cannot fall below 13, and the registry spec asserts it over every recorded fixture
post. The default is therefore implemented as the tie-breaker alone (`checks_failed desc`), with
no floor constant. *Trigger to reopen:* a page in seeded or crawled data reports
`checks_applicable < 13`, or a future catalogue adds a conditional check that drops the floor.

**OQ2 — how an existing LOCAL developer database acquires two NOT NULL columns**, given docker
volumes must never be dropped. *Default and stated recovery:* delete the crawl runs, which
cascades to pages and from there to pairs, issues and snapshots, then migrate, then re-seed —
the volume is untouched and the database survives:

```bash
docker compose exec -T postgres psql -U tracker -d seo_tracker -c "delete from crawl_runs"
pnpm db:migrate
docker compose run --rm seed     # hasCurrentRun is now false, so the seed re-crawls both clients
```

Developer-only (C2): the reviewer's path is a clean clone onto an empty database, where the
NOT NULL columns apply without any of this. *Trigger to reopen:* the first deploy to an
environment whose data must survive.

**OQ3 — where "on N pages" is surfaced.** *Default:* on the list row beside the issue count.
*Decided in this plan:* **both**, because the two carry different information and neither
substitutes for the other — the list row carries a count (`· 2 site-wide`, computable without
per-row codes), and the detail line carries the code-specific number (`· on 5 of 15 pages`),
which is the one that tells a user to go edit a template. *Trigger to reopen:* the list row's
suffix proves unreadable beside three severity badges when the screen is built.

**OQ4 — amend the in-flight deltas, or write MODIFIED requirements in the new changes?**
*Default:* amend `tracker-screens`. ***Decided: amend, and for a stronger reason than the
default's.*** `openspec/specs/` holds only `.gitkeep` — nothing is approved truth yet. A
`## MODIFIED Requirements` block names a requirement in the base spec, and for `ANALYSIS-001`,
`ANALYSIS-002`, `PAGELIST-002`, `PAGEDETAIL-001` and `PAGEDETAIL-005` there is no base: they live
only inside the unarchived `page-analysis` and `tracker-screens` deltas. A MODIFIED block against
nothing is a block the tool cannot resolve and a reader cannot diff. So:

- a requirement that EXISTS and must change its text is **amended in place, in its owning
  change**, with the `AMENDED during implementation:` line `openspec/config.yaml` requires;
- a requirement that is NEW is `## ADDED Requirements` in the new change, at its mirrored path —
  and ADDED needs no base.

This also keeps one fact with one owner: `ANALYSIS-002` has exactly one text, in one file,
corrected there rather than copied into a second change that says "the previous version said…".
*Trigger to reopen:* `page-analysis` or `tracker-screens` is archived before this work lands, at
which point their requirements become approved truth and MODIFIED becomes the correct form.

**OQ5 — will a future catalogue change need the stale-analysis mechanism D9 declined?**
*Default:* revisit after the first deploy. *Trigger:* the first production deploy.

### Decision log

Verbatim, append-only. Every line is reasoning this plan preserves.

**D1.** Findings stay computed at crawl time and stored as rows in `seo_issues`; there is no
read-time derivation. Why: one source of truth, cheap reads, matches the current code. (Closed
the "derive at read" option; made D9's question live.)

**D2.** A threshold rule MUST return a typed measurement `{ value, min?, max? }`; rules without a
threshold keep plain details. The bounds are SNAPSHOTTED INTO THE ROW at crawl time, not read
from the catalogue at display time — otherwise an old verdict renders against new bounds and
explains itself incorrectly, and that property was the reason this option won. Why:
`Record<string, unknown>` beside a rigorously typed catalogue is a hole, and the row should
explain its own verdict.

**D3.** A page gains a score. `TSeoRule` gains a third outcome: pass / not-applicable / details.
The analysis, at crawl time where the parsed page is still in hand, computes applicability and
stores two integers on `pages` (`checks_applicable`, `checks_failed`). The score is derived at
read time as `(applicable - failed) / applicable`. Why: a share of passed checks invents no
weights, and the denominator is only honest where applicability is still known — it cannot be
recovered at read time from the `pages` columns, which hold no canonical, no og, no json-ld.

**D4.** The length thresholds keep their numbers (title 30-60, meta description 70-160).
`TITLE_LENGTH` moves from warning to notice. Why: the research did not show the numbers are wrong
— industry consensus confirms them — it showed that exceeding them is not a breakage. Note: with
a flat share-of-passed score, severity does not affect the score; this decision is about how the
screen reads.

**D5.** `METADATA_BONUS` stays. Settled by measurement, not by choice: ANALYSIS-005 pins it
explicitly ("a small bonus for declared metadata"), and 20 of the 23 recorded Yoast fixtures in
`be/test/fixtures/sites/yoast/` carry a non-empty JSON-LD keywords array. The field study's "it
never applies" was an artefact of sampling three bespoke tech blogs.

**D6.** `KEYWORD_NOT_IN_TITLE` is removed from the catalogue. Why: it cannot fail by construction
— title presence is the largest field weight, so the top keyword is nearly always a title term;
it fired 0/15. Under D3 it would be a constant that lifts every page's score.

**D7.** `SLOW_RESPONSE` is removed from the catalogue; `responseMs` stays and is shown on the page
card as a fact of the crawl. Why: it measures the crawler's network position — the same site
returned 41 ms and 1728 ms minutes apart — and Core Web Vitals are 75th-percentile field metrics
that a single server-side fetch cannot approximate.

**D8.** `STRUCTURED_DATA_MISSING` (notice) is added: the page declared neither `Article` nor
`BlogPosting`. Why: `jsonLd.types` is already extracted and discarded, and this is the one
uncovered check that actually varied on real data (Moz `Article`+`Organization`+`BreadcrumbList`,
Cloudflare `BlogPosting`, Vercel none). The hint must speak about rich-result eligibility, not
about a violation — Google requires no structured data.

Catalogue goes from 19 codes to 18.

**D9.** There is NO stale-analysis mechanism. The user rejected the premise: nothing has been
deployed, so there is no pre-existing data to carry. `checks_applicable` and `checks_failed` can
therefore be NOT NULL, the score is always defined, and no "no score yet" state appears on any
screen.

**D10.** The score appears on BOTH screens, and the pages list sorts by it. Why: sorting
worst-first was the reason to have a score at all.

**D11.** A code repeated across a client's pages is grouped AT READ TIME ("on 5 pages"); storage
does not change. Why: this is presentation, not storage — the data already answers it, exactly as
`bestPosition` is computed at read.

### Cautions carried from the interview

**C1.** Sorting by score MUST NOT break pagination. The brief requires paging, and the repository
already established "one current-run order everywhere" (commit 94608fa). The new sort key needs a
deterministic tie-breaker, or rows repeat and vanish between pages. → §10.4, invariant I8, and
the completion criterion in §15 phase 2c.

**C2.** D9 is confirmed by the brief's own workflow: a reviewer clones, migrates onto an empty
database and runs the seed, so NOT NULL without a default is safe. OQ2 is developer-only and does
not drive the schema. → §3.

**C3.** PRIORITY. This work improves something that already works and already satisfies the
brief; the README is the one outstanding brief requirement, owned by the existing change
`readme-and-clean-clone` (0 of 6). → §15 phase 0, which gates everything else.
