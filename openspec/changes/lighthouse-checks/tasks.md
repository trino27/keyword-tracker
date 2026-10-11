# Tasks — lighthouse-checks

Decisions: `design.md` D1–D23. Requirements: the deltas under `specs/`. A task that turns out wrong
gets an `AMENDED during implementation:` line. One that was already satisfied is closed as
`VERIFIED, NOT BUILT`, naming what pins it. A test marked "first" is run and seen failing for the
stated reason, then lands in the same commit as the code that turns it green. Branch:
`feat/issue-report-and-pagespeed`. Commit after each group.

## 1. A live answer to build from

- [x] 1.1 Extend `be/test/fixtures/record-pagespeed-fixtures.ts`:
  - request `category=performance&category=seo&category=accessibility`;
  - keep, in `trim()`:
    - `categories.{seo,accessibility}` with `auditRefs` (`id`, `weight`);
    - every audit those refs name (`id`, `title`, `scoreDisplayMode`, `score`, `details` only
      where a test needs it);
    - the LCP breakdown audits;
    - `loadingExperience` / `originLoadingExperience` whole, so `distributions` and
      `EXPERIMENTAL_TIME_TO_FIRST_BYTE` survive.

  The key stays in the header (SPEED-012).

  Verify: re-record `url-field.json`, `origin-only.json` and `lab-only.json`, plus one new
  `lighthouse-mixed.json` from a page with at least one failing SEO audit and one failing
  accessibility audit. `git grep -n "$PAGESPEED_API_KEY" be/test` finds nothing.

  AMENDED during implementation: this task said to re-record the three existing success answers.
  A re-recording moves every number pinned by `extract-measurement.spec`,
  `page-speed-executor.service.spec` and two e2e specs, and the old answers are exactly what
  an answer WITHOUT the categories looks like (D20). What was built instead:
  - two new targets, `lighthouse-url-field.json` (yoast.com: own field data, fails
    `robots-txt`, `color-contrast` and `link-name`, an image LCP in four phases) and
    `lighthouse-lab-only.json` (octocat Spoon-Knife: no field data, fails seven audits, a text
    LCP in two phases);
  - a `verdicts` flag per target;
  - a file-name prefix argument (`node record-pagespeed-fixtures.ts lighthouse-`), so nothing
    is re-recorded by accident.

  `page-speed-fixtures.spec.ts` pins the roles of both new answers. No answer holds the key.
- [x] 1.2 From the recorded answers, write down in this file under 1.2:
  - the SEO and accessibility audit ids, each with its `scoreDisplayMode` and weight;
  - the id and shape of the LCP breakdown and LCP element audits (`-insight` or legacy);
  - the answer size in bytes.

  If the size exceeds 4 MB, add `AMENDED during implementation:` and revisit
  `PAGE_SPEED_MAX_BYTES` (design, Risks). Verify: the list is in this file, and every id in it
  appears in a fixture.

  **Found (Lighthouse 13.5.0, the version PageSpeed ran on 2026-10-11):**
  - **Answer size.** An untrimmed mobile answer with all three categories for yoast.com is
    861,607 bytes, well under `PAGE_SPEED_MAX_BYTES`, so the limit stands.
  - **SEO.** 11 audits:
    - `is-crawlable` w 93/23;
    - weight 1: `document-title`, `meta-description`, `http-status-code`, `link-text`,
      `crawlable-anchors`, `robots-txt`, `image-alt`, `hreflang`, `canonical`;
    - `structured-data` is `manual`, w 0.
  - **Accessibility.** 76 audits:
    - 58 have a weight above 0 (10, 7, 3 or 1);
    - 10 are `manual`;
    - 1 is `informative` (`identical-links-same-purpose`);
    - 3 are in the `hidden` group with weight 0 (`label-content-name-mismatch`,
      `table-fake-caption`, `td-has-header`);
    - 4 are binary with weight 0 (`table-duplicate-name`, `empty-heading`,
      `aria-allowed-role`, `image-redundant-alt`).
  - **Shared audits.** `document-title` (SEO w1, a11y w7) and `image-alt` (SEO w1, a11y w10)
    are ONE audit referenced by both categories.
  - **Weights.** An answer reports weight 0 for every audit that is `notApplicable` on that
    page, so weights are read from Lighthouse's `core/config/default-config.js`, not from an
    answer. They are snapshotted in
    `packages/contracts/src/domain/seo/catalogue/lighthouse/lighthouse-audits.fixture.json`
    with their source.
  - **LCP breakdown.** It is `lcp-breakdown-insight` (`informative`). In it:
    - `details.items[0].items[]` holds `{ subpart, label, duration }`, with subparts
      `timeToFirstByte`, `resourceLoadDelay`, `resourceLoadDuration` and
      `elementRenderDelay`; a text LCP has only the first and the last;
    - `details.items[1]` is the element node (`selector`, `nodeLabel`, `snippet`).

    No `largest-contentful-paint-element` audit exists in 13.5.0.
  - **TTFB.** `EXPERIMENTAL_TIME_TO_FIRST_BYTE` has the same shape as LCP: `percentile` plus
    three `distributions`, with bounds 800 and 1800.

  AMENDED during implementation: three decisions are corrected by these findings.
  - **D4/D13.** "Every audit with a verdict" becomes "every audit Lighthouse SCORES" (weight
    above 0 in at least one category): 66 codes. The 3 hidden and 4 weight-0 binary audits
    return verdicts, but Lighthouse itself never counts them. Counting them in our score (D9)
    would weigh what Lighthouse chose not to.
  - **D14/D23.** An entry declares `weights: { seo?, accessibility? }`, not one `category` and
    one `weight`, and its severity follows its highest weight. `LH_IMAGE_ALT` (w10) and
    `LH_DOCUMENT_TITLE` (w7) are warnings.
  - **D7/PAGEDETAIL-013.** The breakdown's phases come from the trace Lighthouse observed
    WITHOUT throttling. On yoast.com they sum to 2.3 s, against a simulated lab LCP of 8.9 s.
    They do not add up to any LCP shown, so the screen presents them as the SHARE of the time
    spent in each phase, labelled as such.
