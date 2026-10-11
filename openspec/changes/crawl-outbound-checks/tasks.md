# Tasks — crawl-outbound-checks

Generated from the plan `ahrefs-gap-checks` (`docs/_plans/`), Phase 3. Correct this file through
the plan, not beside it. A task that turns out wrong gets an `AMENDED during implementation:`
line; one that was already satisfied is closed as `VERIFIED, NOT BUILT`. A test named "first" is
run and seen failing for the stated reason, then lands in the same commit as the code that turns
it green.

`markup-gap-checks` must be closed before task 1.1.

## 1. A request for a status reads no body; a missing domain is named (3a) — REMOTE-005

- [x] 1.1 Write first in `be/src/infrastructure/remote-api/undici-http-transport/undici-http-transport.spec.ts`:
  "a zero-byte cap returns the head and frees the connection". Use a local server that streams an
  endless body, and nine `send` calls with `maxBytes: 0, overflow: 'truncate'` on one origin; all
  must resolve within the timeout. It fails if the body is drained. VERIFY: `readCapped`
  (`undici-http-transport.ts:101-107`) may already make this pass on its first run. If so, close
  the task `VERIFIED, NOT BUILT`, naming the test. Verify: `pnpm --filter be test:ci --
  undici-http-transport`.
- [x] 1.2 Write first `be/src/infrastructure/remote-api/remote-failure-kind/remote-failure-kind.spec.ts`,
  driving the real `createGuardedLookup` with a `resolveAll` that rejects:
  - "a lookup answering ENOTFOUND is nxdomain";
  - "EAI_AGAIN is network";
  - "a timeout is timeout";
  - "a forbidden address is forbiddenAddress".

  It fails: no module. Then write `remote-failure-kind.ts`. VERIFY: undici surfaces `ENOTFOUND` on
  `error.cause` or one level deeper. If it does not surface at all, record that here with
  `AMENDED during implementation:` and drop nxdomain from plan §10.1 (plan R9). Verify:
  `pnpm --filter be test:ci -- remote-failure-kind`.
- [x] 1.3 Add `SiteHttpClient.checkLink(url, signal)` (`maxBytes: 0`, `overflow: 'truncate'`,
  `maxRetries: 0`, `timeoutMs: OUTBOUND_CHECK_LIMITS.timeoutMs`) and `readDocument(url, signal)`
  (`SITE_FETCH_LIMITS.htmlBytes`, decoded as `getHtml`, `maxRetries: 0`, the same timeout), with
  `site-http-client.spec.ts` cases:
  - "checkLink asks once, with no body";
  - "readDocument does not retry a 503".

  Write the cases first; they fail with no method. Verify: `pnpm --filter be test:ci --
  site-http-client`.
- [x] 1.4 `be/eslint.config.mjs`: a block for `src/modules/page-analysis/services/{checks,site-checks}/**/*.ts`
  (ignoring specs). It re-composes `LOGGER_RESTRICTION` and `DB_ACCESS_PATTERNS`, and adds
  patterns banning `@infrastructure/remote-api/**` and `@modules/crawl/**` (plan D28). Add a
  deliberate import to one check, see the lint fail, then remove it. Verify: `pnpm --filter be
  lint`.
- [x] 1.5 Commits:
  - `feat(site-http-client): ask a URL for its status without reading its body`
  - `feat(remote-api): name a domain that does not exist`
  - `build(lint): checks cannot reach the network`

  Verify: `pnpm lint && pnpm typecheck && pnpm test`.

  AMENDED during implementation: 1.1 is VERIFIED, NOT BUILT — "a zero-byte cap returns the head
  and frees the connection" passed on its first run (`readCapped` aborts at the first chunk);
  the test stays. 1.2 — undici does surface `ENOTFOUND`: the spec drives the real transport and
  the real guarded lookup, and `remoteFailureKind` reads it on the cause chain, so nxdomain
  stays in plan §10.1. 1.3 — `OUTBOUND_CHECK_LIMITS` was written here, ahead of 2.4, since
  both methods read its timeout. 1.4 — a deliberate import of `@modules/crawl` into a check was
  seen failing the lint, then removed.

