# Tasks — markup-gap-checks

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 1. Correct this file through
the plan, not beside it. A task that turns out wrong gets an `AMENDED during implementation:`
line; one that was already satisfied is closed as `VERIFIED, NOT BUILT`. A test named "first" is
run and seen failing for the stated reason, then lands in the same commit as the code that turns
it green.

The work stays on `feat/issue-report-and-pagespeed`.

## 1. The inclusion bar is executed (1a) — ANALYSIS-014

- [x] 1.1 Write first `packages/contracts/src/domain/seo/inclusion-bar/inclusion-bar.util.test.ts`:
  - "flags an entry above notice whose every source is industry";
  - "passes one with a first-party source beside the industry one".

  They fail: no module. Verify: `pnpm --filter @app/contracts test:ci` fails on those two.
- [x] 1.2 Add `seo/industry-source-hosts.constant.ts` (`INDUSTRY_SOURCE_HOSTS = ['ahrefs.com',
  'vercel.com']`) and `seo/inclusion-bar/inclusion-bar.util.ts`, both in `src/index.ts`. In
  `seo/seo-issue-catalogue.test.ts`, add "holds the inclusion bar: no industry-only check above
  notice", run over `SEO_ISSUE_CATALOGUE` and `SITE_CHECK_CATALOGUE`. Verify:
  `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
  AMENDED during implementation: `INDUSTRY_SOURCE_HOSTS` also lists `productiveshop.com`, the
  industry host the catalogue already cites (NO_SUBHEADINGS, NO_IMAGES, NO_EXTERNAL_SOURCES);
  every existing entry that cites an industry host also cites a first party, so none violates.
- [x] 1.3 Commit: `feat(contracts): an industry-only check is at most a notice, as a test`.
  Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## 2. Four checks from one page's head (1b) — ANALYSIS-015, ANALYSIS-016, ANALYSIS-017, ANALYSIS-018

Each code gets one commit containing:

- its catalogue entry (owner crawl, severity per plan D2, `plain`, `hint`, an `explanation` of
  more than one sentence, `sources` opened and read on the day, and `skipReason` where it can
  skip);
- its check and spec under `be/src/modules/page-analysis/services/checks/<kebab>/`, registered in
  `checks.registry.ts`;
- its sentence in `fe/src/Core/Helpers/DescribeIssue/describeIssue.ts`, with a case in
  `describeIssue.test.ts`.

- [x] 2.1 `CANONICAL_TO_HTTP` (warning, Google consolidate-duplicate-URLs source). Write first
  `canonical-to-http.check.spec.ts`:
  - "fails an https page whose canonical is http://";
  - "passes an https canonical";
  - "is not applicable on a page served over http";
  - "is not applicable without a canonical".

  Then the check per plan §10.7. Verify: `pnpm --filter be test:ci -- canonical-to-http &&
  pnpm --filter fe test:ci -- describeIssue && pnpm typecheck`.
- [x] 2.2 `OG_URL_MISMATCH` (notice, ogp.me). Write first:
  - "fails og:url naming another page";
  - "compares with the canonical when one is declared";
  - "passes a trailing-slash difference";
  - "is not applicable without og:url".

  Then the check. Verify: `pnpm --filter be test:ci -- og-url-mismatch && pnpm typecheck`.
- [x] 2.3 `META_DESCRIPTION_REPEATS_TITLE` (notice; Ahrefs source, VERIFY the URL as cited).
  Write first:
  - "fails a description equal to the title without its brand suffix";
  - "passes a description that adds words";
  - "is not applicable without a description".

  Then the check. Verify: `pnpm --filter be test:ci -- meta-description-repeats-title &&
  pnpm --filter @app/contracts test:ci`. The contracts run includes the inclusion bar, which this
  entry must pass as a notice.
- [x] 2.4 `BREADCRUMB_MISSING` (notice, Google breadcrumb documentation). Write first:
  - "fails a page declaring none";
  - "passes a BreadcrumbList inside @graph";
  - "passes a Microdata BreadcrumbList".

  Then the check. Verify: `pnpm --filter be test:ci -- breadcrumb && pnpm typecheck`.
  AMENDED during implementation: the four codes land in one commit — the catalogue is one
  file and the conditional-codes list one pinned test, so a commit per code would split one
  reviewed edit four ways. The fixtures moved with them: `makeCheckInput` writes `og:url` as
  the page's own address (so a clean page applies OG_URL_MISMATCH), and the registry spec's
  failing pages carry an http canonical, a description equal to the title and no breadcrumb.
  On the 43 recorded posts the four fired once (BREADCRUMB_MISSING on a Semrush product
  page that declares none) — a corpus read, not the D12 field audit, which is 6.1.
- [ ] 2.5 Re-read the catalogue-size claims. Verify: `git grep -n -E "sixty-one|61 checks|50 page
  checks" -- README.md be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`, and note in the
  harvest list each line to correct.
