import { isBotChallenge } from '../../constants/site-fetch.constant';
import { RobotsPolicy } from '../robots-policy/robots-policy';

export type TFetchRobots = (
  origin: string,
  signal: AbortSignal,
) => Promise<{ status: number; text: string; headers: Record<string, string> }>;

/**
 * robots.txt per host for one crawl's outbound checks (plan D6): an origin the run's own
 * file governs answers from it — the origin discovery read it for, and the one its
 * request redirected to — every other origin is fetched once and remembered, and asks
 * that arrive together share one request. The posts' own host is no exception: a client
 * entered as `a.example` whose posts live on `blog.a.example` has the blog host's rules
 * read, not the rules of a file that does not govern it.
 *
 * RFC 9309 decides what an answer means: a 4xx (not 429) is no rules at all; a 5xx, a
 * 429, a bot challenge or no answer means the crawler may not assume it is welcome, so
 * the host is not asked — `null`, and its links read "not checked".
 */
export class HostRobotsCache {
  private readonly answers = new Map<string, Promise<RobotsPolicy | null>>();

  constructor(
    /** The origin the run's robots.txt was requested for. */
    private readonly ownOrigin: string | null,
    private readonly ownRobots: RobotsPolicy,
    private readonly fetchRobots: TFetchRobots,
  ) {}

  policyFor(origin: string, signal: AbortSignal): Promise<RobotsPolicy | null> {
    if (origin === this.ownOrigin || this.ownRobots.governs(`${origin}/`))
      return Promise.resolve(this.ownRobots);
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
  ): Promise<RobotsPolicy | null> {
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
