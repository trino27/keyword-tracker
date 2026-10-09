import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** The two rules that drop a page from the index; `none` is `noindex, nofollow`. */
const NOINDEX = /^(noindex|none)$/i;

/**
 * Robots rules that take a value after a colon. In an X-Robots-Tag header anything else
 * before a colon names a crawler (`bingbot: noindex`), and the rules after it are that
 * crawler's alone.
 */
const RULES_WITH_VALUE = new Set([
  'max-snippet',
  'max-image-preview',
  'max-video-preview',
  'unavailable_after',
]);

/** The crawlers whose rules Google obeys: unnamed (everyone) and its own. */
const appliesToGoogle = (agent: string | null) =>
  agent === null || agent === 'googlebot';

const metaSaysNoindex = (content: string) =>
  content.split(',').some((rule) => NOINDEX.test(rule.trim()));

/**
 * Whether an X-Robots-Tag value tells GOOGLE not to index. A prefix scopes the rules
 * after it to one crawler, so `bingbot: noindex` keeps the page out of Bing and in
 * Google — the old reading, which counted any prefix, reported it as gone from both.
 *
 * Several headers arrive joined by commas, so a rule after a scoped one is read as
 * belonging to the same crawler, where Google reads them as separate headers. That can
 * miss a page-wide noindex written after a crawler-scoped header; it cannot invent one.
 */
function headerSaysNoindex(value: string): boolean {
  let agent: string | null = null;
  for (const raw of value.split(',')) {
    let rule = raw.trim();
    const scoped = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(rule);
    if (scoped && !RULES_WITH_VALUE.has(scoped[1].toLowerCase())) {
      agent = scoped[1].toLowerCase();
      rule = scoped[2].trim();
    }
    if (NOINDEX.test(rule) && appliesToGoogle(agent)) return true;
  }
  return false;
}

/**
 * `noindex` or `none` for Google: in `<meta name="robots">`, in `<meta name="googlebot">`
 * — Google obeys its own name as it obeys the generic one — or in an X-Robots-Tag header
 * addressed to everyone or to Googlebot.
 */
export const NOINDEX_CHECK = defineCheck('NOINDEX', ({ parsed, headers }) => {
  const metas = [
    ['robots', parsed.metaRobots],
    ['googlebot', parsed.metaGooglebot],
  ] as const;
  for (const [name, content] of metas) {
    if (content && metaSaysNoindex(content))
      return fails({
        source: 'meta',
        name,
        value: content,
        evidence: evidence([
          `<meta name="${name}" content="${attribute(content)}">`,
        ]),
      });
  }
  const header = headers['x-robots-tag'];
  if (header && headerSaysNoindex(header))
    return fails({
      source: 'header',
      value: header,
      evidence: evidence([`X-Robots-Tag: ${header}`]),
    });
  return PASS;
});
