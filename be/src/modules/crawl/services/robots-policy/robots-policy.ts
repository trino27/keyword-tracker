import robotsParser from 'robots-parser';
import { CRAWLER_USER_AGENT_TOKEN } from '@infrastructure/remote-api/remote-api.constant';

type TRobot = ReturnType<typeof robotsParser>;

/**
 * What robots.txt allows this crawler. A missing or unreadable robots.txt allows
 * everything — the convention every crawler follows, and the only workable one: most
 * small sites have none.
 */
export class RobotsPolicy {
  private constructor(private readonly robot: TRobot | null) {}

  static parse(robotsUrl: string, text: string): RobotsPolicy {
    return new RobotsPolicy(robotsParser(robotsUrl, text));
  }

  static allowAll(): RobotsPolicy {
    return new RobotsPolicy(null);
  }

  isAllowed(url: string): boolean {
    return this.robot?.isAllowed(url, CRAWLER_USER_AGENT_TOKEN) ?? true;
  }

  /** `Sitemap:` lines, in file order. */
  sitemaps(): string[] {
    return this.robot?.getSitemaps() ?? [];
  }
}