## 2. The outbound stage, its budgets and robots per host (3b) — CRAWL-011, CRAWL-012, CRAWL-013

- [x] 2.1 Write first `be/src/infrastructure/remote-api/_testing/fixture-http-transport.spec.ts` →
  "an unrecorded URL asked for its status only answers 200". It fails today: 404. Then add the
  rule to `fixture-http-transport.ts` with a comment saying why: without it, every recorded post's
  external links would read as broken. A request with `maxBytes === 0` and no entry answers 200
  with an empty body, and `override` still wins. Commit: `test(fixtures): an unrecorded status
  check answers 200, never the network`. Verify: `pnpm --filter be test:ci -- fixture-http-transport`.
- [x] 2.2 Write first `be/src/modules/page-analysis/services/checks/_shared/document-facts.spec.ts`:
  - "reads noindex from meta robots, googlebot and X-Robots-Tag";
  - "reads the first declared canonical";
  - "keeps the alternates".

  They fail: no module. Then write `document-facts.ts` and
  `interfaces/outbound-facts.interface.ts` (plan §7). Verify: `pnpm --filter be test:ci --
  document-facts`.
- [x] 2.3 Write first `be/src/modules/crawl/services/outbound-checks/outbound-checks.service.spec.ts`
  (`FixtureHttpTransport`, fake clock):
  - "checks at most 300 link URLs and marks the rest unchecked: budget";
  - "orders by sitemap position, then document order";
  - "builds a run page's outcome from its own fetch, without a request";
  - "reads at most 30 documents, canonical targets first";
  - "never has more than 8 in flight, nor more than 2 for one host";
  - "asks each URL once, without retry";
  - "stops at the deadline and marks the rest unchecked: deadline";
  - "fetches each external host's robots.txt once";
  - "never requests a disallowed URL";
  - "treats an unreachable robots.txt as disallowing the host";
  - "a host refusing every connection leaves outcomes, not an error".

  They fail: no module. Verify: `pnpm --filter be test:ci -- outbound-checks` fails.
- [x] 2.4 Write `crawl/constants/outbound-checks.constant.ts` (`OUTBOUND_CHECK_LIMITS`, each number
  with its reason), `services/outbound-checks/host-robots-cache.ts` with its spec, and
  `outbound-checks.service.ts` (plan §10.2–§10.5), listed in `crawl.module.ts` providers.
  Verify: `pnpm --filter be test:ci -- outbound-checks host-robots-cache`.
- [x] 2.5 Write first in `crawl-run-executor.service.spec.ts`:
  - "runs the outbound stage after fetch and before analysis, outside the transaction";
  - "an outbound stage that times out leaves the run succeeded".

  They fail: no stage. Then:
  - `run-stages.ts` `CRAWL_STAGES` gains `'outbound'`;
  - `IRunContext.outbound` and `emptyRunContext`;
  - the stage in the executor's pipeline list;
  - `analyse()` passes `linkStatuses` to every page;
  - `ICheckInput.linkStatuses: IOutboundFacts`, with `make-check-input.ts` defaulting to empty
    maps.

  Verify: `pnpm --filter be test:ci -- src/modules/crawl src/modules/page-analysis`.
- [x] 2.6 Make sure the recorded corpus still behaves the same with empty facts. Verify:
  `pnpm --filter be test:ci -- checks.registry && pnpm --filter be test:db -- crawl`.
- [ ] 2.7 On the stack, re-crawl a seed client. Verify: `docker compose up -d --build`, then after
  the run `docker compose logs be | grep '"Crawl run stages"' | tail -n 2` shows an `outbound`
  timing under 60000.
