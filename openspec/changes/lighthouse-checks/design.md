# Design — lighthouse-checks

See `proposal.md` for the reasons, and the deltas under `specs/` for what must be true. This
document records how, and the decisions taken in the design interview of 2026-10-11.

## Context

- **The PageSpeed call.**
  - `PsiClient.requestUrl` asks for `strategy=mobile&category=performance` and nothing else.
  - `extractMeasurement` reads LCP, INP and CLS (field, then origin, then lab) and the
    performance score. It discards `distributions`, `EXPERIMENTAL_TIME_TO_FIRST_BYTE` and every
    audit outside performance.
  - The fixtures in `be/test/fixtures/pagespeed/` are trimmed by
    `record-pagespeed-fixtures.ts` to five performance audits. No Lighthouse SEO, accessibility or
    `-insight` audit id has ever been read from a live answer in this repository.
- **The catalogue.**
  - The catalogue is one file, `packages/contracts/src/domain/seo/seo-issue-catalogue.constant.ts`,
    in which every entry writes its `owner`.
  - The owner sets are derived by filtering. `TCrawlIssueCode` is
    `Exclude<TSeoIssueCode, TPageSpeedIssueCode>`, so a third owner's codes would silently become
    crawl codes and break `TCheckRegistry`.
- **The checks list.**
  - `IPageDetail.checks: IPageCheck[] | null` holds crawl codes only.
  - It is composed by `composePageChecks` from `pages.checks_judged` and
    `pages.checks_not_applicable` and the failed findings.
- **The score.**
  - The score is `checks_failed / checks_applicable` on `pages`, written only by the crawl.
  - The list sorts on the same expression in SQL.
- **The database.** `page_speed` has eight CHECKs, one of which (`page_speed_measurement_whole`)
  ties LCP, CLS and the performance score to `measured_at`. The latest migration is `0014`.

## Goals / Non-Goals

**Goals:**
- A third catalogue owner, added in a way a fourth can follow without touching another owner's
  code.
- Every Lighthouse verdict the answer holds is stored as a fact (passed, not applicable or
  failed), and nothing is invented for an audit that did not report.
- The checks section can put our verdict and Lighthouse's on one line.

**Non-Goals:**
- Lighthouse's best-practices category, and performance audits other than the LCP breakdown.
  `image-delivery-finding` owns the one performance audit already chosen.
- Desktop Lighthouse verdicts (D16).
- Re-measuring existing pages on deploy (D17).
- Any change to the pages table on screen, or to the Issues screen beyond what new codes bring by
  themselves.

## Decisions

The decision log of the interview, numbered as it was taken, follows. Each entry gives the
choice, why, and what was rejected.

**D1 — One OpenSpec change, no plan document.** The user chose this. The change still writes
spec deltas, because what the screen states about a page changes.

**D2 — Every Lighthouse audit becomes a catalogue code with a new owner `lighthouse`, and is
written to `seo_issues`.** Why: Lighthouse problems must be visible wherever ours are. Rejected:
- display-only verdicts, which would never reach the Issues screen or the report;
- a hybrid in which only audits without a counterpart of ours become codes.

This reverses `ahrefs-gap-checks` D2 ("Lighthouse SEO category duplicates our catalogue"). The
duplication is now presented side by side (D10) rather than avoided.

**D3 — Owners are a registry.** Why: extending the owners is checked by the compiler, not by
review. Rejected: per-owner folders with `owner` still written in each entry. There, the field
and the folder can disagree, and a missed spread line goes unnoticed.

```ts
// packages/contracts/src/domain/seo/catalogue/issue-catalogues.constant.ts
export const ISSUE_CATALOGUES = {
  crawl: { scored: true, entries: CRAWL_CATALOGUE },
  pageSpeed: { scored: false, entries: PAGE_SPEED_CATALOGUE },
  lighthouse: { scored: true, entries: LIGHTHOUSE_CATALOGUE },
} as const satisfies Record<string, IIssueOwnerDefinition>;

export type TIssueOwner = keyof typeof ISSUE_CATALOGUES;
export type TIssueCodeOf<O extends TIssueOwner> = keyof (typeof ISSUE_CATALOGUES)[O]['entries'];
export type TScoredIssueOwner = { [O in TIssueOwner]: (typeof ISSUE_CATALOGUES)[O]['scored'] extends true ? O : never }[TIssueOwner];
export type TCrawlIssueCode = TIssueCodeOf<'crawl'>; // no longer an Exclude
// flattened, `owner` stamped from the key; consumers of `.owner` keep working
export const SEO_ISSUE_CATALOGUE = flattenCatalogues(ISSUE_CATALOGUES);
```

