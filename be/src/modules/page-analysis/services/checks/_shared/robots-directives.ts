import type { ICheckInput } from '../check.interface';
import { attribute } from './evidence';

/** One place the page states robots rules, with the rules in it that Google obeys. */
export interface IRobotsDirectives {
  source: 'meta' | 'header';
  /** For a meta tag: `robots` or `googlebot`. */
  name?: 'robots' | 'googlebot';
  /** As written, for the reader. */
  value: string;
  /** The declaration quoted as markup or header, for a finding's evidence. */
  quote: string;
  /** Lower case, spaces removed: `noindex`, `max-snippet:0`. */
  rules: string[];
}

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

const normalize = (rule: string) =>
  rule.trim().toLowerCase().replace(/\s+/g, '');

/**
 * The rules of an X-Robots-Tag value that Google obeys. A prefix scopes the rules after
 * it to one crawler, so `bingbot: noindex` keeps a page out of Bing and in Google.
 *
 * Several headers arrive joined by commas, so a rule after a scoped one is read as
 * belonging to the same crawler, where Google reads them as separate headers. That can
 * miss a page-wide rule written after a crawler-scoped header; it cannot invent one.
 */
function headerRulesForGoogle(value: string): string[] {
  let agent: string | null = null;
  const rules: string[] = [];
  for (const raw of value.split(',')) {
    let rule = raw.trim();
    const scoped = /^([a-z0-9_-]+)\s*:\s*(.*)$/i.exec(rule);
    if (scoped && !RULES_WITH_VALUE.has(scoped[1].toLowerCase())) {
      agent = scoped[1].toLowerCase();
      rule = scoped[2];
    }
    if (agent === null || agent === 'googlebot') rules.push(normalize(rule));
  }
  return rules.filter(Boolean);
}

/**
 * Every robots declaration Google reads on this page, in the order a reader would look:
 * `<meta name="robots">`, `<meta name="googlebot">` — Google obeys its own name as it
 * obeys the generic one — then the X-Robots-Tag header.
 */
export function robotsDirectivesForGoogle({
  parsed,
  headers,
}: ICheckInput): IRobotsDirectives[] {
  const found: IRobotsDirectives[] = [];
  for (const [name, content] of [
    ['robots', parsed.metaRobots],
    ['googlebot', parsed.metaGooglebot],
  ] as const) {
    if (content)
      found.push({
        source: 'meta',
        name,
        value: content,
        quote: `<meta name="${name}" content="${attribute(content)}">`,
        rules: content.split(',').map(normalize).filter(Boolean),
      });
  }
  const header = headers['x-robots-tag'];
  if (header)
    found.push({
      source: 'header',
      value: header,
      quote: `X-Robots-Tag: ${header}`,
      rules: headerRulesForGoogle(header),
    });
  return found;
}