- [x] 2.8 Commit: `feat(crawl): an outbound stage — links and documents under a budget, robots per
  host`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

  AMENDED during implementation: 2.3/2.4 — the budget is injected under `OUTBOUND_LIMITS`
  (the constant by default), so the spec shrinks it instead of faking a clock; the spec uses a
  transport that measures what is in flight, and adds "a link that cannot be reached is a
  failure with its kind". 2.6 — the e2e crawls log an `outbound` timing (8–14 ms over the
  fixtures). 2.7 is not done yet: rebuilding the docker stack from this working tree would
  ship another session's unfinished edits; the live check runs through the field-audit
  harness in 3f instead.

## 3. `BROKEN_LINKS` and `LINKS_TO_REDIRECTS` (3c) — ANALYSIS-024, ANALYSIS-025

- [x] 3.1 Move `variantsOf` from `internal-link-variants.check.ts:14-31` to
  `_shared/link-variants.ts`, unchanged. Commit: `refactor(page-analysis): link variants,
  shared`. Verify: `pnpm --filter be test:ci -- internal-link-variants`.
- [x] 3.2 Write first `_shared/link-verdict.spec.ts`:
  - plan §10.1's table as `it.each`;
  - `it.each([401, 403, 429, 999, 500, 503])` "an external %d is unknown, never broken";
  - "the BROKEN_LINKS explanation names every external broken status and says 403, 429 and 5xx
    are never reported".

  They fail: no module. Verify: `pnpm --filter be test:ci -- link-verdict` fails.