- **Disjointness.** A type-level test (`expectTypeOf<…>`, or a conditional type that resolves to
  `never` on overlap) checks that no two owners share a code. A runtime test asserts the same over
  the keys.
- **Folders.** `seo/catalogue/crawl/`, `seo/catalogue/page-speed/` and
  `seo/catalogue/lighthouse/`. The crawl's 69 entries are split by theme into a few files, so no
  single file stays at ~1,500 lines. This is a pure move with no wording change, and the existing
  catalogue tests pin it.
- **The `IIssueOwnerDefinition` interface** is new.

**D4 — Every audit of the SEO and Accessibility categories**, which D13 narrows to those that can
return a verdict. Why: the user chose the full picture. Rejected: SEO plus a curated accessibility
subset.

**D5 — The SEO and Accessibility category scores are stored** (two `smallint` columns) and shown as
lab captions, as `performance_score` is (issue-report-and-pagespeed D26).

**D6 — Lighthouse verdicts are stored as arrays on `page_speed`:**
- `lighthouse_judged` and `lighthouse_not_applicable`, both `varchar(64)[]`, with CHECKs that the
  two are set together, are disjoint, and are clean (`array_is_clean`);
- the CHECKs sit outside `page_speed_measurement_whole`;
- failed audits live in `seo_issues`;
- `composePageChecks` is generalised per owner.

Why: this is the mechanism `pages.checks_*` already proved, and it keeps one source for failures.
Rejected:
- an `audit_results` table, which would hold failures twice (once there and once in
  `seo_issues`);
- `jsonb`, whose codes the database cannot check.

**D7 — Diagnostics storage.**
- Flat columns with CHECKs for:
  - `ttfb_ms` and `ttfb_source`;
  - `{lcp,inp,cls,ttfb}_good_share` and `_poor_share`, each `real`, in 0..1, with good + poor ≤ 1,
    null when the metric's source is `lab` or the metric is absent.
- The LCP breakdown goes in `lcp_breakdown_json`, validated with zod at write and at read.

Why: whatever the database can check, it checks, and the variable-shape breakdown (two or four
phases, an HTML snippet of unbounded length) does not fight the DDL. Rejected:
- flat columns for everything, where the snippet length and the "a text element has no load
  phase" rule do not fit;
- a single `diagnostics_json`.

**D8 — TTFB is field-only**: url, then origin, then none, like INP. Lab TTFB is visible as the
first phase of the LCP breakdown, so a fallback would show one lab number twice.

**D9 — Lighthouse codes count in the score**, computed when read:
`(crawl failed + LH failed) / (crawl applicable + LH applicable)`. The registry flag `scored`
decides which owners contribute, so the formula is derived and not a chain of conditions. The
user chose this, accepting three consequences:
- a page's score moves when its first Lighthouse verdicts land;
- clients without a key keep crawl-only scores;
- the list's sort joins `page_speed`.

Rejected: keeping the score crawl-only. Core Web Vitals stay out of the score (`pageSpeed` is not
scored).

**D10 — Counterpart groups are their own constant, `ISSUE_COUNTERPARTS`**, beside the registry.
Each group is `Partial<Record<TIssueOwner, readonly code[]>>`. A test checks that a code is in at
most one group and that each group spans at least two owners. A review test lists, explicitly,
the Lighthouse codes that are in no group. Why: many-to-many relations (the five canonical codes
against one Lighthouse `canonical`) and future owners need no edit to any entry. Rejected:
- a `counterparts` field on Lighthouse entries;
- a `lighthouse` field on crawl entries.

Both are directional, and both break on N:M relations.

