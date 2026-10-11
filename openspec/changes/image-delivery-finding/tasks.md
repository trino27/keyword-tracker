# Tasks — image-delivery-finding

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 5, as re-derived on
2026-10-11 against `adc8887` (plan D46, D47, D50). Correct this file through the plan, not beside
it. A task that turns out wrong gets an `AMENDED during implementation:` line; one that was
already satisfied is closed as `VERIFIED, NOT BUILT`, naming what pins it. A test named "first"
is run and seen failing for the stated reason, then lands in the same commit as the code that
turns it green.

`desktop-core-web-vitals` must be closed before task 1.1: every task ticked but its 6.2, which
belongs to plan phase 6. Groups 1–3 are the plan's sub-phases 5a–5c.

## 1. The audit's id and shape, read from a live answer (5a) — plan D10

- [x] 1.1 Find the audit and record answers that carry it:
  - with the local key, request one mobile PageSpeed answer, with the three categories the app
    asks for, for a page known for heavy images, and read `lighthouseResult.audits` for the
    image-delivery audit. The candidate is Lighthouse 13's `image-delivery-insight` (the recorded
    answers report `lighthouseVersion` 13.5.0), but nothing is assumed;
  - add its id to `KEPT_AUDITS` in `be/test/fixtures/record-pagespeed-fixtures.ts`, and two
    targets: `image-delivery-failing.json` (audit failing, savings at least 100 KiB) and
    `image-delivery-passing.json` (audit passing, or absent);
  - record only those two with `node be/test/fixtures/record-pagespeed-fixtures.ts
    image-delivery-`, so no pinned answer is re-recorded;
  - pin both roles in `be/src/modules/page-speed/_testing/page-speed-fixtures.spec.ts`.

  Then amend plan §10.12 to what the answer shows: the audit id; what "failing" means (its
  `score`, `scoreDisplayMode`); the path of the total savings; and the per-image url and savings
  paths. Record that here as an `AMENDED during implementation:` line, even when the guess held.
  VERIFY: a key is in `.env`; the user confirms, and the session never prints `.env`. Verify:
  `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing, and
  `node -e "const a=require('./be/test/fixtures/pagespeed/image-delivery-failing.json');console.log(Object.keys(a.lighthouseResult.audits))"`
  lists the audit.
  AMENDED during implementation (the guess held): the audit is `image-delivery-insight`
  (Lighthouse 13.5.0, `scoreDisplayMode: 'metricSavings'`). Failing is `score < 1`. The total
  savings is `details.debugData.wastedBytes`, and there is no `overallSavingsBytes`. Per image:
  `details.items[]` with `url`, `totalBytes` and `wastedBytes`, which sum to the total.
  `metricSavings` holds LCP and FCP milliseconds, not bytes. The failing answer is
  bbcgoodfood.com/recipes/easy-pancakes (score 0.5, 162 175 bytes over 8 images, "Est savings of
  158 KiB"); the passing one is smashingmagazine.com (score 1, nothing listed). Plan §10.12 is
  amended to this.
- [x] 1.2 Check that the existing fixture readers are unchanged. Verify: `pnpm --filter be test:ci
  -- extract-measurement extract-lighthouse page-speed-fixtures`.
  Done: 53 tests green; no existing answer was re-recorded.
- [x] 1.3 Commit: `test(fixtures): PageSpeed answers that keep the image-delivery audit`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test`.
  Done. AMENDED during implementation: the repo-wide `pnpm lint` failed on another session's
  uncommitted `extract-page.spec.ts` in the shared tree. So this commit was checked on its own
  files: eslint on the two changed files, be typecheck, and 1336 be tests, all green.

## 2. The finding (5b) — SPEED-015

- [x] 2.1 Write first `be/src/modules/page-speed/services/extract-image-delivery/extract-image-delivery.spec.ts`,
  reading the two recorded files from disk:
  - "reads the failing audit's savings and images, largest first, at most 10";
  - "is null for an answer without the audit";
  - "is null for an audit that does not parse";
  - "reads nothing outside its audit" (the result is unchanged when every other audit is deleted
    from the parsed JSON).

  It fails: there is no module. Verify: `pnpm --filter be test:ci -- extract-image-delivery`
  fails.
  Done: it failed on the missing module. A fifth case pins the passing audit as `{ failing: false,
  savingsBytes: 0, images: [] }`.
