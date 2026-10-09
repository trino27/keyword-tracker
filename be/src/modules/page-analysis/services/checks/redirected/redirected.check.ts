import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** The statuses that tell Google the move is temporary, so it keeps the old URL. */
const TEMPORARY = new Set([302, 303, 307]);

/**
 * The sitemap URL is not the URL that answered. Every hop is quoted with its status,
 * because the status is half the finding: a 302 tells Google to keep showing the URL
 * the sitemap lists, which is the opposite of what moving a page means.
 */
export const REDIRECTED_CHECK = defineCheck(
  'REDIRECTED',
  ({ url, finalUrl, redirected, redirects }) =>
    redirected
      ? fails({
          from: url,
          to: finalUrl,
          hops: redirects.map(({ url: from, status }) => ({
            url: from,
            status,
          })),
          temporary: redirects.some(({ status }) => TEMPORARY.has(status)),
          evidence: evidence(
            redirects.map(
              ({ url: from, status }, index) =>
                `${status} ${from} → ${redirects[index + 1]?.url ?? finalUrl}`,
            ),
          ),
        })
      : PASS,
);
