import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The crawlers that decide whether an AI assistant can find and cite a page — each one
 * the SEARCH crawler of its company, never the training one. GPTBot and Google-Extended
 * govern training, and closing them costs no visibility, so they are not judged.
 * Bingbot is here because Copilot answers from Bing's index.
 */
const AI_SEARCH_CRAWLERS = ['OAI-SearchBot', 'PerplexityBot', 'bingbot'];

/**
 * Which AI search crawlers the site's robots.txt keeps from this page. Not applicable
 * when the file does not govern the page's host, exactly as ROBOTS_BLOCKS_GOOGLEBOT.
 */
export const ROBOTS_BLOCKS_AI_SEARCH_CHECK = defineCheck(
  'ROBOTS_BLOCKS_AI_SEARCH',
  ({ finalUrl, robots }) => {
    const answers = AI_SEARCH_CRAWLERS.map((crawler) => ({
      crawler,
      allowed: robots.allows(finalUrl, crawler),
    }));
    if (answers.some(({ allowed }) => allowed === null)) return NOT_APPLICABLE;
    const blocked = answers.filter(({ allowed }) => allowed === false);
    if (blocked.length === 0) return PASS;
    const path = new URL(finalUrl).pathname;
    return fails({
      crawlers: blocked.map(({ crawler }) => crawler),
      evidence: evidence(
        blocked.map(({ crawler }) => {
          const rule = robots.matchingRule(finalUrl, crawler);
          return rule
            ? `${crawler}: robots.txt ${rule} — matches ${path}`
            : `${crawler}: robots.txt disallows ${path}`;
        }),
      ),
    });
  },
);