- [ ] 2.6 Phase acceptance for 1b. Verify: `pnpm --filter be test:ci -- src/modules/page-analysis
  && pnpm --filter @app/contracts test:ci && pnpm --filter fe test:ci -- describeIssue PageSchemas
  ChecksSection && pnpm lint && pnpm typecheck && pnpm test`.

## 3. A title still selling last year, in the owner's year (1c) — ANALYSIS-019

- [ ] 3.1 Write first in `be/src/modules/clients/repositories/crawl-runs/crawl-runs.queue.int-spec.ts`,
  the spec of the worker-side methods: "the run target carries its owner's time zone". It fails:
  no field. Verify: `pnpm --filter be test:db -- crawl-runs` fails on it.
- [ ] 3.2 Make the case pass:
  - `IRunTarget.timeZone: string`;
  - `getRunTargetForWorker` (`crawl-runs.repository.ts:277`) joins `users` for `time_zone`;
  - `ICheckInput.timeZone`, with `make-check-input.ts` defaulting to `'America/Toronto'`;
  - `crawl-run-executor.service.ts` passes `target.timeZone` into every analysis input.

  Verify: `pnpm --filter be test:db -- crawl-runs && pnpm --filter be test:ci -- src/modules/crawl`.
- [ ] 3.3 Write first `title-year-outdated.check.spec.ts` with plan §10.8's cases:
  - "Guide 2026" on Jan 1 00:30 Toronto is current;
  - "SEO guide 2026" at 2027-01-01T04:30Z for a Toronto owner is current;
  - "Best SEO tools for 2025 | Acme" fetched in 2026 fails;
  - "2024 vs 2025: …" passes;
  - "is not applicable without a title".

  They fail: no module.
- [ ] 3.4 Add the check and `title-year-outdated.constant.ts` (prepositions, end punctuation, each
  with its reason), the catalogue entry (notice, Ahrefs source; VERIFY the URL) and the
  `DESCRIBE` sentence. Verify: `pnpm --filter be test:ci -- title-year-outdated &&
  pnpm --filter @app/contracts test:ci && pnpm typecheck`.
- [ ] 3.5 Commits: `feat(clients): a run target carries its owner's time zone` ·
  `feat(page-analysis): a title that names a past year as current`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 4. The missing self-reference is its own finding, reported once (1d) — ANALYSIS-020

- [ ] 4.1 Write first:
  - `hreflang-no-self-reference/hreflang-no-self-reference.check.spec.ts` → "fails a set that
    never names this page", "is not applicable without alternates";
  - `hreflang-invalid.check.spec.ts` → "passes a valid set that omits this page — that is
    HREFLANG_NO_SELF_REFERENCE's".

  The first fails with no module, the second because the arm exists today
  (`hreflang-invalid.check.ts:128-130`). Verify: `pnpm --filter be test:ci -- hreflang` fails on
  those.
- [ ] 4.2 Changes:
  - add the new check, moving the arm out of `HREFLANG_INVALID`: remove `selfReferenced` from its
    details and its evidence line, and update its comment;
  - in the catalogue, the new entry (notice, Google localized-versions source) and
    `HREFLANG_INVALID`'s `hint`, `plain.why`, `plain.fix` and `explanation` without the
    self-reference clause;
  - `make-check-input.ts:47-49`'s comment names the new code.

  Verify: `pnpm --filter be test:ci -- hreflang && pnpm --filter @app/contracts test:ci`.
- [ ] 4.3 Write first `describeIssue.test.ts` → "renders an old HREFLANG_INVALID finding that still
  carries selfReferenced", plus the new code's sentence. Then the two `DESCRIBE` entries. Verify:
  `pnpm --filter fe test:ci -- describeIssue && pnpm --filter fe typecheck`.
