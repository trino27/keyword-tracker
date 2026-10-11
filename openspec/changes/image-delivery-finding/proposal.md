# Images Lighthouse says could be at least 100 KiB lighter, as a finding

## Why

Ahrefs and most auditors tell site owners to serve modern formats and responsive sizes. Guessing
that from markup was rejected: without the CSS it is the same guess that got
images-without-width/height rejected (plan D2). Lighthouse measures it in its image-delivery
audit, and every mobile PageSpeed answer the worker already receives carries that audit. The
interview admitted it as a notice (plan D10), on two conditions:

- the audit fails;
- the estimated savings reach 100 KiB.

It is written by the PageSpeed worker from the mobile answer only, so it carries no new column.
An answer without the audit means no data. It must never be a measurement error, so a Lighthouse
rename cannot break the Core Web Vitals extraction. The audit's id and shape are unknown to this
repository today, because the recorded fixtures are trimmed to the audits already read
(`KEPT_AUDITS` in `be/test/fixtures/record-pagespeed-fixtures.ts`). Reading them from a live
answer is the first task.

Since the plan was first written, `lighthouse-checks` was merged. It made the catalogue a
registry of owners, added a scored Lighthouse owner for SEO and accessibility audits, and moved
the parsing of an answer into `classifyPsiResponse`. This change is re-derived on that tree
(plan D46, D47, D50). Nothing in it reports image weight: no Lighthouse entry, no crawl check
and no stored speed diagnostic (plan §10.13, D36, D50).

## What Changes

- Fixtures:
  - `record-pagespeed-fixtures.ts` keeps the image-delivery audit;
  - two recorded mobile answers, one failing and one passing (or without the audit).
- `@app/contracts`:
  - `IMAGE_DELIVERY_INEFFICIENT` in the pageSpeed owner's catalogue
    (`catalogue/page-speed/page-speed-catalogue.constant.ts`), `strategy: 'mobile'`, notice,
    `min: 102_400`, Lighthouse source; name per plan D16. It is not a Lighthouse-owner code: that
    owner is scored, and speed never enters the score (plan D50);
  - `IImageDeliveryMeasurement` (`value` and `min` in bytes, up to 10 images, plan D23);
  - `TIssueDetails` maps the code to it;
  - the report's whole-site row narrows to `TCwvSeoIssue`, so the code can never be folded
    into one (plan D47).
- `be/src/modules/page-speed`:
  - `extractImageDelivery` (new, pure, its own zod schema);
  - `classifyPsiResponse` puts it on the `measured` outcome as `imageDelivery`, never as a
    condition of `measured` (plan D46);
  - `speedIssuesOf` (new), whose desktop overload takes no image input;
  - the executor calls `speedIssuesOf` in place of `cwvIssuesOf`.
- `be/src/modules/issue-report`: the origin fold reads CWV codes only. REPORT-003 holds as
  written: the finding has no origin source, so it stays at its page.
- `fe`: the `DESCRIBE` sentence (KiB, image count); `imageDeliverySchema`; CWV-only speed
  variants and whole-site row schema.
- Docs: `PAGE_SPEED_MODULE.md` records the live audit id and why absence is no error.

## Capabilities

- `be/src/modules/page-speed` — SPEED-015 (new).

## Impact

Paths affected:

- `be/test/fixtures/{pagespeed,record-pagespeed-fixtures.ts}`;
- `packages/contracts/src/domain/{seo/catalogue,seo,page-speed,issue-report}/**`;
- `be/src/modules/{page-speed,issue-report}/**`;
- `fe/src/{Core/Helpers/DescribeIssue,Gateways/PageGateway,Gateways/IssueReportGateway}/**`.

No migration and no extra PageSpeed call.

It depends on `desktop-core-web-vitals`: the catalogue's `strategy` field, the per-strategy
replace that keeps a mobile-only code out of desktop's set, and the completion per strategy.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 5.