- [x] 1.3 Commit: `test(page-speed): record answers with Lighthouse SEO, accessibility and the
  LCP breakdown`. Verify: `pnpm --filter be test:ci -- src/modules/page-speed` is still green on
  the re-recorded fixtures.

## 2. The catalogue becomes a registry of owners — ANALYSIS-012

- [x] 2.1 Write first in `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts`:
  - "derives the owners from the registry: crawl, pageSpeed, lighthouse";
  - "no code belongs to two owners";
  - "the crawl and Lighthouse are scored, the Core Web Vitals are not";
  - a type-test file `issue-catalogues.type-test.ts`:
    - `TCrawlIssueCode` excludes a Lighthouse code;
    - an owner without a catalogue fails to compile.

  They fail: there is no registry. Verify: `pnpm --filter @app/contracts test:ci` fails on them.

  AMENDED during implementation: no separate type-test file was written.
  - The disjointness check is a compile-time assertion inside `issue-catalogues.constant.ts`
    (`OWNERS_ARE_DISJOINT`). It was seen failing (`TS2322`) with `TITLE_MISSING` put in
    both catalogues, then restored.
  - "An owner without a catalogue fails" holds by construction: `TIssueOwner` is
    `keyof ISSUE_CATALOGUES`, and the registry `satisfies` an interface whose `entries` is
    required.
  - "`TCrawlIssueCode` excludes Lighthouse codes" is the runtime test "gives the crawl's code
    list none of Lighthouse's", plus `TCrawlIssueCode = TIssueCodeOf<'crawl'>`, which is no
    longer an `Exclude`.
