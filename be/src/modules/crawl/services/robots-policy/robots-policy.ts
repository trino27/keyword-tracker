import robotsParser from 'robots-parser';
import { CRAWLER_USER_AGENT_TOKEN } from '@infrastructure/remote-api/remote-api.constant';
import type { IRobotsRules } from '@modules/page-analysis/interfaces/robots-rules.interface';

type TRobot = ReturnType<typeof robotsParser>;

/** The records Google reads; every other line is ignored, comments and all. */
const RULE_LINE = /^\s*(?:user-agent|allow|disallow)\s*:/i;

/**
 * What robots.txt allows this crawler. A missing or unreadable robots.txt allows
 * everything — the convention every crawler follows, and the only workable one: most
 * small sites have none.
 */
export class RobotsPolicy implements IRobotsRules {
  private constructor(
    /** The file read once per origin it governs; empty when there is no file. */
    private readonly robots: readonly TRobot[],
    private readonly lines: readonly string[] = [],
    private readonly sitemapUrls: readonly string[] = [],
  ) {}

  /**
   * The rules are read from the file with every line that is not `user-agent`, `allow` or
   * `disallow` blanked. Google ignores such lines, so a `Sitemap:` or `Crawl-delay:`
   * between two `User-agent:` lines leaves them one group; robots-parser ends the group
   * there, and the first agent loses the rules written below. Blanking keeps the line
   * numbers the findings quote. `Sitemap:` lines are read from the file as written.
   *
   * `alsoGoverns` names the other robots.txt addresses the same file answers for: a
   * request for `https://a.example/robots.txt` that redirected to
   * `https://www.a.example/robots.txt` read the www host's own file, and Google applies a
   * redirected robots.txt to the host that asked. robots-parser answers only for the
   * origin it was built with, and a URL no reading governs would read as allowed.
   */
  static parse(
    robotsUrl: string,
    text: string,
    alsoGoverns: readonly string[] = [],
  ): RobotsPolicy {
    const lines = text.split(/\r\n|\r|\n/);
    const rulesOnly = lines
      .map((line) => (RULE_LINE.test(line) ? line : ''))
      .join('\n');
    return new RobotsPolicy(
      [...new Set([robotsUrl, ...alsoGoverns])].map((url) =>
        robotsParser(url, rulesOnly),
      ),
      lines,
      robotsParser(robotsUrl, text).getSitemaps(),
    );
  }

  static allowAll(): RobotsPolicy {
    return new RobotsPolicy([]);
  }

  /** The reading that governs the URL's origin, if any does. */
  private robotFor(url: string): TRobot | undefined {
    return this.robots.find((robot) => robot.isAllowed(url, '*') !== undefined);
  }

  /**
   * Whether this file speaks for the URL's origin. A policy read from no file governs
   * nothing: which origin answered without one is the caller's to remember.
   */
  governs(url: string): boolean {
    return this.robotFor(url) !== undefined;
  }

  isAllowed(url: string): boolean {
    return this.robotFor(url)?.isAllowed(url, CRAWLER_USER_AGENT_TOKEN) ?? true;
  }

  /**
   * The same file read for another crawler — Googlebot, for the checks. A site that
   * answered no robots.txt allows every crawler everything; a URL this file does not
   * govern (another host or scheme) is `null`, not a guess.
   */
  allows(url: string, userAgent: string): boolean | null {
    if (this.robots.length === 0) return true;
    return this.robotFor(url)?.isAllowed(url, userAgent) ?? null;
  }

  matchingRule(url: string, userAgent: string): string | null {
    const line =
      this.robotFor(url)?.getMatchingLineNumber(url, userAgent) ?? -1;
    const text = line > 0 ? this.lines[line - 1]?.trim() : undefined;
    return text ? `line ${line}: ${text}` : null;
  }

  /** `Sitemap:` lines, in file order. */
  sitemaps(): string[] {
    return [...this.sitemapUrls];
  }
}
