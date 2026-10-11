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
repository today, because the recorded fixtures are trimmed to the audits already read. Reading
them from a live answer is the first task.

## What Changes

- Fixtures:
  - `record-pagespeed-fixtures.ts` keeps the image-delivery audit;
  - two recorded mobile answers, one failing and one passing (or without the audit).
- `@app/contracts`:
  - `IMAGE_DELIVERY_INEFFICIENT` (owner pageSpeed, strategy mobile, notice, `min: 102_400`,
    Lighthouse source; name per plan D16);
  - `IImageDeliveryMeasurement` (`value` and `min` in bytes, up to 10 images, plan D23);
  - `TIssueDetails` maps the code to it.
- `be/src/modules/page-speed`:
  - `extractImageDelivery` (new, pure, its own zod schema);
  - `speedIssuesOf(strategy, measurement, imageDelivery)` (new), which writes the code for
    mobile only;
  - the executor passes the answer to both extractors.
- `fe`: the `DESCRIBE` sentence (KiB) and an `imageDeliverySchema` variant.
- Docs: `PAGE_SPEED_MODULE.md` records the live audit id and why absence is no error.

## Capabilities

- `be/src/modules/page-speed` — SPEED-015 (new).

## Impact

Paths affected:

- `be/test/fixtures/{pagespeed,record-pagespeed-fixtures.ts}`;
- `packages/contracts/src/domain/{seo,page-speed}/**`;
- `be/src/modules/page-speed/**`;
- `fe/src/{Core/Helpers/DescribeIssue,Gateways/PageGateway}/**`.

No migration and no extra PageSpeed call.

It depends on `desktop-core-web-vitals`: the catalogue's `strategy` field and the per-strategy
replace that keeps a mobile-only code out of desktop's set.

Plan: `docs/_plans/ahrefs-gap-checks.md`, phase 5.