- [x] 2.2 Move the catalogue into `packages/contracts/src/domain/seo/catalogue/`:
  - `crawl/` (split by theme, entries unchanged byte for byte apart from losing `owner`);
  - `page-speed/`;
  - `lighthouse/` (empty catalogue for now);
  - `issue-catalogues.constant.ts` with `ISSUE_CATALOGUES`, `IIssueOwnerDefinition`,
    `TIssueOwner`, `TIssueCodeOf`, `TScoredIssueOwner`, `SCORED_ISSUE_OWNERS` and
    `flattenCatalogues` (design D3).

  `SEO_ISSUE_CATALOGUE` keeps its name and stamps `owner`. `CRAWL_ISSUE_CODES` and
  `PAGE_SPEED_ISSUE_CODES` become `issueCodesOf('crawl' | 'pageSpeed')`. Delete
  `issue-owner.enum.ts` and fix `src/index.ts`.

  Verify: `pnpm --filter @app/contracts test:ci && pnpm typecheck`. Every existing catalogue,
  plain-copy and measured-code test passes unchanged.

  AMENDED during implementation: the crawl's catalogue is NOT split by theme, and
  `ISSUE_SOURCES` stays in it.
  - **Why.** Other agents keep adding crawl entries and sources to the old file on
    `feat/issue-report-and-pagespeed` while this branch is open. A `git mv` of the whole
    file (`seo-issue-catalogue.constant.ts` → `catalogue/crawl/crawl-catalogue.constant.ts`)
    is detected as a rename on merge, so their hunks land in the new path. A split into
    several files would turn every one of their edits into a modify/delete conflict.
  - **What was built.**
    - `catalogue/issue-definition.interface.ts`, holding the base, crawl, pageSpeed and
      Lighthouse definitions;
    - `catalogue/crawl/`, `catalogue/page-speed/` and `catalogue/lighthouse/`;
    - `catalogue/issue-catalogues.constant.ts`, the registry, the flattening and every
      derived list. Its `IIssueOwnerDefinition` is `{ scored, entries }`.
  - **Later.** The theme split is a follow-up for after the merge.
- [x] 2.3 Confirm no consumer read `.owner` or `ISSUE_OWNERS` outside contracts (scout found
  none). Run `git grep -n "ISSUE_OWNERS\|\.owner ===" -- be/src fe/src`. Verify: no hits, and
  `pnpm lint && pnpm typecheck && pnpm test` passes.
- [x] 2.4 Commit: `refactor(contracts): issue owners are a registry, one folder each`.

## 3. Lighthouse codes and counterpart groups — ANALYSIS-028, ANALYSIS-029

- [x] 3.1 Write first in `packages/contracts/src/domain/seo/catalogue/lighthouse/lighthouse-catalogue.test.ts`:
  - "one code per verdict-giving SEO and accessibility audit in the recorded answer";
  - "no code reads a manual or informative audit";
  - "each declared weight is the audit's weight in the recorded answer";
  - "severity: weight ≥ 7 warning, else notice, `is-crawlable` error".

  The tests read the fixture from 1.1 through a path the contracts tests can reach. If that
  breaks the package's boundaries, copy the audit list into a `lighthouse-audits.fixture.json`
  inside contracts with a note pointing at the recorder. They fail: the catalogue is empty.
