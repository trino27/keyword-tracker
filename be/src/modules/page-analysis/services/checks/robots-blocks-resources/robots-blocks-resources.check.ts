import { evidence } from '../_shared/evidence';
import { GOOGLEBOT } from '../_shared/googlebot';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Scripts and stylesheets the page loads that robots.txt keeps from Googlebot. Google
 * renders with what it may fetch, and without them it renders something else.
 *
 * Only resources on a host this robots.txt governs are judged — a CDN has a robots.txt
 * of its own, never read here — and a page loading none from such a host cannot be
 * judged at all.
 */
export const ROBOTS_BLOCKS_RESOURCES_CHECK = defineCheck(
  'ROBOTS_BLOCKS_RESOURCES',
  ({ parsed, robots }) => {
    const judged = parsed.renderResources
      .map((url) => ({ url, allowed: robots.allows(url, GOOGLEBOT) }))
      .filter(({ allowed }) => allowed !== null);
    if (judged.length === 0) return NOT_APPLICABLE;
    const blocked = judged.filter(({ allowed }) => allowed === false);
    return blocked.length === 0
      ? PASS
      : fails({
          count: blocked.length,
          total: judged.length,
          evidence: evidence(
            blocked.map(({ url }) => {
              const rule = robots.matchingRule(url, GOOGLEBOT);
              return rule ? `${url} — robots.txt ${rule}` : url;
            }),
          ),
        });
  },
);
