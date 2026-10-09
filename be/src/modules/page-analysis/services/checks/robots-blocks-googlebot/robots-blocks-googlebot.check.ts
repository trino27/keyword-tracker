import { evidence } from '../_shared/evidence';
import { GOOGLEBOT } from '../_shared/googlebot';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Whether the site's robots.txt lets Googlebot fetch this page. The crawl obeyed the same
 * file under its own name to get here, so a page that fails this is one robots.txt opens
 * to this tracker — or to every crawler — and closes to Google.
 *
 * Not applicable when the file does not govern the page's host: nothing was read that
 * could answer.
 */
export const ROBOTS_BLOCKS_GOOGLEBOT_CHECK = defineCheck(
  'ROBOTS_BLOCKS_GOOGLEBOT',
  ({ finalUrl, robots }) => {
    const allowed = robots.allows(finalUrl, GOOGLEBOT);
    if (allowed === null) return NOT_APPLICABLE;
    if (allowed) return PASS;
    const rule = robots.matchingRule(finalUrl, GOOGLEBOT);
    const path = new URL(finalUrl).pathname;
    return fails({
      url: finalUrl,
      rule,
      evidence: evidence([
        rule
          ? `robots.txt ${rule} — matches ${path} for Googlebot`
          : `robots.txt disallows ${path} for Googlebot`,
      ]),
    });
  },
);
