import robotsParser from 'robots-parser';
import { evidence } from '../checks/_shared/evidence';
import { GOOGLEBOT } from '../checks/_shared/googlebot';
import {
  SITE_NOT_APPLICABLE,
  SITE_PASS,
  type TSiteCheck,
} from './site-check.interface';

/** A rule line in robots.txt, numbered as the file numbers it. */
interface IRule {
  line: number;
  field: string;
  value: string;
  text: string;
}

/** A group: the user agents it names and the rules under them. */
interface IGroup {
  agents: string[];
  rules: IRule[];
}

const FIELD = /^\s*([a-z-]+)\s*:\s*(.*?)\s*(?:#.*)?$/i;

/**
 * robots.txt as groups, the way RFC 9309 reads it: consecutive user-agent lines open a
 * group, the rules after them belong to it, and a user-agent line after a rule opens
 * the next one.
 */
function groupsOf(lines: readonly string[]): IGroup[] {
  const groups: IGroup[] = [];
  let current: IGroup | null = null;
  lines.forEach((text, index) => {
    const match = FIELD.exec(text);
    if (!match) return;
    const field = match[1].toLowerCase();
    const value = match[2];
    if (field === 'user-agent') {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (field === 'allow' || field === 'disallow')) {
      current.rules.push({ line: index + 1, field, value, text: text.trim() });
    }
  });
  return groups;
}

const readable = (input: Parameters<TSiteCheck>[0]) =>
  input.robotsTxt.status === 200;

/** Google reads 500 KiB of robots.txt; the crawl read it the same way and kept the flag. */
export const robotsTxtTruncated: TSiteCheck = (input) => {
  if (!readable(input)) return SITE_NOT_APPLICABLE;
  if (!input.robotsTxt.truncated) return SITE_PASS;
  const lines = input.robotsTxt.lines;
  const last = [...lines].reverse().find((line) => line.trim());
  return {
    outcome: 'fails',
    details: {
      linesRead: lines.length,
      evidence: evidence([
        `robots.txt is longer than 500 KiB; Google stops after line ${lines.length}`,
        ...(last ? [`The last line read: ${last.trim()}`] : []),
      ]),
    },
  };
};

const UNSUPPORTED = /^\s*(noindex|nofollow|host)\s*:/i;

/** Lines Google has never acted on, which their authors believe it does. */
export const robotsTxtUnsupportedRules: TSiteCheck = (input) => {
  if (!readable(input)) return SITE_NOT_APPLICABLE;
  const found = input.robotsTxt.lines
    .map((text, index) => ({ text: text.trim(), line: index + 1 }))
    .filter(({ text }) => UNSUPPORTED.test(text));
  return found.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: {
          count: found.length,
          evidence: evidence(
            found.map(({ line, text }) => `line ${line}: ${text}`),
          ),
        },
      };
};

/** A robots.txt URL the parser accepts; the host never matters, only the paths. */
const ORIGIN = 'https://robots.invalid';

/** A concrete path a pattern matches: wildcards filled, the end anchor dropped. */
const samplePath = (pattern: string) =>
  pattern.replace(/\*/g, 'x').replace(/\$$/, '') || '/';

/**
 * The general group's disallows that Googlebot's own group leaves open. Google follows
 * only the most specific group that names it, so a rule written for everyone does not
 * reach Googlebot once a Googlebot group exists. Each rule is tested by asking the file
 * itself whether Googlebot may fetch a path the rule closes — a broader rule in
 * Googlebot's group that still covers it is not reported.
 */
export const robotsGooglebotGroupDropsRules: TSiteCheck = (input) => {
  if (!readable(input)) return SITE_NOT_APPLICABLE;
  const groups = groupsOf(input.robotsTxt.lines);
  const googlebot = groups.filter(({ agents }) => agents.includes('googlebot'));
  const general = groups.filter(({ agents }) => agents.includes('*'));
  if (googlebot.length === 0 || general.length === 0)
    return SITE_NOT_APPLICABLE;
  const robots = robotsParser(
    `${ORIGIN}/robots.txt`,
    input.robotsTxt.lines.join('\n'),
  );
  const dropped = general
    .flatMap(({ rules }) => rules)
    .filter(({ field, value }) => field === 'disallow' && value !== '')
    .filter(
      ({ value }) =>
        robots.isAllowed(`${ORIGIN}${samplePath(value)}`, GOOGLEBOT) === true &&
        robots.isAllowed(`${ORIGIN}${samplePath(value)}`, 'SomeOtherBot') ===
          false,
    );
  if (dropped.length === 0) return SITE_PASS;
  const groupLine =
    googlebot[0].rules[0]?.line ??
    input.robotsTxt.lines.findIndex((l) => /googlebot/i.test(l)) + 1;
  return {
    outcome: 'fails',
    details: {
      count: dropped.length,
      evidence: evidence([
        ...dropped.map(
          ({ line, text }) =>
            `line ${line}: ${text} — written for User-agent: *, open to Googlebot`,
        ),
        `Googlebot follows only its own group (near line ${groupLine})`,
      ]),
    },
  };
};