- [x] 3.3 Write `link-verdict.ts` (`EXTERNAL_BROKEN_STATUSES = [404, 410]`, `linkVerdictOf`). Add
  the `BROKEN_LINKS` catalogue entry: notice, Ahrefs source (VERIFY the URL); its explanation
  states plan D3's rule in words; `skipReason` "The page has no content links, or none could be
  checked." Verify: `pnpm --filter be test:ci -- link-verdict && pnpm --filter @app/contracts
  test:ci`.
- [x] 3.4 Write first `broken-links/broken-links.check.spec.ts`:
  - "an unchecked link is neither broken nor fine, and the evidence says checked N of M";
  - "is not applicable when no link could be checked";
  - "fails an internal 500";
  - "fails an external 410";
  - "passes an external 403";
  - "skips a link to this site's development host — that is DEVELOPMENT_HOST_REFERENCES's"
    (plan D36; the check reads `isOwnDevelopmentHost`, the predicate
    `development-host-references.check.ts:40-43` applies to content links).

  It fails: no module. Then the check, registered, and its `DESCRIBE` sentence. Verify:
  `pnpm --filter be test:ci -- broken-links && pnpm --filter fe test:ci -- describeIssue &&
  pnpm typecheck`.
- [x] 3.5 Write first `links-to-redirects/links-to-redirects.check.spec.ts`:
  - "fails an internal link that redirects";
  - "skips a link INTERNAL_LINK_VARIANTS reports";
  - "skips a link to this site's development host — that is DEVELOPMENT_HOST_REFERENCES's" (plan
    D36);
  - "ignores an external redirect";
  - "is not applicable without checked internal links".

  It fails: no module. Then the check, the catalogue entry (notice, Ahrefs, VERIFY the URL) and
  `DESCRIBE`. Verify: `pnpm --filter be test:ci -- links-to-redirects && pnpm typecheck`.
- [x] 3.6 Write first in `be/test/e2e/crawl.e2e-spec.ts`: "stores BROKEN_LINKS and
  LINKS_TO_REDIRECTS for a post linking to a recorded 404 and a recorded 301". Override two URLs
  in the fixture transport. Verify: `pnpm --filter be test:db -- crawl`.
- [x] 3.7 Commits:
  - `feat(page-analysis): broken links in the text — external only on 404, 410 or no domain`
  - `feat(page-analysis): links to this site that redirect`

  Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

  AMENDED during implementation: the two checks landed in one commit — their catalogue
  entries are neighbours and one pinned conditional list names both. Both read the links
  through `_shared/content-links.ts` (fragment-free, the page itself and this site's own
  development host left out, plan D36), the same keys the outbound stage uses. Sources: Ahrefs'
  "How to find and fix broken links" and Google's "How HTTP status codes, and network and DNS
  errors affect Google Search" for BROKEN_LINKS; Google's "link to the canonical URL rather
  than a duplicate" (consolidate-duplicate-urls) and Ahrefs' internal-links guide for
  LINKS_TO_REDIRECTS — each opened and read on 2026-10-11. The registry spec's clean pages now
  carry answered links (`runPage`), and its broken pages a redirecting and a dead link. The
  e2e case in 3.6 passed on its first run, since 3.4 and 3.5 had built what it pins.

## 4. `CANONICAL_TARGET_BROKEN` (3d) — ANALYSIS-026

- [ ] 4.1 Write first `canonical-target-broken/canonical-target-broken.check.spec.ts`, one case per
  outcome of plan §10.5, each from an `IDocumentFacts`:
  - "is not applicable without a canonical elsewhere";
  - "is not applicable for an unread target";
  - "fails a redirecting target";
  - "fails a 404 target";
  - "fails a noindexed target";
  - "fails a chain";
  - "passes a healthy target";
  - "judges a run page from its own facts";
  - "is not applicable to the http twin — that is CANONICAL_TO_HTTP's" (plan D36, through
    `isHttpTwin` from `markup-gap-checks`);
  - "is not applicable to a development-host target — that is DEVELOPMENT_HOST_REFERENCES's"
    (plan D36, `isDevelopmentHost`).

  It fails: no module. The rules live in `_shared/canonical-target.ts`
  (`canonicalTargetProblemOf`) with its own spec. Verify: `pnpm --filter be test:ci --
  canonical-target` fails.
- [ ] 4.2 Add the check, registered; the catalogue entry (warning, Google canonicalization
  source); `DESCRIBE`; and the e2e case in `crawl.e2e-spec.ts`, "a canonical naming a recorded 301
  stores CANONICAL_TARGET_BROKEN and not CANONICAL_MISMATCH". Verify: `pnpm --filter be test:ci
  -- canonical-target-broken canonical-conflict && pnpm --filter be test:db -- crawl`.
- [ ] 4.3 `CANONICAL_MISMATCH` steps aside for a broken target (plan D34) — ANALYSIS-026.
  - Write first in `canonical-mismatch.check.spec.ts`:
    - "is not applicable when the target is broken — that is CANONICAL_TARGET_BROKEN's". It
      fails: CANONICAL_MISMATCH fails today.
    - "judges as before when the target was not read". It passes, and guards the budget case.
  - Then `canonical-mismatch.check.ts` reads `linkStatuses` through `canonicalTargetProblemOf`
    and answers not applicable when it returns a problem. Its catalogue `skipReason` names the
    broken target beside its other reasons.

  Verify: `pnpm --filter be test:ci -- canonical-mismatch canonical-target checks.registry`. The
  corpus test runs with empty facts, where every target is unread, so it must be unchanged.
- [ ] 4.4 The sitemap keeps the entry (plan D37, derived, not yet confirmed by the user) —
  ANALYSIS-026. Write first `site-checks.registry.spec.ts` → "names an entry whose canonical
  target is broken" (the page carries `CANONICAL_TARGET_BROKEN` and no `CANONICAL_MISMATCH`). It
  fails after 4.3. Then `contradictionOf` (`sitemap-checks.ts`) reads the
  `CANONICAL_TARGET_BROKEN` finding's canonical. Verify: `pnpm --filter be test:ci -- site-checks`.
- [ ] 4.5 Commits: `feat(page-analysis): a canonical whose target redirects, is broken, noindexed
  or canonicalised again` · `feat(page-analysis): a canonical mismatch steps aside for a broken
  target`. Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 5. `HREFLANG_NOT_RECIPROCAL` (3e) — ANALYSIS-027

- [ ] 5.1 Write first `hreflang-not-reciprocal/hreflang-not-reciprocal.check.spec.ts`:
  - "fails an alternate that answers 200 and does not name this page";
  - "passes an alternate that names this page with a trailing-slash difference";
  - "does not judge a redirected alternate";
  - "skips x-default";
  - "is not applicable when no alternate could be read";
  - "skips an alternate whose code HREFLANG_INVALID reports" (plan D36);
  - "skips a development-host alternate — that is DEVELOPMENT_HOST_REFERENCES's" (plan D36,
    `isDevelopmentHost`);
  - "is not applicable when the canonical names another URL — that is HREFLANG_INVALID's" (plan
    D36).

  It fails: no module. Verify: `pnpm --filter be test:ci -- hreflang-not-reciprocal` fails.
- [ ] 5.2 Move `problemWith` from `hreflang-invalid.check.ts:71-100` to `_shared/hreflang-code.ts`,
  unchanged, so both checks read one validator. Add the check, registered; the catalogue entry
  (warning, Google localized-versions source); `DESCRIBE`. Point the comments at `hreflang-invalid.check.ts:102-115` and
  `seo-issue-catalogue.constant.ts:847-852` at the new code, replacing "reciprocity is
  deliberately not checked". Verify: `pnpm --filter be test:ci -- hreflang && pnpm typecheck`.
- [ ] 5.3 Commit: `feat(page-analysis): hreflang alternates that do not link back`. Verify:
  `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## 6. Field audit, measured cost, and the module document (3f) — plan D12