**D11 — Duplicates are counted on both sides**: in the score, the issue counts and the report.
Why: each owner answers for its own verdict. Consequence: the rule from 97a8047 ("a new check
does not repeat an older one's finding") holds within an owner only, and
`PAGE_ANALYSIS_MODULE.md` must say so. Groups are display-only. Rejected:
- a group counting as one unit, which would change every crawl-only score at deploy;
- only our code counting within a group.

**D12 — The wire carries one list per owner.**
`IPageDetail.checksByOwner: { [O in TScoredIssueOwner]: IPageCheck<O>[] | null }` replaces
`IPageDetail.checks`, and the FE builds the rows from `ISSUE_COUNTERPARTS`. Why: the wire carries
facts, and each owner has its own "nothing recorded". Rejected:
- backend-built rows, which would put the screen's shape into the contract;
- one flat list, where "not measured" and "no codes" would be indistinguishable.

**D13 — How a Lighthouse answer maps to statuses:**

| answer | stored | status shown |
|---|---|---|
| `binary`, score 1 | in `lighthouse_judged` | passed |
| `binary`, score 0 | in `lighthouse_judged` + one `seo_issues` row | failed |
| `notApplicable` | in `lighthouse_not_applicable` | not applicable |
| `error`, or the audit is missing from the answer | in neither | "Lighthouse did not record this audit" |
| `manual` / `informative` | not catalogued | — |
| an audit id the catalogue lacks | ignored, `warn` once per id per process | — |

Why: no invented verdict, and no new status the crawl could never produce. Rejected:
- a `couldNotCheck` status;
- manual audits shown as not applicable, which would be a false statement.

**D14 — Severity follows the audit's category weight**: 7 or more is a warning, anything else is a
notice, and `is-crawlable` is an error as an explicit exception. The weight is copied into the
entry (`weight`). A test checks the rule and checks each declared weight against the recorded
live fixture. Rejected:
- notice for everything, which would bury `is-crawlable`;
- hand-assigned severities with no rule.

**D15 — Our own copy for every Lighthouse code**: `label`, `plain {what, why, fix}`, `hint`,
`explanation` and `sources`, written from the recorded live answer and held to the same
`issue-plain-copy.test`. Rejected:
- Lighthouse's own title and description at read time, which are developer language with
  markdown, change between versions, and are unfit for a client report;
- a short label with a link, which leaves no fix in the report.

**D16 — Lighthouse audits on mobile only.**
- The desktop request asks for performance only.
- TTFB, the shares and the breakdown are columns of the row, so a desktop row gets them too.
- `desktop-core-web-vitals` and this change can land in either order. The second to land applies
  this rule and adds the CHECK `strategy = 'desktop' ⇒ lighthouse_* is null`.

**D17 — No backfill.** Pages measured before this change keep `null` Lighthouse lists until their
next crawl re-queues them (SPEED-002, freshness of 24 h). The score explanation says whether
Lighthouse is in the number. Rejected: a one-off requeue command, which would spend quota and hit
the 429 pause for every slot at once.

**D18 — A disagreement marker on a row.** It is shown when one owner's codes in the row include a
failure and the other owner's include a pass. Its tooltip names why the sources differ:
Lighthouse runs scripts, and it measured at another time.

**D19 — Row order and layout.**
- Rows holding a crawl code come first, in catalogue order.
- Then the "Lighthouse · SEO" and "Lighthouse · Accessibility" sections, failures first within
  each.
- Each column header carries its date.
- A null owner gets one line for the whole column.
- On a narrow screen the cells stack.
- The pages table is unchanged.

### Decisions derived while writing the deltas

**D20 — An answer without the SEO and accessibility categories** stores the Core Web Vitals, sets
both lists to null, and removes the page's earlier Lighthouse findings (SPEED-017). Why: a
finding with no record behind it would be a failure the checks list cannot place, and a score
contribution with no denominator. The alternative was keeping the old verdicts next to the new
measurement. It was rejected because a row's Lighthouse data would then come from two different
dates.

**D21 — The Lighthouse failed count is stored as a counter**, `lighthouse_failed smallint`,
written in the same statement as the lists and in the same transaction as the findings. CHECKs:
- set together with the lists;
- `0 ≤ lighthouse_failed ≤ cardinality(lighthouse_judged)`.

Why: the list's sort reads `page_speed` columns only, and does not count `seo_issues` per page in
the ORDER BY. This is the same pattern as `pages.checks_failed` against the crawl's findings.

**D22 — TTFB's thresholds are Google's published 800 ms (good) and 1800 ms (poor).** They live in
`FIELD_METRIC_THRESHOLDS` beside `CWV_THRESHOLDS`, not inside it, because TTFB is not a Core Web
Vital and produces no finding. A band for it is derived when read, by `cwvBandOf`'s sibling over
the same shape.

**D23 — Codes are named `LH_<AUDIT_ID>`** in upper snake case (`LH_IMAGE_ALT`, `LH_IS_CRAWLABLE`),
and each entry declares `audit: '<lighthouse id>'` and `category: 'seo' | 'accessibility'`. The
extractor looks codes up by audit id through a map derived from the catalogue, never through a
second list.

**D24 — Lighthouse's accessibility audits are retired; its accessibility score stays as an
overview.** Decided by the user after the screen was in use: the accessibility audits are not
checks, the score does not count them, and the Info tab does not teach them. The speed block's
Accessibility card is the overview.
- `ACTIVE_LIGHTHOUSE_CODES` is derived from the catalogue: the codes with an SEO weight, ten of
  them (`image-alt` and `document-title` included). The extractor judges, `composePageChecks`
  lists and the score counts these only.
- The 56 accessibility-only entries stay in the catalogue, as a retired crawl check's does, so a
  stored verdict or finding still reads back until the page is re-measured. The re-measurement's
  replace deletes every Lighthouse code, so it clears them.
- The PSI call still asks for the accessibility category, for its score. An unknown audit is
  looked for in the SEO category only.
- Severity no longer reads any weight: `is-crawlable` is an error, every other code a notice.
  Lighthouse's SEO category weighs its audits alike, and a weight borrowed from accessibility
  would count accessibility in the score by the back door (`image-alt` and `document-title` were
  warnings for that reason only).
- Four counterpart groups went with their Lighthouse side: `HEADING_SKIP`/`heading-order`,
  `LINKS_WITHOUT_TEXT`/`link-name`, `LANG_MISSING`/`html-has-lang`,
  `META_REFRESH`/`meta-refresh`.
- The score's Lighthouse share is counted in `LIGHTHOUSE_SCORE_POINTS_LATERAL`, through the active
  weights, rather than from `cardinality(lighthouse_judged)` and D21's `lighthouse_failed`.
  A measurement stored before keeps its accessibility codes in those columns, and reading them
  would score checks the page no longer lists.
- The checks section loses its "Lighthouse audits" block heading. Lighthouse's own chapters
  continue the list: they hold the checks no check of ours shares, not a separate report.

## Risks / Trade-offs

- **Axe renames or adds rules in a Lighthouse release.** A renamed audit leaves our code showing
  "not recorded" on every page. → The `warn` per unknown id is the signal (D13). The recorder is
  re-run when the warn appears, and the catalogue test compares the catalogue against the latest
  recorded answer.
- **Scores jump once per page when Lighthouse lands.** → The explanation states the per-owner
  counts and the date (PAGEDETAIL-012). The change note in the release says so.
- **The answer grows.** → `PAGE_SPEED_MAX_BYTES` is 8 MB. The first task records a real answer
  and states its size. If the size is above 4 MB, `AMENDED during implementation:` the limit is
  revisited.
- **Lab and field disagree on screen.** The breakdown sums to a lab LCP while the card shows a
  field LCP. → The breakdown carries the lab label and says it can disagree (PAGEDETAIL-013).
- **Roughly 50 entries of copy.** → They are written in batches by Lighthouse category, each
  batch against the recorded answer, and the plain-copy test gates each batch.
- **Interaction with `desktop-core-web-vitals`.** Both changes touch `page_speed` and
  `psi-client`. → Neither modifies a requirement the other modifies, and D16 says who adapts.

## Migration Plan

1. The schema edit adds:
   - the nullable columns `lighthouse_judged`, `lighthouse_not_applicable`,
     `lighthouse_failed`, `seo_score`, `accessibility_score`, `ttfb_ms`, `ttfb_source`, the eight
     share columns and `lcp_breakdown_json`;
   - their CHECKs.

   Then `pnpm db:generate` and read the SQL: it must contain `ADD COLUMN` and `ADD CONSTRAINT`
   only, with no default and no rewrite of existing rows. Then `pnpm db:migrate`.
2. Existing rows read as "Lighthouse not measured" and "no diagnostics". Nothing is backfilled
   (D17).
3. Rollback: the columns are nullable and additive, so the previous API ignores them. The
   catalogue's Lighthouse codes in `seo_issues` would be unknown to an old API. A rollback
   therefore deletes `seo_issues` rows whose code starts with `LH_` before deploying the old
   build.

## Open Questions

- **The exact audit list, weights, `-insight` ids and counterpart groups.** These are read from
  the first recorded live answer (task 1). They do not change the approach: D13, D14 and D23
  define how any list is turned into codes.
