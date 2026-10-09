import { evidence } from '../_shared/evidence';
import { GOOGLEBOT } from '../_shared/googlebot';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Cloudflare's own endpoints on every site it fronts: the e-mail address decoder, the
 * challenge and beacon scripts. They draw nothing of the page, and `Disallow: /cdn-cgi/`
 * is the rule Cloudflare's users are told to add — ahrefs.com has it, 2026-10, and was
 * reported for keeping `email-decode.min.js` from Googlebot. Google asks only that what
 * a page needs to render stay fetchable.
 */
const NOT_RENDERING = /^\/cdn-cgi\//;

const rendersThePage = (url: string) => {
  try {
    return !NOT_RENDERING.test(new URL(url).pathname);
  } catch {
    return true;
  }
};

/**
 * Scripts and stylesheets the page loads that robots.txt keeps from Googlebot. Google
 * renders with what it may fetch, and without them it renders something else.
 *
 * Only resources on a host this robots.txt governs are judged — a CDN has a robots.txt
 * of its own, never read here — and Cloudflare's endpoints are not judged at all; a
 * page loading nothing else from such a host cannot be judged.
 */
export const ROBOTS_BLOCKS_RESOURCES_CHECK = defineCheck(
  'ROBOTS_BLOCKS_RESOURCES',
  ({ parsed, robots }) => {
    const judged = parsed.renderResources
      .filter(rendersThePage)
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
