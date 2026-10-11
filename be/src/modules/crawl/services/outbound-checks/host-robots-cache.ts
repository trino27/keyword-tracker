import { isBotChallenge } from '../../constants/site-fetch.constant';
import { RobotsPolicy } from '../robots-policy/robots-policy';

/** What may be asked of one host; null when its robots.txt could not be read. */
export interface IHostAllowance {
  isAllowed(url: string): boolean;
}

export type TFetchRobots = (
  origin: string,
  signal: AbortSignal,
) => Promise<{ status: number; text: string; headers: Record<string, string> }>;

/**
 * robots.txt per host for one crawl's outbound checks (plan D6): the run's own origin
 * answers from the file discovery already read, every other origin is fetched once and
 * remembered, and asks that arrive together share one request.
 *
 * RFC 9309 decides what an answer means: a 4xx (not 429) is no rules at all; a 5xx, a
 * 429, a bot challenge or no answer means the crawler may not assume it is welcome, so
 * the host is not asked — `null`, and its links read "not checked".
 */
export class HostRobotsCache {
  private readonly answers = new Map<string, Promise<IHostAllowance | null>>();

  constructor(
    private readonly ownOrigin: string | null,
    private readonly ownRobots: IHostAllowance,
    private readonly fetchRobots: TFetchRobots,
  ) {}

  policyFor(
    origin: string,
    signal: AbortSignal,
  ): Promise<IHostAllowance | null> {
    if (origin === this.ownOrigin) return Promise.resolve(this.ownRobots);
    let answer = this.answers.get(origin);
    if (!answer) {
      answer = this.read(origin, signal);
      this.answers.set(origin, answer);
    }
    return answer;
  }

  private async read(
    origin: string,
    signal: AbortSignal,
  ): Promise<IHostAllowance | null> {
    try {
      const { status, text, headers } = await this.fetchRobots(origin, signal);
      if (isBotChallenge(headers)) return null;
      if (status === 200)
        return RobotsPolicy.parse(`${origin}/robots.txt`, text);
      if (status >= 400 && status < 500 && status !== 429)
        return RobotsPolicy.allowAll();
      return null;
    } catch {
      return null;
    }
  }
}