- [ ] 4.4 Commit: `feat(page-analysis): a hreflang set that leaves out its own page, reported
  once`. Verify: `pnpm lint && pnpm typecheck && pnpm test`.

## 5. Posts that need JavaScript, said once per site (1e) — ANALYSIS-021

- [ ] 5.1 Write first:
  - `be/src/modules/crawl/services/post-selection/post-selection.service.spec.ts` → "a
    client-rendered post stays skipped_listing, is no page, and carries clientRendered";
  - `be/src/modules/page-analysis/services/site-checks/site-checks.registry.spec.ts` → "reports
    N of M posts that render with JavaScript, naming them", "counts the flag, not the reason
    text", "is not applicable when no post was read".

  They fail: no field. Verify: `pnpm --filter be test:ci -- post-selection site-checks` fails on
  those.
- [ ] 5.2 Changes:
  - `ISelectedItem.clientRendered: boolean` (`crawled-page.interface.ts`), set `true` only at the
    client-rendered skip (`post-selection.service.ts:186-194`, reason text unchanged) and `false`
    everywhere else;
  - `IFetchedEntry.clientRendered: boolean`, passed in `crawl-run-executor.service.ts:264`;
  - `site-checks/content-checks.ts` (`contentNeedsJavascript`, plan §10.10), registered in
    `site-checks.registry.ts`;
  - `CONTENT_NEEDS_JAVASCRIPT` in `SITE_CHECK_CATALOGUE` (notice; Ahrefs and Vercel sources,
    VERIFY each URL; `plain`; `skipReason`).

  Verify: `pnpm --filter be test:ci -- src/modules/crawl src/modules/page-analysis &&
  pnpm --filter @app/contracts test:ci`.
- [ ] 5.3 Check that the run log and the skip reasons are unchanged. Verify: `pnpm --filter be
  test:db -- crawl`.
- [ ] 5.4 Commit: `feat(site-checks): posts that render their content with JavaScript`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 6. Field audit of the markup checks, and its record (1f) — plan D12

- [ ] 6.1 Run the plan §14 field-audit protocol on the docker stack for `CANONICAL_TO_HTTP`,
  `OG_URL_MISMATCH`, `HREFLANG_NO_SELF_REFERENCE`, `TITLE_YEAR_OUTDATED`,
  `META_DESCRIPTION_REPEATS_TITLE`, `BREADCRUMB_MISSING` and `CONTENT_NEEDS_JAVASCRIPT`. Read
  every firing against the live page. VERIFY: where the 2026-10-09 site list is; if it is not in
  the repository, list the sites used in the tally. Verify: the §14 queries print every firing,
  and each is judged.
- [ ] 6.2 For each wrong firing: write first a spec from that site's markup that fails, then fix
  the check, or retire it with `enabled: false`. One `fix(page-analysis): …` commit per defect.
  Verify: `pnpm --filter be test:ci -- src/modules/page-analysis`.
- [ ] 6.3 Update `PAGE_ANALYSIS_MODULE.md`:
  - the section "Field audit of the Ahrefs-gap checks (<date>)" with fired / correct / wrong per
    code, 0 wrong for every enabled code;
  - "What was considered and rejected" gains plan D2's rejected list with its reasons, and plan
    O5 and O8's resolutions;
  - the stale sentence at `:367-369` points at the site catalogue;
  - the "Core Web Vitals … stay out" sentence at `:358-360` says they are measured by PageSpeed,
    never from an HTML timing.

  Verify: `git grep -n "Field audit of the Ahrefs-gap checks" be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`.
- [ ] 6.4 Commit: `docs(page-analysis): the markup checks, audited on live sites; what was
  rejected and why`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker
  compose up -d --build && curl -fsS http://localhost:8080/api/health`.

## 7. Change acceptance

- [ ] 7.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
- [ ] 7.2 Archive and deposit belong to plan phase 6. Harvest first (plan §18), then archive,
  rewrite the headings into the `[ID]` form, and deposit ANALYSIS-014…021 into
  `PAGE_ANALYSIS_MODULE.md`. Verify: `pnpm exec openspec validate --specs && git grep -n -E
  "invariant: ANALYSIS-0(1[4-9]|2[01])" -- '*.md'`.
