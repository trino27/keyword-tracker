import type { TSeoIssueSeverity } from '../../seo-issue-severity.enum.js';
import type { TLighthouseCategory } from '../issue-definition.interface.js';

/**
 * The weight from which Lighthouse treats an audit as one of its heavier ones: 10 and 7
 * are what its accessibility category gives the failures that block a visitor outright,
 * 3 and 1 what it gives the rest. SEO weighs every audit 1 but `is-crawlable`.
 */
const WARNING_WEIGHT = 7;

/**
 * The audits whose failure is graver than their weight says. `is-crawlable` failing means
 * the page asks to be left out of search — what NOINDEX reports as an error — and
 * Lighthouse weighs it only a little above the rest of its SEO category.
 */
const ERROR_AUDITS: ReadonlySet<string> = new Set(['is-crawlable']);

/** A Lighthouse code's severity, from its audit and its heaviest weight. */
export function lighthouseSeverityOf(
  audit: string,
  weights: Partial<Record<TLighthouseCategory, number>>,
): TSeoIssueSeverity {
  if (ERROR_AUDITS.has(audit)) return 'error';
  const heaviest = Math.max(0, ...Object.values(weights));
  return heaviest >= WARNING_WEIGHT ? 'warning' : 'notice';
}