- [x] 3.2 Write the Lighthouse entries (`LH_<AUDIT_ID>`, D23) with `audit`, `category`, `weight`
  and `severity` from the rule. Write them in two commits:
  1. SEO;
  2. accessibility.

  Each entry gets `label`, `plain`, `hint`, `explanation` and `sources` (D15), written from what
  the audit checks in the recorded answer. `issue-plain-copy.test.ts` covers them automatically.
  Verify: `pnpm --filter @app/contracts test:ci`.

  AMENDED during implementation:
  - **Where the facts came from.** The 66 entries were written in three batches: SEO,
    accessibility A and accessibility B. Each was written against Lighthouse's own doc page
    (developer.chrome.com for SEO, Deque's axe 4.13 rules for accessibility) and, for SEO,
    against Lighthouse's audit source. The answer alone was not enough: it says only pass or
    fail. One source per audit, `LH_SOURCE`, sits in the Lighthouse catalogue beside the
    shared `ISSUE_SOURCES`.
  - **Ranking claims.** Every pure accessibility entry says Google does not use it as a
    ranking signal. The language audits cite Google saying it ignores `lang`.
  - **One commit.** Both categories landed in one commit, not two, because the catalogue test
    'one code per scored audit' cannot pass with half of them.
  - **Test before code.** The test file and `lighthouseSeverityOf` were written before the
    entries. The test was seen failing on the empty catalogue.
  - **Result.** Contracts: 732 tests passed, lint clean.
- [x] 3.3 Write first in `packages/contracts/src/domain/seo/catalogue/issue-counterparts.test.ts`:
  - "a code is in at most one group";
  - "a group spans at least two owners";
  - "the canonical group holds the five canonical codes and `LH_CANONICAL`";
  - "Lighthouse codes in no group are exactly these: […]", an explicit list kept as the review
    point (D10).

  Then `issue-counterparts.constant.ts` (`ISSUE_COUNTERPARTS`, `counterpartGroupOf(code)`), with
  groups drawn from the 1.2 list. At least these: title, meta description, canonical,
  crawlable/noindex/robots, link text, crawlable anchors, image alt, hreflang, `html-has-lang`,
  viewport. Verify: `pnpm --filter @app/contracts test:ci`.

  AMENDED during implementation: there are 11 groups, not the ten subjects listed.
  - **Viewport.** Our VIEWPORT_MISSING (no viewport at all) and Lighthouse's `meta-viewport`
    (zoom blocked) fail on different things, so they are NOT a group.
  - **Link text.** LINKS_WITHOUT_TEXT pairs with Lighthouse's `link-name`, not `link-text`:
    `link-text` is generic wording such as "click here", which we do not check.
  - **Two more groups.** HEADING_SKIP with `heading-order`, and META_REFRESH with
    `meta-refresh`.
  - **What is left over.** 55 Lighthouse codes stand alone, listed explicitly in the test.
  - **Order.** The constant was written before its test here, not after.
- [x] 3.4 Update `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`:
  - the opening ("only crawl-owned codes are checks") becomes "crawl and Lighthouse codes are
    checks, Core Web Vitals are not";
  - the "newer one steps aside" rule is scoped to one owner (D11);
  - the entry count in the plain-copy line is recounted from the test, not copied.

  Verify: every number in the edited lines matches `issue-plain-copy.test.ts`'s count.
- [x] 3.5 Commit: `feat(contracts): Lighthouse SEO and accessibility codes, and counterpart groups`.

## 4. Storage — SPEED-017, SPEED-018, SPEED-019

- [x] 4.1 Write first in `be/src/modules/pages/repositories/page-speed/page-speed.repository.int-spec.ts`:
  - "refuses Lighthouse lists set one without the other";
  - "refuses a code in both Lighthouse lists";
  - "refuses a failed count above the judged list's size";
  - "refuses shares whose sum exceeds 1";
  - "refuses a share on a lab-sourced metric";
  - "refuses a `lab` TTFB source";
  - "a measurement without the new columns is still accepted".

  They fail: there are no columns. Verify: `pnpm --filter be test:db -- page-speed` fails on them.

  AMENDED during implementation:
  - **No red run.** The cases were written before the schema, but they were not run red
    separately: the int-spec cannot compile against columns that do not exist, so the
    failure is a type error, not the constraint.
  - **More cases than listed.** Each of the 13 refusal cases names the constraint it must
    trip:
    - lists set apart, overlapping or duplicated;
    - a failed count above the list;
    - verdicts without a measurement;
    - an SEO score over 100;
    - TTFB without its source, or with `lab` as its source;
    - shares over 1, a share without its pair, shares on a lab metric or an absent one.

    Plus "accepts a whole measurement with every new part, and one without any".
  - **A found hole.** `null in ('url','origin')` is null, and a CHECK passes null. So the
    "field only" check coalesces it to false; without that, "shares on an absent TTFB" was
    accepted.
- [x] 4.2 Edit `be/src/persistence/schema/tables/page-speed/page-speed.schema.ts`:
  - columns, all nullable:
    - `lighthouse_judged`, `lighthouse_not_applicable`, `lighthouse_failed`;
    - `seo_score`, `accessibility_score`;
    - `ttfb_ms`, `ttfb_source`;
    - `{lcp,inp,cls,ttfb}_good_share`, `_poor_share`;
    - `lcp_breakdown_json`;
  - CHECKs per design D6, D7, D21 and the ranges.

  Run `pnpm db:generate` and READ `be/drizzle/0015_*.sql`. It must contain only `ADD COLUMN` and
  `ADD CONSTRAINT`, with no default and no rewrite. Then `pnpm db:migrate`. Never edit the file.
  If `desktop-core-web-vitals` landed first, its migrations come before this one and its
  `strategy` CHECK is added here (D16). Verify: the SQL reads as stated, and
  `pnpm --filter be test:db -- page-speed` passes.

  Done: `be/drizzle/0015_modern_wrecker.sql` was read, and holds 16 `ADD COLUMN` and 12
  `ADD CONSTRAINT` and nothing else. `page-speed.repository` int-spec: 39 passed. Migrated
  into this worktree's own databases (`seo_tracker_lighthouse`, `_test`), so agents on other
  branches are not affected. The `ILcpBreakdown` type and `LCP_PHASES` were added to
  contracts here for the column's `$type`.

  AMENDED during implementation: the design said the breakdown's zod schema lives in
  `@app/contracts`. Contracts has no zod dependency, and the repository mirrors wire shapes
  as zod on each side instead (`skills/be-canonical-fe-mirror`). So the TYPE lives in
  contracts, and each side writes its own schema against it: the backend extractor, and the
  frontend gateway.
- [x] 4.3 Commit: `feat(db): page_speed stores Lighthouse verdicts, field TTFB, visit shares and
  the LCP breakdown`.

## 5. The worker reads and writes it — SPEED-016, SPEED-017, SPEED-018, SPEED-019

- [x] 5.1 Write first in `be/src/modules/page-speed/services/psi-client/psi-client.spec.ts`:
  "a mobile request asks for performance, seo and accessibility, the key only in the header".
  Then `PsiClient.requestUrl`. Verify: `pnpm --filter be test:ci -- psi-client`.
- [x] 5.2 Write first in `be/src/modules/page-speed/services/extract-lighthouse/extract-lighthouse.spec.ts`,
  against the recorded fixtures:
  - "binary 1 is judged";
  - "binary 0 is judged and a finding with the catalogue's severity";
  - "notApplicable is listed as such";
  - "an errored audit is in neither list";
  - "an unknown audit id is ignored and reported once";
  - "an answer without the categories gives null lists and no findings";
  - "reads both category scores".

  Then `extractLighthouse(body)` (pure, its own zod schema, codes looked up by audit id through a
  map derived from the catalogue, D23). Verify: `pnpm --filter be test:ci -- extract-lighthouse`.
- [x] 5.3 Write first in `extract-measurement.spec.ts`:
  - "TTFB from the URL, else the origin, never the lab";
  - "good and poor shares from the metric's own source";
  - "no shares for a lab metric";
  - "CLS shares read the same scale as the value";
  - "the LCP breakdown with a text element has no load phases";
  - "an answer without the breakdown still measures".

  Then extend `extractMeasurement` (or a sibling `extractDiagnostics`, if the function grows
  past one concern), plus a zod schema for `lcp_breakdown_json` in `@app/contracts` that is used
  at write and at read. Verify: `pnpm --filter be test:ci -- extract-measurement`.

  AMENDED during implementation:
  - **A sibling, not an extension.** `extractDiagnostics` sits beside `extractMeasurement`
    rather than extending it: the existing assertions on `extractMeasurement`'s exact shape
    stay as they were.
  - **Same visits.** Both read the field through one `fieldReader`, so a share always comes
    from the data its metric's value came from.
  - **Bad breakdown is no error.** A breakdown that does not parse reads as none
    (`.catch(undefined)` on that audit), never as a failed measurement.
  - **Where the schema lives.** The breakdown's zod schema is in the extractor, per the 4.2
    amendment.
  - **Tests.** Eight new cases, pinned on the two live `lighthouse-*` answers.
- [x] 5.4 Write first in `page-speed-results.service.spec.ts` and the repository int-spec:
  - "a measurement writes the Lighthouse lists, the failed count and the Lighthouse findings in
    one transaction";
  - "a Lighthouse replace leaves crawl and Core Web Vitals findings";
  - "an answer without categories removes earlier Lighthouse findings" (D20);
  - "a failed attempt leaves every new column as it was".

  Then:
  - `seo-issues.repository.ts` `replaceLighthouseFindingsForWorker` deletes only
    `issueCodesOf('lighthouse')`;
  - `completeForWorker` takes the Lighthouse record;
  - `page-speed-executor.service.ts` calls both extractors and the unknown-audit warn (once per
    id per process).

  Verify: `pnpm --filter be test:ci -- src/modules/page-speed src/modules/pages && pnpm --filter
  be test:db -- page-speed seo-issues`.

  AMENDED during implementation:
  - **Measured outcome.** The classifier's `measured` outcome now carries `diagnostics` and
    `lighthouse` beside `measurement`, so the executor writes all three from one parse.
  - **Complete write.** `IPageSpeedMeasurementWrite` makes every new column REQUIRED and
    nullable, so each measurement writes all of them and an absent part clears an old one
    (D20).
  - **First red run.** The executor tests were seen failing on the missing fourth argument
    before the code.
  - **Bug in my own test.** One test of mine expected `hreflang` to be not applicable on
    yoast.com. The live answer says it passes, so the test now uses `accesskeys`.
  - **Results.** BE: 1208 unit tests, 44 db tests in `seo-issues` and `page-speed`. Lint
    clean.
- [x] 5.5 Update `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`:
  - what the call asks for;
  - the status mapping table (D13);
  - "no categories is not an error" (D20);
  - the live audit ids from 1.2.

  Verify: the doc names only ids present in a fixture.
- [x] 5.6 Commit: `feat(page-speed): Lighthouse SEO and accessibility verdicts, field TTFB, visit
  shares and the LCP breakdown`.

## 6. Reading: score, checks per owner, summary — PAGES-009, PAGES-012, PAGES-016, PAGES-017, REPORT-005

- [x] 6.1 Write first in `packages/contracts/src/domain/pages/page-score/page-score.util.test.ts`:
  - "sums every scored owner";
  - "an absent owner contributes nothing and is reported absent";
  - "16/2 crawl and 20/3 Lighthouse score 86".

  Then:
  - `pageScoreOf(byOwner: { [O in TScoredIssueOwner]: { applicable, failed } | null })` returns
    `{ value, applicable, failed, byOwner }`;
  - `IPageScore` gains `byOwner`;
  - `TTFB` thresholds go in `FIELD_METRIC_THRESHOLDS` with `fieldBandOf` (D22);
  - the summary types gain `ttfb`, `share`, `lcpBreakdown`, `seoScore` and
    `accessibilityScore`;
  - `IPageCheck<O>`;
  - `IPageDetail.checksByOwner` replaces `checks` (**BREAKING**, ships with the FE in group 7).

  Verify: `pnpm --filter @app/contracts test:ci`.
- [x] 6.2 Write first in `be/src/modules/pages/repositories/page-list/page-list.repository.int-spec.ts`:
  "orders by the score summed over crawl and Lighthouse". Use the PAGES-009 scenario: B (90
  crawl-only, 80 with Lighthouse) comes before A (88). It fails on today's ORDER BY. Then change
  `page-list.repository.ts:134` to sum `p.checks_*` with `coalesce(cardinality(ps.lighthouse_judged), 0)`
  and `coalesce(ps.lighthouse_failed, 0)`, still `::numeric`. The tie-breakers stay. Verify:
  `pnpm --filter be test:db -- page-list`.
- [x] 6.3 Write first in `compose-page-checks.spec.ts` and `page-read.service.spec.ts`:
  - "composes each scored owner from its own lists";
  - "Lighthouse null while the crawl is present, and the reverse";
  - "an errored Lighthouse code is not recorded";
  - "no Core Web Vitals code is a check".

  Then:
  - generalise `composePageChecks(owner, judged, notApplicable, failed)` over
    `issueCodesOf(owner)` filtered to active codes;
  - `page-detail.repository.ts` selects `ps.lighthouse_*`;
  - `page-read.service.ts` builds `checksByOwner` and the per-owner score for list and detail;
  - `page-speed-summary-of.ts` maps the new summary fields with `fieldBandOf`.

  Verify: `pnpm --filter be test:ci -- src/modules/pages`.

  AMENDED during implementation:
  - **Where the lists are read.** The detail reads Lighthouse's two lists in its own query
    (`ps.lighthouse_judged`, `ps.lighthouse_not_applicable` on `findCurrentPage`). They are
    kept out of `PAGE_SPEED_COLUMNS`, so the list never carries 66 codes per row: it gets
    `cardinality(lighthouse_judged)` and `lighthouse_failed` instead.
  - **Stored breakdown.** It is read through a zod schema in `page-speed-read.ts`, so a
    shape written under an older Lighthouse reads as none.
  - **Active codes.** `composePageChecks(owner, …)` lists every Lighthouse code as active,
    because Lighthouse retires an audit by no longer reporting it.
- [x] 6.4 Write first in `be/test/e2e/page-speed.e2e-spec.ts`:
  - "a Lighthouse finding counts in the issue counts, the spread and the score" (PAGES-016);
  - in the issue-report int-spec: "returns a Lighthouse finding at its page beside the crawl
    finding it repeats" (REPORT-005).

  The issue counts and the report read `seo_issues` without an owner filter today (scout). If
  both pass without code changes, close the build half as `VERIFIED, NOT BUILT` and keep the
  tests. Verify: `pnpm --filter be test:e2e -- page-speed && pnpm --filter be test:db --
  issue-report`.

  VERIFIED, NOT BUILT (the build half): both new tests passed on the first run with no code
  change, because the issue counts, the client-wide spread and the report read `seo_issues`
  with no owner filter. They stay as the pins:
  - `page-speed.e2e-spec.ts` -> "a Lighthouse finding counts among the issues, in the spread
    and in the score";
  - `issue-report.e2e-spec.ts` -> "reports a Lighthouse finding at each page it is on, never as
    a whole-site row".
- [x] 6.5 Update:
  - `be/src/modules/pages/PAGES_MODULE.md`: two scored writers, the score per owner, the list
    order;
  - `docs/decisions.md`: the "speed never enters the score" entry keeps Core Web Vitals out and
    records that Lighthouse SEO and accessibility are in, citing this change;
  - `README.md:117-120`.

  Verify: `git grep -n "never enters the score\|never moves the SEO score"` reads true in every
  hit.

  Done:
  - `PAGES_MODULE.md`: three owners, the score per owner, `checksByOwner`, the pinning
    line;
  - `docs/decisions.md`;
  - `README.md`.

  Every remaining hit of the grep speaks of Core Web Vitals only. Results: BE 1215 unit
  tests, 200 db and e2e tests, lint clean.
- [x] 6.6 Commit: `feat(pages): Lighthouse verdicts in the score and in the checks, per owner`.

## 7. The page detail — PAGEDETAIL-009, PAGEDETAIL-012, PAGEDETAIL-013

- [x] 7.1 Gateways: in `fe/src/Gateways/PageGateway/Validation/PageSchemas.ts`:
  - `checksByOwner` replaces `checks`, and `pageCheckSchema` takes the owner's codes;
  - the score's `byOwner`;
  - the new summary fields, with the breakdown via the contracts zod schema;
  - `plainVariants` cover Lighthouse codes.

  Write first in `PageSchemas.test.ts`: "accepts a detail with a null Lighthouse list", "rejects
  a Core Web Vitals code as a check". Add `describeIssue` sentences for the Lighthouse codes
  (`DESCRIBE` is a `Record`, so a missing one fails to compile). Verify: `pnpm --filter fe
  test:ci -- PageSchemas describeIssue && pnpm --filter fe typecheck`.

  AMENDED during implementation:
  - **Order of work.** The Lighthouse issue variants and the `describeIssue` sentence landed
    with group 3, because the catalogue could not compile on the frontend without them.
  - **Lighthouse findings have one sentence.** It names the audit (`Lighthouse's
    color-contrast audit failed…`). `DESCRIBE` is typed over every code but Lighthouse's:
    a Lighthouse finding carries no details to read a per-page sentence from.
  - **One schema, one rule.** `checksByOwnerSchema` refuses a code of the wrong owner in a
    list.
- [x] 7.2 Write first in `fe/src/ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks.test.ts`:
  - "one row per counterpart group, each cell its owner's codes";
  - "crawl rows in catalogue order, then Lighthouse SEO, then accessibility, failures first";
  - "marks a row whose owners disagree";
  - "a null owner yields one column line naming why";
  - "counts judged and not applicable per owner".

  Then `summariseChecks(checksByOwner, availability)`. Verify: `pnpm --filter fe test:ci --
  summariseChecks`.

  AMENDED during implementation:
  - **New signature.** `summariseChecks(checksByOwner, { crawledAt, lighthouseMeasuredAt,
    pageSpeedState })` returns columns (title, date, subtitle or the empty line), sections
    and the total failed.
  - **Row order.** A group stands where its first crawl code would, so the five canonical
    codes and ROBOTS_BLOCKS_GOOGLEBOT read on the row of their group's first code, not in
    strict catalogue order. My first test expected strict order and was corrected.
  - **Lighthouse wording.** Lighthouse's not-applicable reason is "Lighthouse found nothing
    on the page for this audit."; its unrecorded one is "Lighthouse did not report this
    audit in its last run.", counted as "not recorded" in its subtitle.
- [x] 7.3 Write first in `ChecksSection.test.tsx`, one test per PAGEDETAIL-009 scenario. Then
  rebuild `ChecksSection.tsx`:
  - two columns, each header with its date in the user's zone;
  - section headings;
  - the disagreement marker with its tooltip;
  - stacked cells under Mantine's `sm` breakpoint.

  Read `fe/skills/folder-structure/SKILL.md` before adding a sub-component folder. Verify:
  `pnpm --filter fe test:ci -- ChecksSection`.

  Done: two columns via `SimpleGrid` that stack below `sm`, each cell labelled there. The
  marker reads "Sources disagree", with the tooltip. The column dates use `formatInZone`.
  Seven tests cover the PAGEDETAIL-009 scenarios.
- [x] 7.4 Write first in `explainScore.test.ts` the three PAGEDETAIL-012 scenarios. Then
  `explainScore(score, lighthouseState)`: the per-owner arithmetic, and "not in the number yet"
  with its reason. Verify: `pnpm --filter fe test:ci -- explainScore`.

  Done: a sixth paragraph. It gives our checks and Lighthouse's with the measurement date,
  or the reason Lighthouse is not in the number. The arithmetic says "crawled and measured"
  when Lighthouse is in it.
- [x] 7.5 Write first in `SpeedSection.test.tsx` the three PAGEDETAIL-013 scenarios. Then:
  - the TTFB line;
  - a share bar per field metric, with its tooltip;
  - the LCP breakdown with its lab label;
  - the two category captions.

  Verify: `pnpm --filter fe test:ci -- SpeedSection`.

  Done:
  - a share bar under each field metric, its tooltip and aria-label from
    `visitShareSentence`;
  - the TTFB line, formatted as ms under a second and seconds above;
  - the LCP breakdown drawn as shares with its phase names, the element selector, and a
    line saying the times do not add up to the LCP shown (per the 1.2 amendment);
  - SEO and accessibility captions.

  Results: the frontend runs 391 tests, the contracts 740, the backend 1215. Lint and
  typecheck are clean.
- [x] 7.6 Commit: `feat(fe): checks in two columns, our checks and Lighthouse, and the speed
  diagnostics`. Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## 8. End to end

- [x] 8.1 Run the stack with a real `PAGESPEED_API_KEY` (`docker compose up -d --build`), crawl
  one client, and wait for its measurements. Open a page detail and confirm, by reading the
  screen:
  - a group row with both verdicts;
  - Lighthouse-only sections;
  - the column dates;
  - the TTFB line, share bars, breakdown and captions;
  - the score explanation's per-owner arithmetic;
  - the client's report holding Lighthouse findings.

  Record anything that contradicts a requirement with `AMENDED during implementation:` on the
  task that built it. Verify: a short note under this task naming the client and page checked.

  AMENDED during implementation: not run as the docker stack, and not checked on screen.
  - **Why not docker.** Other agents run that stack on ports 8080 and 55433 from the main tree.
    Instead the API ran from this worktree on port 3100, against its own database
    (`seo_tracker_lighthouse`), with the real `PAGESPEED_API_KEY` and both workers.
  - **What ran.** `pnpm seed` crawled Semrush live, 15 pages, then crashed on the second
    client. The crash is the crawler's `RequestAbortedError` on a preview image, which 0f331b4
    on the main branch fixes. That fix arrived with the merge of the main branch, and the
    worker then measured two pages live.
  - **What the API said.** Read through it, for
    `https://www.semrush.com/blog/seo-split-test-result-does-bolded-text-help-your-seo/`:
    - score 90 = 90 passed of 100 applicable (crawl 63/4, Lighthouse 37/6). The two measured
      pages head the list at 90 and 93;
    - TTFB 1384 ms from `origin`, needs improvement, and every metric's shares from the same
      source as its value;
    - an LCP breakdown of a text element (h1), in two phases;
    - SEO 92 and accessibility 82;
    - Lighthouse checks: 66 = 31 passed + 6 failed + 29 not applicable + 0 not recorded. No
      "catalogue does not know" warning was logged, so the catalogue matches the live
      Lighthouse;
    - six `LH_*` issues with their page counts.
  - **Not done.** The screen itself (columns, marker, Speed block) was not looked at in a
    browser here. Its rendering is pinned only by the component tests.
- [x] 8.2 `pnpm exec openspec validate lighthouse-checks` passes, and `pnpm lint && pnpm
  typecheck && pnpm test` passes. Verify: both exit 0.

  Done after merging `feat/issue-report-and-pagespeed` (up to 75254fa) into this branch:
  - the four crawl entries it added lost their `owner` field;
  - `openspec validate` is valid;
  - lint and typecheck are clean;
  - contracts run 760 tests, the backend 1306 unit and 202 db/e2e, the frontend 394.