- [ ] 6.1 Before the audit, record the run outcomes. Verify: `docker compose exec postgres psql -U
  tracker -d seo_tracker -c "select status, error_code, count(*) from crawl_runs group by 1, 2"`
  (`crawl-runs.schema.ts:46`).
- [ ] 6.2 Run the plan §14 protocol for `BROKEN_LINKS`, `LINKS_TO_REDIRECTS`,
  `CANONICAL_TARGET_BROKEN` and `HREFLANG_NOT_RECIPROCAL`. Read every firing against the live URL:
  open the link, follow the target, view the alternate's source. A firing on an internal
  401/402/403/429 or challenge is the plan's O3 trigger; record it as such. Also read every
  `CANONICAL_MISMATCH` the broken-target step-aside removed, to confirm each target was broken
  (plan D34). Verify: the §14
  queries print every firing, and each is judged.
- [ ] 6.3 For each wrong firing, write first a failing spec from that site, then the fix, or
  `enabled: false`. One `fix(page-analysis): …` commit each. Verify: `pnpm --filter be test:ci --
  src/modules/page-analysis`.
- [ ] 6.4 Measure. Verify: `docker compose logs be | grep '"Crawl run stages"'` over the audit's
  runs gives the median and slowest `outbound` timing, and the 6.1 query shows no run that now
  fails with a code it did not fail with before.
- [ ] 6.5 Update the docs:
  - `CRAWL_MODULE.md`: the `outbound` stage (plan D4, D26), `OUTBOUND_CHECK_LIMITS`, robots per
    host, why there is no queue, and the measured timings;
  - `PAGE_ANALYSIS_MODULE.md`: the four tally lines.

  Commit: `docs(crawl): the outbound stage, its budgets and what it costs a crawl`. Verify:
  `git grep -n "outbound" be/src/modules/crawl/CRAWL_MODULE.md`.

## 7. Change acceptance

- [ ] 7.1 Verify: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && docker compose up
  -d --build && curl -fsS http://localhost:8080/api/health`.
- [ ] 7.2 Archive and deposit belong to plan phase 6. Harvest first (plan §18), then archive,
  rewrite the headings, and deposit:
  - CRAWL-011…013 into `CRAWL_MODULE.md`;
  - REMOTE-005 into `practices/be/remote-api-core/SKILL.md`, beside REMOTE-002/003;
  - ANALYSIS-024…027 into `PAGE_ANALYSIS_MODULE.md`.

  Verify: `pnpm exec openspec validate --specs && git grep -n -E "invariant:
  (CRAWL-01[123]|REMOTE-005|ANALYSIS-02[4-7])" -- '*.md'`.
