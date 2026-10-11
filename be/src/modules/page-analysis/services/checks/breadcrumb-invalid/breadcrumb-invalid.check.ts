import type { IBreadcrumbItem } from '../../../interfaces/parsed-page.interface';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Google's breadcrumb documentation: a trail is at least two steps. */
const MIN_ITEMS = 2;

/**
 * What one trail lacks of what Google requires, one line per faulty step.
 *
 * A trail of ONE step is not reported. Google shows no trail for it, and there is none
 * to show: Yoast SEO writes a lone "Home" on every WordPress home page (yoast.com among
 * them, 2026-10), and a finding there would report the plugin, not a defect.
 */
function problemsOf(items: IBreadcrumbItem[]): string[] {
  if (items.length === 1) return [];
  if (items.length < MIN_ITEMS)
    return [
      `BreadcrumbList with no ListItem — at least ${MIN_ITEMS} are required`,
    ];
  return items.flatMap((step, index) => {
    const lacks = [
      ...(step.position === null ? ['integer position'] : []),
      ...(step.name === null ? ['name'] : []),
      // The last step may leave `item` out: Google takes the page's own URL for it.
      ...(step.item === null && index < items.length - 1 ? ['item URL'] : []),
    ];
    return lacks.length === 0
      ? []
      : [
          `ListItem ${index + 1}${step.name ? ` ("${step.name}")` : ''} — no ${lacks.join(', no ')}`,
        ];
  });
}

/** Every JSON-LD BreadcrumbList on the page, against the properties Google requires. */
export const BREADCRUMB_INVALID_CHECK = defineCheck(
  'BREADCRUMB_INVALID',
  ({ parsed }) => {
    if (parsed.breadcrumbs.length === 0) return NOT_APPLICABLE;
    const problems = parsed.breadcrumbs.flatMap(problemsOf);
    return problems.length === 0
      ? PASS
      : fails({ count: problems.length, evidence: evidence(problems) });
  },
);
