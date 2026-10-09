/**
 * `@app/contracts` — values and wire shapes that `be` and `fe` must agree on.
 *
 * The rule for what belongs here: the backend owns the value, the frontend
 * mirrors it, and a drift between the two would compile on both sides and fail
 * only at runtime. A constant the backend alone reads stays in `be/`.
 *
 * One entry point. Consumers import `@app/contracts` and nothing below it, so a
 * file can move inside `src/` without breaking either application.
 */
export * from './domain/http/api-prefix.constant.js';
export * from './domain/http/api-error-code.constant.js';
export * from './domain/http/health-response.interface.js';
export * from './domain/auth/session-user.interface.js';
export * from './domain/auth/login-request.interface.js';
export * from './domain/time/is-time-zone/is-time-zone.util.js';
export * from './domain/clients/site-key/site-key-of.util.js';
export * from './domain/clients/site-key/is-same-site.util.js';
export * from './domain/clients/website-url/parse-website-url.util.js';
export * from './domain/clients/client.interface.js';
export * from './domain/crawl/crawl-run-status.enum.js';
export * from './domain/crawl/crawl-trigger.enum.js';
export * from './domain/crawl/crawl-item-status.enum.js';
export * from './domain/crawl/crawl-limits.constant.js';
export * from './domain/crawl/crawl-run-error.constant.js';
export * from './domain/crawl/crawl-run.interface.js';
export * from './domain/seo/seo-issue-severity.enum.js';
export * from './domain/seo/seo-issue-catalogue.constant.js';
export * from './domain/seo/seo-measurement.interface.js';
export * from './domain/seo/measured-issue-codes.constant.js';
export * from './domain/seo/conditional-issue-codes.constant.js';
export * from './domain/seo/seo-issue.interface.js';
export * from './domain/seo/score-band.constant.js';
export * from './domain/time/iso-day.type.js';
export * from './domain/time/history-range.constant.js';
export * from './domain/time/is-iso-day/is-iso-day.util.js';
export * from './domain/time/add-days/add-days.util.js';
export * from './domain/time/today-in-zone/today-in-zone.util.js';
export * from './domain/time/day-range-to-utc/day-range-to-utc.util.js';
export * from './domain/pages/keyword-position.interface.js';
export * from './domain/pages/best-position.interface.js';
export * from './domain/pages/page-score/page-score.util.js';
export * from './domain/pages/page-list-item.interface.js';
export * from './domain/pages/page-list-response.interface.js';
export * from './domain/pages/page-list-limits.constant.js';
export * from './domain/pages/page-check.interface.js';
export * from './domain/pages/page-detail.interface.js';
export * from './domain/pages/position-history.interface.js';
export * from './domain/pages/position-fill.interface.js';
export * from './domain/search-updates/search-update.interface.js';
