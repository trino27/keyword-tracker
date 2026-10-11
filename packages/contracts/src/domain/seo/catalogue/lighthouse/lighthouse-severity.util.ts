import type { TSeoIssueSeverity } from '../../seo-issue-severity.enum.js';

/**
 * The audits whose failure is graver than their weight says. `is-crawlable` failing means
 * the page asks to be left out of search — what NOINDEX reports as an error — and
 * Lighthouse weighs it only a little above the rest of its SEO category.
 */
const ERROR_AUDITS: ReadonlySet<string> = new Set(['is-crawlable']);

/**
 * A Lighthouse code's severity, from its audit. Lighthouse's SEO category weighs every
 * audit alike but `is-crawlable`, so every other one is a notice.
 *
 * The accessibility weights are not read: they once made `image-alt` and `document-title`
 * warnings, but the tracker counts Lighthouse's SEO audits only, and a weight borrowed from
 * the accessibility category would count accessibility in the score by the back door.
 */
export function lighthouseSeverityOf(audit: string): TSeoIssueSeverity {
  return ERROR_AUDITS.has(audit) ? 'error' : 'notice';
}
