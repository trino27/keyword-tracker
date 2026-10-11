# Tasks — image-delivery-finding

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 5. Correct this file through
the plan, not beside it. A task that turns out wrong gets an `AMENDED during implementation:`
line; one that was already satisfied is closed as `VERIFIED, NOT BUILT`. A test named "first" is
run and seen failing for the stated reason, then lands in the same commit as the code that turns
it green.

`desktop-core-web-vitals` must be closed before task 1.1.

## 1. The audit's id and shape, read from a live answer (5a) — plan D10

- [ ] 1.1 Find the audit and record answers that carry it:
  - with the local key, request one mobile PageSpeed answer for a page known for heavy images,
    and read `lighthouseResult.audits` for the image-delivery audit. The candidate is Lighthouse
    13's `image-delivery-insight`, but nothing is assumed;
  - add its id to `KEPT_AUDITS` in `be/test/fixtures/record-pagespeed-fixtures.ts`;
  - record `be/test/fixtures/pagespeed/image-delivery-failing.json` (audit failing, savings at
    least 100 KiB) and `image-delivery-passing.json` (audit passing, or absent).

  Then amend plan §10.12 to what the answer shows: the audit id; what "failing" means (its
  `score`, `scoreDisplayMode`); the path of the total savings; and the per-image url and savings
  paths. Record that here as an `AMENDED during implementation:` line, even when the guess held.
  Verify: `git grep -n -E "key=|AIza" -- be/test/fixtures/pagespeed` prints nothing, and
  `node -e "const a=require('./be/test/fixtures/pagespeed/image-delivery-failing.json');console.log(Object.keys(a.lighthouseResult.audits))"`
  lists the audit.
- [ ] 1.2 Check that the existing fixture readers are unchanged by the larger `KEPT_AUDITS`.
  Verify: `pnpm --filter be test:ci -- extract-measurement page-speed-fixtures`.
- [ ] 1.3 Commit: `test(fixtures): PageSpeed answers that keep the image-delivery audit`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test`.

## 2. The finding (5b) — SPEED-015

- [ ] 2.1 Write first `be/src/modules/page-speed/services/extract-image-delivery/extract-image-delivery.spec.ts`,
  reading the two recorded files from disk:
  - "reads the failing audit's savings and images, largest first, at most 10";
  - "is null for an answer without the audit";
  - "is null for an audit that does not parse".

  It fails: no module. Verify: `pnpm --filter be test:ci -- extract-image-delivery` fails.
- [ ] 2.2 Write `extract-image-delivery.ts`: its own zod schema over exactly the paths 1.1 found,
  and nothing else in the answer read. `extract-measurement.ts` stays untouched. Verify:
  `pnpm --filter be test:ci -- extract-image-delivery extract-measurement`.
- [ ] 2.3 Contracts:
  - `page-speed/image-delivery-measurement.interface.ts` (new);
  - the `IMAGE_DELIVERY_INEFFICIENT` entry: owner `pageSpeed`, `strategy: 'mobile'`, severity
    notice, `min: 102_400`, `plain`, `hint`, an `explanation` saying it is Lighthouse's lab
    estimate from the mobile test, Lighthouse source (VERIFY the URL as cited);
  - `seo-issue.interface.ts` maps it in `TIssueDetails`.

  The case "gives the PageSpeed worker exactly …" now lists thirteen codes. Verify:
  `pnpm --filter @app/contracts test:ci && pnpm typecheck`.
- [ ] 2.4 Write first `be/src/modules/page-speed/services/speed-issues/speed-issues-of.spec.ts`:
  - "raises IMAGE_DELIVERY_INEFFICIENT at 102 400 bytes, not 102 399";
  - "never for desktop";
  - "not for a passing audit with savings";
  - "keeps the CWV findings of cwvIssuesOf unchanged".

  Write first in `page-speed-executor.service.spec.ts`: "an answer without the image audit is
  still a measurement". They fail: no module. Then `speed-issues-of.ts`, and the executor calling
  both extractors and `speedIssuesOf(strategy, …)`. Verify: `pnpm --filter be test:ci --
  src/modules/page-speed`.
- [ ] 2.5 Write first in `fe/src/Gateways/PageGateway/Validation/PageSchemas.test.ts`: "parses an
  image-delivery finding; refuses one with 11 images". Write first in `describeIssue.test.ts`:
  "says how many KiB and how many images". Then `imageDeliverySchema` and the sentence. Verify:
  `pnpm --filter fe test:ci -- PageSchemas describeIssue && pnpm --filter fe typecheck`.
- [ ] 2.6 Commit: `feat(page-speed): images Lighthouse says could be 100 KiB lighter`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 3. Field audit of the image finding (5c) — plan D12

- [ ] 3.1 On the stack with a key, re-crawl the audit sites, or a subset with images. Verify:
  `docker compose exec postgres psql -U tracker -d seo_tracker -c "select p.final_url,
  i.details_json from seo_issues i join pages p on p.id = i.page_id where i.code =
  'IMAGE_DELIVERY_INEFFICIENT'"` prints every firing.
- [ ] 3.2 Compare each firing with pagespeed.web.dev's "Improve image delivery" on Mobile for the
  same URL, and judge it. For each wrong firing, write first a failing spec from that answer, then
  the fix. If the code cannot be made exact, revert `speedIssuesOf`'s call, because `enabled:
  false` governs crawl codes only today (VERIFY at the time). Verify: `pnpm --filter be test:ci --
  speed-issues extract-image-delivery`.
- [ ] 3.3 Record the tally under "Field audit of the Ahrefs-gap checks" in
  `PAGE_ANALYSIS_MODULE.md`. Record the live audit id, the failing rule and "absence is no error"
  in `PAGE_SPEED_MODULE.md`. Commit: `docs(page-speed): image delivery, audited against
  PageSpeed's own report`. Verify: `git grep -n "IMAGE_DELIVERY_INEFFICIENT" -- '*.md'`.

## 4. Change acceptance

- [ ] 4.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 4.2 Archive and deposit belong to plan phase 6. Deposit SPEED-015 into
  `PAGE_SPEED_MODULE.md`. Verify: `pnpm exec openspec validate --specs && git grep -n "invariant:
  SPEED-015" -- '*.md'`.
