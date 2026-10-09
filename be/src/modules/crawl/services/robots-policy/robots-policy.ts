import robotsParser from 'robots-parser';
import { CRAWLER_USER_AGENT_TOKEN } from '@infrastructure/remote-api/remote-api.constant';
import type { IRobotsRules } from '@modules/page-analysis/interfaces/robots-rules.interface';

type TRobot = ReturnType<typeof robotsParser>;

/**
 * What robots.txt allows this crawler. A missing or unreadable robots.txt allows
 * everything — the convention every crawler follows, and the only workable one: most
 * small sites have none.
 */
export class RobotsPolicy implements IRobotsRules {
  private constructor(
    private readonly robot: TRobot | null,
    private readonly lines: readonly string[] = [],
  ) {}

  static parse(robotsUrl: string, text: string): RobotsPolicy {
    return new RobotsPolicy(
      robotsParser(robotsUrl, text),
      text.split(/\r\n|\r|\n/),
    );
  }

  static allowAll(): RobotsPolicy {
    return new RobotsPolicy(null);
  }

  isAllowed(url: string): boolean {
    return this.robot?.isAllowed(url, CRAWLER_USER_AGENT_TOKEN) ?? true;
  }

  /**
   * The same file read for another crawler — Googlebot, for the checks. A site that
   * answered no robots.txt allows every crawler everything; a URL this file does not
   * govern (another host or scheme) is `null`, not a guess.
   */
  allows(url: string, userAgent: string): boolean | null {
    if (!this.robot) return true;
    return this.robot.isAllowed(url, userAgent) ?? null;
  }

  matchingRule(url: string, userAgent: string): string | null {
    const line = this.robot?.getMatchingLineNumber(url, userAgent) ?? -1;
    const text = line > 0 ? this.lines[line - 1]?.trim() : undefined;
    return text ? `line ${line}: ${text}` : null;
  }

  /** `Sitemap:` lines, in file order. */
  sitemaps(): string[] {
    return this.robot?.getSitemaps() ?? [];
  }
}
