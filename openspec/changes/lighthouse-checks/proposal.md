# Lighthouse's SEO and accessibility audits beside our checks, and what Google says about speed

## Why

The tracker already asks PageSpeed Insights about every crawled page, but it reads only the three
Core Web Vitals and the lab performance score out of an answer that holds much more. Two gaps
follow from that:

- **The agency cannot say why a page is slow.** A red LCP says "slow" and nothing else. The same
  answer names the LCP element and the phases its time went to. Google's real-visitor data also
  carries the time to first byte and the share of visits in each band, and we discard both.
- **Our checks cannot be compared with the tool everyone else quotes.** Lighthouse's SEO and
  accessibility categories cost no extra quota when they are requested in the same call. A client
  who runs Lighthouse sees a verdict our screen cannot confirm or contradict.

Earlier, the plan `ahrefs-gap-checks` (D2) rejected the Lighthouse SEO category because it
"duplicates our catalogue". This change reverses that decision on purpose. Every Lighthouse audit
becomes a catalogue code of its own owner and counts in the issues, the report and the score.
Where it duplicates one of our checks, the page detail shows both verdicts in one row.

## What Changes

- **Catalogue owners become a registry.** `@app/contracts`:
  - `ISSUE_CATALOGUES = { crawl, pageSpeed, lighthouse }`, one folder per owner;
  - `TIssueOwner`, `TIssueCodeOf<O>` and each owner's code set are derived from the registry's
    keys;
  - each owner declares whether it is `scored`;
  - the flattened `SEO_ISSUE_CATALOGUE` stamps `owner` from the key;
  - a type-test keeps the owners' code sets disjoint;
  - `TCrawlIssueCode` is no longer `Exclude<…, TPageSpeedIssueCode>`. That definition would make
    every new owner's codes crawl codes.
- **Lighthouse codes (new owner `lighthouse`).**
  - One catalogue code per audit of the SEO and Accessibility categories that can return a
    verdict. `manual` and `informative` audits are left out.
  - Each code declares its audit id and category weight.
  - Severity follows a stated rule: weight ≥ 7 is a warning, any other weight is a notice, and
    `is-crawlable` is an error as an explicit exception.
  - Each code has its own plain copy, hint, explanation and sources.
- **Counterpart groups.** `ISSUE_COUNTERPARTS` lists the groups of codes, across owners, that
  check the same thing. A code is in at most one group. A group is one row on the screen and
  nothing more: both owners' findings still count.
- **The PageSpeed call.**
  - The mobile request asks for `category=performance,seo,accessibility`. A desktop request, once
    `desktop-core-web-vitals` lands, asks for performance only.
  - The worker additionally stores:
    - the Lighthouse verdict lists (`lighthouse_judged`, `lighthouse_not_applicable`);
    - Lighthouse's failed audits as findings;
    - the SEO and Accessibility category scores;
    - field TTFB with its source (url or origin, never lab);
    - the good and poor shares of visits for LCP, INP, CLS and TTFB;
    - the LCP breakdown (`lcp_breakdown_json`: element and phases, lab).

    An answer that lacks the categories or the breakdown stores the Core Web Vitals as before,
    with the new parts null.
- **The score includes Lighthouse.** **BREAKING** for every page that gets measured: the score is
  `(crawl + lighthouse) passed / (crawl + lighthouse) applicable`, computed when read, in the list
  order as well. Core Web Vitals stay out of the score.
- **The wire.** **BREAKING:**
  - `IPageDetail.checks` is replaced by `checksByOwner`, one list per scored owner, each with its
    own `null`;
  - `IPageCheck.code` widens to any scored owner's code;
  - `IPageSpeedMeasurement` gains `ttfb`, a `share` per reading, `lcpBreakdown`, `seoScore` and
    `accessibilityScore`.
- **The page detail.**
  - The checks section has two columns, "Our checks" and "Lighthouse":
    - one row per counterpart group or lone code;
    - rows that are Lighthouse-only follow under "Lighthouse · SEO" and "Lighthouse ·
      Accessibility", with failures first;
    - each column header carries its date, and a null owner gets one line for the whole column;
    - a row whose verdicts disagree carries a marker that explains why they can.
  - The Speed block shows field TTFB, a share bar under each metric, the LCP breakdown marked
    lab, and the two category scores as lab captions.
  - The score explanation says whether Lighthouse is in the number.
- **Pages already measured** keep `null` Lighthouse lists until their next crawl re-queues them.
  There is no requeue command.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `be/src/modules/page-speed`: SPEED-016, SPEED-017, SPEED-018, SPEED-019 (new).
- `be/src/modules/page-analysis`:
  - ANALYSIS-028 and ANALYSIS-029 (new);
  - ANALYSIS-012 (modified): a registry of owners, three of them, some scored.
- `be/src/modules/pages`:
  - PAGES-016 and PAGES-017 (new);
  - PAGES-009 and PAGES-012 (modified): the score and the checks per owner.
- `be/src/modules/issue-report`: REPORT-005 (new).
- `fe/src/Modules/PageDetail`:
  - PAGEDETAIL-013 (new);
  - PAGEDETAIL-009 and PAGEDETAIL-012 (modified).

The MODIFIED blocks restate each requirement whole. At archive they replace the requirement of the
same id in `specs/` by hand.

## Impact

Paths affected:

- `packages/contracts/src/domain/{seo,page-speed,pages}/**`, where the catalogue moves into
  `seo/catalogue/<owner>/`;
- `be/src/persistence/schema/tables/page-speed/**` and one generated migration;
- `be/src/modules/{page-speed,pages,issue-report,page-analysis}/**`;
- `be/test/fixtures/**`, where the recorder keeps the SEO and accessibility audits and the LCP
  breakdown;
- `fe/src/{Gateways,ViewModels,Modules,Core}/**`;
- `PAGE_SPEED_MODULE.md`, `PAGE_ANALYSIS_MODULE.md` and `docs/decisions.md`.

Other consequences:

- **Quota and timing.** PSI quota use is unchanged: one call, as before. Each answer grows from
  roughly 300–700 KB to an estimated 0.5–1 MB, still under `PAGE_SPEED_MAX_BYTES` (8 MB).
- **Score.** Every measured page's score moves once, when its first Lighthouse verdicts land.
  Clients without a PageSpeed key keep crawl-only scores.

Interaction with changes in flight:

- `desktop-core-web-vitals` (not started) also modifies PAGES-014, SPEED-001, SPEED-002,
  SPEED-005, SPEED-007 and PAGEDETAIL-011. This change modifies none of those, so the two can
  land in either order. Whichever lands second applies D16: Lighthouse audits on mobile only, and
  diagnostics per strategy row.
- `image-delivery-finding` reads the same answer. Its `extractImageDelivery` sits beside the
  extractors added here.

The design decisions D1–D19 are recorded in `design.md`.