- [x] 2.2 Write `extract-image-delivery.ts`: its own zod schema over exactly the paths 1.1 found.
  `extract-measurement.ts` stays untouched (P8). Verify: `pnpm --filter be test:ci --
  extract-image-delivery extract-measurement`.
  Done: its own schema over `image-delivery-insight` (`score`, `details.debugData.wastedBytes`,
  `details.items[].url/wastedBytes`); `extract-measurement.ts` untouched.
- [x] 2.3 Contracts (`packages/contracts/src/domain/`):
  - `page-speed/image-delivery-measurement.interface.ts` (new);
  - `seo/catalogue/page-speed/page-speed-catalogue.constant.ts`: the `IMAGE_DELIVERY_INEFFICIENT`
    entry, `strategy: 'mobile'`, severity notice, `min: 102_400`, `plain`, `hint`, an
    `explanation` saying it is Lighthouse's lab estimate from the mobile test and never moves the
    score, a Lighthouse source (VERIFY the URL as cited);
  - `seo/seo-issue.interface.ts`: `TIssueDetails` maps it to `IImageDeliveryMeasurement`;
  - `issue-report/client-issue-report.interface.ts`: the `allPages` arm narrows to `TCwvSeoIssue`
    (plan D47).

  In `seo/seo-issue-catalogue.test.ts`: the PageSpeed worker's list holds thirteen codes; "splits
  the speed codes by strategy" adds "and image delivery is mobile's"; "the crawl and Lighthouse
  are scored, the Core Web Vitals are not" adds "IMAGE_DELIVERY_INEFFICIENT is a pageSpeed code"
  (plan D50). `issue-plain-copy.test.ts` holds its copy to the limits. Verify:
  `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
  Done. The Lighthouse source is the audit's own "Learn more" link,
  developer.chrome.com/docs/performance/insights/image-delivery (answered 200), beside About
  PageSpeed Insights. "Names the device in every CWV label" now iterates the CWV leaves only,
  because the image label is not a CWV label. `CWV_CODES` (the flattened leaves) joined
  `cwv-issue-codes.constant.ts` so the report's fold and the frontend schema read one list.
- [x] 2.4 Write first:
  - `be/src/modules/page-speed/services/speed-issues/speed-issues-of.spec.ts`: "raises
    IMAGE_DELIVERY_INEFFICIENT at 102 400 bytes, not 102 399"; "not for a passing audit with
    savings"; "keeps the CWV findings of cwvIssuesOf unchanged"; "the desktop overload returns
    CWV findings only";
  - `classify-psi-response.spec.ts`: "an answer without the image audit is still measured";
    "carries the image delivery of a failing answer";
  - `page-speed-executor.service.spec.ts`: "a mobile measurement stores the image finding beside
    its CWV findings".

  They fail: no module, no `imageDelivery` on the outcome. Then `speed-issues-of.ts` (two
  overloads, plan §10.11), `classifyPsiResponse` calling `extractImageDelivery` beside the other
  extractors (plan D46), and the executor calling `speedIssuesOf` in place of `cwvIssuesOf`.
  Verify: `pnpm --filter be test:ci -- src/modules/page-speed`.
  Done: the specs failed on the missing module and on `imageDelivery` absent from the outcome.
- [x] 2.5 Write first in
  `be/src/modules/issue-report/services/collapse-origin-findings/collapse-origin-findings.spec.ts`:
  "keeps IMAGE_DELIVERY_INEFFICIENT at its page, and folds origin-sourced desktop CWV codes into
  one row each". Then `isSpeed` becomes `isCwv` over `TCwvIssueCode`. Verify: `pnpm --filter be
  test:ci -- src/modules/issue-report`.
  Done. Honest note: the new case would have passed before the change, because image delivery
  has no `source` and was never folded. The change is the type: `isCwv` narrows to
  `TCwvSeoIssue`, and the `allPages` row no longer admits it.
- [x] 2.6 Write first in `fe/src/Gateways/PageGateway/Validation/PageSchemas.test.ts`: "parses an
  image-delivery finding; refuses one with 11 images". The existing loop at `:153` (every
  `PAGE_SPEED_ISSUE_CODES` parsed with CWV details) fails once the entry exists; rewrite it over
  `CWV_ISSUE_CODES`' leaves. Write first in `describeIssue.test.ts`: "says how many KiB and how
  many images". Then `imageDeliverySchema`, CWV-only `speedVariants` and `pageSpeedIssueSchema`,
  `IssueReportSchemas.ts`' `allPagesRowSchema` over `TCwvSeoIssue`, and the sentence. Verify:
  `pnpm --filter fe test:ci -- PageSchemas describeIssue IssueReport && pnpm --filter fe
  typecheck`.
  Done. The `:153` loop the plan named no longer exists in that form (it checks that
  `pageCheckSchema` refuses speed codes, which still holds). Two more Records over every code
  needed the entry: `checkTopics.ts` ("speed") and the Info guide (`groups/imageDelivery.ts`,
  a new file, so as not to collide with another session's edits of the other groups).
- [x] 2.7 Check that a speed finding still never moves the score, with this code among them.
  Verify: `pnpm --filter be test:db -- page-speed issue-report`, where "a speed finding counts
  among the issues and leaves the score and the order unchanged" has an image-delivery finding
  in its fixture.
  Done. AMENDED during implementation: a new e2e case answers every mobile page with
  `image-delivery-failing.json`. It finds the finding in the detail, the crawl's share of every
  page's score unchanged, the score owned by crawl and Lighthouse only, and Lighthouse's failures
  equal to its own `LH_*` findings. The existing "a speed finding counts …" case keeps its
  CWV-only answer.
- [x] 2.8 Commit: `feat(page-speed): images Lighthouse says could be 100 KiB lighter`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
  Done: contracts 794, be 1380, fe 446, db/e2e 226 green; lint and typecheck clean.

## 3. Field audit of the image finding (5c) — plan D12

- [ ] 3.1 On the stack with a key, re-crawl the audit sites, or a subset with images. Verify:
  `docker compose exec postgres psql -U tracker -d seo_tracker -c "select p.final_url,
  i.details_json from seo_issues i join pages p on p.id = i.page_id where i.code =
  'IMAGE_DELIVERY_INEFFICIENT'"` prints every firing.
