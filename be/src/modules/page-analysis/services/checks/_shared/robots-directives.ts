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
  /**
   * The `unavailable_after` instant, when one applies to Google and reads as a date.
   * Kept apart from `rules` because a date's own commas and spaces ("Fri, 25 Jun 2027
   * 15:00:00 PST") are exactly what the rule splitting removes.
   */
  unavailableAfter: Date | null;
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
    if (agent === null || agent === 'googlebot') rules.push(rule.trim());
  }
  return rules.filter(Boolean);
}

/**
 * The date after `unavailable_after:`, read from the raw rules. The date may itself hold
 * commas, so the longest run of following pieces that still parses as a date wins.
 */
function unavailableAfterOf(rawRules: string[]): Date | null {
  const at = rawRules.findIndex((rule) => /^unavailable_after\s*:/i.test(rule));
  if (at === -1) return null;
  const pieces = [
    rawRules[at].replace(/^unavailable_after\s*:\s*/i, ''),
    ...rawRules.slice(at + 1),
  ];
  for (let take = pieces.length; take > 0; take -= 1) {
    const parsed = Date.parse(pieces.slice(0, take).join(','));
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  return null;
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
    if (content) {
      const raw = content.split(',').map((rule) => rule.trim());
      found.push({
        source: 'meta',
        name,
        value: content,
        quote: `<meta name="${name}" content="${attribute(content)}">`,
        rules: raw.map(normalize).filter(Boolean),
        unavailableAfter: unavailableAfterOf(raw),
      });
    }
  }
  const header = headers['x-robots-tag'];
  if (header) {
    const raw = headerRulesForGoogle(header);
    found.push({
      source: 'header',
      value: header,
      quote: `X-Robots-Tag: ${header}`,
      rules: raw.map(normalize),
      unavailableAfter: unavailableAfterOf(raw),
    });
  }
  return found;
}