- [ ] 3.2 Compare each firing with pagespeed.web.dev's "Improve image delivery" on Mobile for the
  same URL, and judge it. For each wrong firing, write first a failing spec from that answer, then
  the fix. If the code cannot be made exact, retire it by removing the image arm from
  `speedIssuesOf` and keeping the entry, the details type and the schema variant, so stored
  findings still parse. `enabled: false` retires crawl codes only (`ACTIVE_ISSUE_CODES`,
  `issue-catalogues.constant.ts:168-170`). Verify: `pnpm --filter be test:ci -- speed-issues
  extract-image-delivery`.
- [ ] 3.3 Record the tally under "Field audit of the Ahrefs-gap checks" in
  `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`. Record the live audit id, the failing
  rule, "absence is no error" and why the code is pageSpeed's and not Lighthouse's in
  `be/src/modules/page-speed/PAGE_SPEED_MODULE.md`. Commit: `docs(page-speed): image delivery,
  audited against PageSpeed's own report`. Verify: `git grep -n "IMAGE_DELIVERY_INEFFICIENT" --
  be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md be/src/modules/page-speed/PAGE_SPEED_MODULE.md`.

## 4. Change acceptance

- [ ] 4.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 4.2 Archive and deposit belong to plan phase 6. Deposit SPEED-015 into
  `PAGE_SPEED_MODULE.md`. Verify: `pnpm exec openspec validate --specs && git grep -n "invariant:
  SPEED-015" -- '*.md'`.
